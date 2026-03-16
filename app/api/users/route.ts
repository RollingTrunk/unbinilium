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
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    
    // In a real scenario, we might need pagination.
    // For now, we fetch the most recent users.
    const usersSnapshot = await adminDb.collection("users")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
      
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
