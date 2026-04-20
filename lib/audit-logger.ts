import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type AuditAction =
  | "user.deactivated"
  | "user.reactivated"
  | "user.deleted"
  | "cleanup.executed"
  | "blocklist.updated";

interface AuditLogEntry {
  action: AuditAction;
  /** Admin email who performed the action */
  performedBy: string;
  /** ID of the target user or resource (if applicable) */
  targetId?: string;
  /** Additional context about the action */
  details?: Record<string, unknown>;
}

/**
 * Records an administrative action to the `auditLog` Firestore collection.
 * This collection is only accessible via the Admin SDK (blocked in security rules).
 *
 * Fire-and-forget by design — audit failures should never block admin operations.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await adminDb.collection("auditLog").add({
      ...entry,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Audit logging should never throw and block the caller.
    console.error("[audit-logger] Failed to write audit log:", error);
  }
}
