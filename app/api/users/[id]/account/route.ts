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

    const membersSnapshot = await adminDb.collection("accountMembers").where("userId", "==", id).limit(1).get();
    
    if (membersSnapshot.empty) {
      return NextResponse.json({ error: "Account not found for user" }, { status: 404 });
    }

    const accountId = membersSnapshot.docs[0].data().accountId;
    
    if (!accountId) {
      return NextResponse.json({ error: "Account mapping invalid" }, { status: 404 });
    }

    const accountDoc = await adminDb.collection("accounts").doc(accountId).get();
    
    if (!accountDoc.exists) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({
      account: {
        id: accountDoc.id,
        ...accountDoc.data()
      }
    });

  } catch (error: unknown) {
    console.error("Error fetching user account:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
