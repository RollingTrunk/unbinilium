import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    const relayUrl = process.env.RELAY_URL;
    const relaySecret = process.env.RELAY_SECRET;

    if (!relayUrl || !relaySecret) {
      return NextResponse.json({ error: "Relay API not configured" }, { status: 500 });
    }

    // Fetch all user IDs to send as recipients
    const usersSnapshot = await adminDb.collection("users").get();
    const recipients = usersSnapshot.docs.map(doc => doc.id);

    if (recipients.length === 0) {
      return NextResponse.json({ sent: 0, message: "No users found to broadcast to." });
    }

    const response = await fetch(relayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-relay-secret": relaySecret,
      },
      body: JSON.stringify({
        type: "system_broadcast",
        accountId: "SYSTEM",
        recipients,
        data: { title, body },
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Relay API error: ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json({ sent: data.sent || 0, message: "Broadcast successful" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
