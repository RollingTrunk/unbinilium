import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    try {
      await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const report: any = {
      orphanedMembers: 0,
      orphanedRecords: 0,
      orphanedTasks: 0,
      orphanedEvents: 0,
      orphanedHistory: 0,
      totalToCleanup: 0,
    };

    // 1. Get all accounts to check existence
    const accountsSnapshot = await adminDb.collection("accounts").get();
    const accountIds = new Set(accountsSnapshot.docs.map(doc => doc.id));

    // Helper to count orphaned docs relative to missing accounts
    const countOrphaned = async (collectionName: string) => {
      const snapshot = await adminDb.collection(collectionName).get();
      return snapshot.docs.filter(doc => !accountIds.has(doc.data().accountId)).length;
    };

    report.orphanedMembers = await countOrphaned("accountMembers");
    report.orphanedRecords = await countOrphaned("records");
    report.orphanedTasks = await countOrphaned("tasks");
    report.orphanedEvents = await countOrphaned("calendarEvents");

    report.totalToCleanup = report.orphanedMembers + report.orphanedRecords + report.orphanedTasks + report.orphanedEvents;

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    try {
      await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let count = 0;

    const accountsSnapshot = await adminDb.collection("accounts").get();
    const accountIds = new Set(accountsSnapshot.docs.map(doc => doc.id));

    const deleteOrphaned = async (collectionName: string) => {
      const snapshot = await adminDb.collection(collectionName).get();
      const orphanedDocs = snapshot.docs.filter(doc => !accountIds.has(doc.data().accountId));
      
      for (let i = 0; i < orphanedDocs.length; i += 500) {
        const chunk = orphanedDocs.slice(i, i + 500);
        const batch = adminDb.batch();
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        count += chunk.length;
      }
    };

    await deleteOrphaned("accountMembers");
    await deleteOrphaned("records");
    await deleteOrphaned("tasks");
    await deleteOrphaned("calendarEvents");

    return NextResponse.json({ success: true, cleanedCount: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
