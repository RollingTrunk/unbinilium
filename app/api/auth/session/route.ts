import { adminAuth } from "@/lib/firebase-admin-auth";
import { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/auth-config";
import { NextResponse } from "next/server";
import { isAllowedEmail } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    // Verify the ID token first
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if the user's email domain is allowed
    if (!isAllowedEmail(decodedIdToken.email)) {
      return NextResponse.json(
        { error: "Unauthorized domain. Please use the organization email address." },
        { status: 403 }
      );
    }

    // Create the session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      maxAge: SESSION_DURATION_MS / 1000, // maxAge in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.delete({
    name: SESSION_COOKIE_NAME,
    path: "/",
  });

  return response;
}
