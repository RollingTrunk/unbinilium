import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

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
