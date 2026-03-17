import type { FirestoreTimestamp } from "@/lib/date-utils";

export interface NotificationDispatch {
  id: string;
  adminEmail: string;
  type: "direct" | "broadcast";
  recipientId: string | null;
  recipientEmail?: string | null;
  title: string;
  body: string;
  sentCount: number;
  timestamp: FirestoreTimestamp;
}
