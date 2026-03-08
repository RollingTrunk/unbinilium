import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await req.json();

    if (status === "deactivated") {
      await adminAuth.updateUser(id, { disabled: true });
      await adminDb.collection("users").doc(id).update({ status: "deactivated" });
    } else if (status === "active") {
      await adminAuth.updateUser(id, { disabled: false });
      await adminDb.collection("users").doc(id).update({ status: "active" });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating user status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function deleteQueryInBatches(query: any) {
  const snapshot = await query.get();
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const chunk = docs.slice(i, i + 500);
    const batch = adminDb.batch();
    chunk.forEach((doc: any) => batch.delete(doc.ref));
    await batch.commit();
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Delete related data in safe 500 batches
    await deleteQueryInBatches(adminDb.collection("accountMembers").where("userId", "==", id));
    await deleteQueryInBatches(adminDb.collection("surveys").where("userId", "==", id));
    
    // Expand deletion to other collections where user is the creator
    await deleteQueryInBatches(adminDb.collection("records").where("createdBy", "==", id));
    await deleteQueryInBatches(adminDb.collection("calendarEvents").where("createdBy", "==", id));
    await deleteQueryInBatches(adminDb.collection("tasks").where("createdBy", "==", id));

    // Delete user doc
    await adminDb.collection("users").doc(id).delete();

    // Delete from Auth
    await adminAuth.deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
