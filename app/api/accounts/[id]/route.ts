import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const accountDoc = await adminDb.collection("accounts").doc(id).get();
    
    if (!accountDoc.exists) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get count of members
    const membersSnapshot = await adminDb.collection("accountMembers").where("accountId", "==", id).count().get();
    const memberCount = membersSnapshot.data().count;

    return NextResponse.json({
      account: {
        id: accountDoc.id,
        ...accountDoc.data(),
        memberCount
      }
    });
  } catch (error: unknown) {
    console.error("Error fetching account:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
