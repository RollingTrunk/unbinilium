import { adminDb, admin } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-helpers";
import type { NotificationDispatch } from "@/lib/types/notifications";

export async function GET(req: Request) {
  try {
    try {
      await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");

    let query = adminDb.collection("notification_dispatches")
      .orderBy("timestamp", "desc")
      .limit(limit);

    if (cursor) {
      const cursorDoc = await adminDb.collection("notification_dispatches").doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const dispatches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    })) as NotificationDispatch[];

    // Backfill missing emails for historical records
    const missingEmailIds = dispatches
      .filter(d => d.type === "direct" && !d.recipientEmail && d.recipientId)
      .map(d => d.recipientId as string);

    if (missingEmailIds.length > 0) {
      const uniqueIds = Array.from(new Set(missingEmailIds));
      // Fetch users in chunks of 10
      const userMap: Record<string, string> = {};
      
      for (let i = 0; i < uniqueIds.length; i += 10) {
        const chunk = uniqueIds.slice(i, i + 10);
        const userSnaps = await adminDb.collection("users")
          .where(admin.firestore.FieldPath.documentId(), "in", chunk)
          .get();
        
        userSnaps.forEach(u => {
          userMap[u.id] = u.data().email || "Unknown";
        });
      }

      dispatches.forEach(d => {
        if (d.type === "direct" && !d.recipientEmail && d.recipientId) {
          d.recipientEmail = userMap[d.recipientId] || "Unknown";
        }
      });
    }

    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;
    const hasMore = snapshot.docs.length === limit;

    return NextResponse.json({
      dispatches,
      lastVisible,
      hasMore
    });
  } catch (error: unknown) {
    console.error("Failed to fetch dispatches:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
