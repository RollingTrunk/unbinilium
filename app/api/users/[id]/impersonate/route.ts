import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await getSessionFromRequest(request);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Generate a custom token for the user
    const customToken = await adminAuth.createCustomToken(userId);

    return NextResponse.json({ token: customToken });
  } catch (error) {
    console.error("Error generating custom token:", error);
    return NextResponse.json(
      { error: "Failed to generate impersonation token" },
      { status: 500 }
    );
  }
}
