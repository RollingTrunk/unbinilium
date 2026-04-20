import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-helpers";
import { logAuditEvent } from "@/lib/audit-logger";

export async function GET(req: Request) {
  try {
    try {
      await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await adminDb.collection("appConfig").doc("blockedDomains").get();
    const domains: string[] = doc.exists ? (doc.data()?.domains ?? []) : [];

    return NextResponse.json({ domains });
  } catch (error: unknown) {
    console.error("Error fetching blocked domains:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let session;
    try {
      session = await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domains } = await req.json();

    if (!Array.isArray(domains)) {
      return NextResponse.json({ error: "domains must be an array" }, { status: 400 });
    }

    // Normalize: lowercase, trim, deduplicate, sort
    const normalized = [...new Set(
      domains
        .map((d: string) => d.toLowerCase().trim())
        .filter((d: string) => d.length > 0)
    )].sort();

    await adminDb.collection("appConfig").doc("blockedDomains").set(
      { domains: normalized },
      { merge: true }
    );

    await logAuditEvent({
      action: "blocklist.updated",
      performedBy: session.email || "unknown",
      details: { count: normalized.length },
    });

    return NextResponse.json({ success: true, count: normalized.length });
  } catch (error: unknown) {
    console.error("Error updating blocked domains:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
