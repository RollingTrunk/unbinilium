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

    // Get members
    const membersSnapshot = await adminDb.collection("accountMembers").where("accountId", "==", id).get();
    const memberCount = membersSnapshot.size;
    const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);
    
    const members: { id: string; name: string; email: string }[] = [];
    if (memberIds.length > 0) {
      // Chunk memberIds because where-in is limited to 30 items
      const chunks = [];
      for (let i = 0; i < memberIds.length; i += 30) {
        chunks.push(memberIds.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        const usersSnapshot = await adminDb.collection("users")
          .where("__name__", "in", chunk)
          .get();
        
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          members.push({
            id: doc.id,
            name: data.displayName || data.name || "Unknown User",
            email: data.email || ""
          });
        });
      }
    }

    return NextResponse.json({
      account: {
        id: accountDoc.id,
        ...accountDoc.data(),
        memberCount,
        members
      }
    });
  } catch (error: unknown) {
    console.error("Error fetching account:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
