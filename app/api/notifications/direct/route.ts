import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-helpers";
import { adminDb, admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    let session;
    try {
      session = await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId, title, body } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "User ID, title, and body are required" }, { status: 400 });
    }

    // Fetch recipient email for logging
    let recipientEmail = "Unknown";
    try {
      const userDoc = await adminDb.collection("users").doc(userId).get();
      if (userDoc.exists) {
        recipientEmail = userDoc.data()?.email || "Unknown";
      }
    } catch (e) {
      console.error("Failed to fetch recipient email for logging:", e);
    }

    const relayUrl = process.env.RELAY_URL;
    const relaySecret = process.env.RELAY_SECRET;

    if (!relayUrl || !relaySecret) {
      return NextResponse.json({ error: "Relay API not configured" }, { status: 500 });
    }

    const response = await fetch(relayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-relay-secret": relaySecret,
      },
      body: JSON.stringify({
        type: "system_direct",
        accountId: "SYSTEM",
        recipients: [userId],
        data: { title, body },
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Relay API error: ${errorText}`);
    }

    const data = await response.json();

    // Log the notification dispatch to Firestore
    try {
      await adminDb.collection("notification_dispatches").add({
        adminEmail: session.email,
        adminUid: session.uid,
        type: "direct",
        recipientId: userId,
        recipientEmail,
        title,
        body,
        sentCount: data.sent || 0,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error("Failed to log notification dispatch:", logError);
    }

    return NextResponse.json({ sent: data.sent || 0, message: "Direct notification successful" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
