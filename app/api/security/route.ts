import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    try {
      await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    // --- Firebase Auth metrics ---
    const unverifiedUsers: { uid: string; email: string; createdAt: string }[] = [];
    let providerBreakdown: Record<string, number> = {
      password: 0,
      "google.com": 0,
      "apple.com": 0,
      other: 0,
    };

    let pageToken: string | undefined = undefined;
    do {
      const listResult = await adminAuth.listUsers(1000, pageToken);
      pageToken = listResult.pageToken;

      for (const user of listResult.users) {
        // Provider breakdown
        const primaryProvider = user.providerData[0]?.providerId;
        if (primaryProvider && primaryProvider in providerBreakdown) {
          providerBreakdown[primaryProvider]++;
        } else {
          providerBreakdown.other++;
        }

        // Stale unverified password users (> 24h old)
        if (!user.emailVerified) {
          const isPassword = user.providerData.some(p => p.providerId === "password");
          const createdAt = new Date(user.metadata.creationTime).getTime();
          if (isPassword && now - createdAt > TWENTY_FOUR_HOURS_MS) {
            unverifiedUsers.push({
              uid: user.uid,
              email: user.email || "—",
              createdAt: user.metadata.creationTime,
            });
          }
        }
      }
    } while (pageToken);

    // --- Firestore metrics ---
    const usersSnap = await adminDb.collection("users").get();
    const membersSnap = await adminDb.collection("accountMembers").get();
    const usersWithHousehold = new Set(membersSnap.docs.map(d => d.data().userId));

    // Orphaned users: have a Firestore doc but no membership and > 48h old
    const orphanedUsers: { id: string; name: string; email: string; createdAt: string }[] = [];
    for (const doc of usersSnap.docs) {
      if (!usersWithHousehold.has(doc.id)) {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.()?.getTime?.() ?? 0;
        if (now - createdAt > 2 * TWENTY_FOUR_HOURS_MS) {
          orphanedUsers.push({
            id: doc.id,
            name: (data.name as string) || "Unknown",
            email: (data.email as string) || "—",
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? "—",
          });
        }
      }
    }

    // Signup trend: users created in last 7 days, bucketed by day
    const sevenDaysAgo = now - SEVEN_DAYS_MS;
    const signupsByDay: Record<string, number> = {};
    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.()?.getTime?.() ?? 0;
      if (createdAt > sevenDaysAgo) {
        const dayKey = new Date(createdAt).toISOString().slice(0, 10);
        signupsByDay[dayKey] = (signupsByDay[dayKey] || 0) + 1;
      }
    }

    // Recent audit log entries
    const auditSnap = await adminDb.collection("auditLog")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();
    
    const recentAuditEvents = auditSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.()?.toISOString?.() ?? null,
    }));

    // Blocked domains
    const blockedDoc = await adminDb.collection("appConfig").doc("blockedDomains").get();
    const blockedDomains: string[] = blockedDoc.exists ? (blockedDoc.data()?.domains ?? []) : [];

    return NextResponse.json({
      unverifiedUsers,
      orphanedUsers,
      providerBreakdown,
      signupsByDay,
      recentAuditEvents,
      blockedDomains,
    });
  } catch (error: unknown) {
    console.error("Error fetching security metrics:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
