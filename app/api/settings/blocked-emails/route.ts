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

    const doc = await adminDb.collection("appConfig").doc("blockedEmails").get();
    const emails: string[] = doc.exists ? (doc.data()?.emails ?? []) : [];

    return NextResponse.json({ emails });
  } catch (error: unknown) {
    console.error("Error fetching blocked emails:", error);
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

    const { emails } = await req.json();

    if (!Array.isArray(emails)) {
      return NextResponse.json({ error: "emails must be an array" }, { status: 400 });
    }

    // Normalize: lowercase, trim, deduplicate, sort
    const normalized = [...new Set(
      emails
        .map((e: string) => e.toLowerCase().trim())
        .filter((e: string) => e.length > 0 && e.includes("@"))
    )].sort();

    await adminDb.collection("appConfig").doc("blockedEmails").set(
      { emails: normalized },
      { merge: true }
    );

    await logAuditEvent({
      action: "blocklist.updated",
      performedBy: session.email || "unknown",
      details: { type: "emails", count: normalized.length },
    });

    return NextResponse.json({ success: true, count: normalized.length });
  } catch (error: unknown) {
    console.error("Error updating blocked emails:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
