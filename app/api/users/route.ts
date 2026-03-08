import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    
    // In a real scenario, we might need pagination.
    // For now, we fetch the most recent users.
    const usersSnapshot = await adminDb.collection("users")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
      
    const users = usersSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
