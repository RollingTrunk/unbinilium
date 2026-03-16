import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-helpers";

const SETTINGS_DOC = "config/global";

export async function GET(req: Request) {
  try {
    try {
      await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const doc = await adminDb.doc(SETTINGS_DOC).get();
    
    // Provide defaults if the doc doesn't exist yet
    const data = doc.exists ? doc.data() : {
      relayWebhookUrl: "",
      relaySecretKey: "", // don't send secret back
      maintenanceMode: false,
      allowRegistrations: true,
      debugLogs: false,
    };
    
    // Omit the actual secret, just send a boolean flag if it exists
    const hasSecret = !!(data?.relaySecretKey);
    
    return NextResponse.json({ ...data, hasSecret, relaySecretKey: "" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    try {
      await getSessionFromRequest(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updates = await req.json();
    
    // Do not overwrite secret if client sends empty string
    if (updates.relaySecretKey === "") {
      delete updates.relaySecretKey;
    }

    await adminDb.doc(SETTINGS_DOC).set(updates, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
