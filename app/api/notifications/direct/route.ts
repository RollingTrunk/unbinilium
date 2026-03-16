import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    try {
      await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId, title, body } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "User ID, title, and body are required" }, { status: 400 });
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

    return NextResponse.json({ sent: data.sent || 0, message: "Direct notification successful" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
