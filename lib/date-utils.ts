import { format } from "date-fns";

export type FirestoreTimestamp = { 
  _seconds?: number; 
  seconds?: number; 
  nanoseconds?: number 
} | string | number | Date | null | undefined;

/**
 * Converts a Firestore Timestamp, string, number, or Date to a Date object.
 * Returns null if the value cannot be parsed.
 */
export const toDate = (val: FirestoreTimestamp): Date | null => {
  if (!val) return null;

  try {
    let d: Date;

    if (typeof val === 'object' && val !== null) {
      if ('_seconds' in val && typeof val._seconds === 'number') {
        d = new Date(val._seconds * 1000);
      } else if ('seconds' in val && typeof val.seconds === 'number') {
        d = new Date(val.seconds * 1000);
      } else if (val instanceof Date) {
        d = val;
      } else {
        d = new Date(val as unknown as string);
      }
    } else {
      d = new Date(val);
    }

    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

/**
 * Robustly formats a date that could be a Firestore Timestamp, string, number, or Date object.
 * @param dateObj The date-like object to format
 * @param formatStr The date-fns format string
 * @returns Formatted date string or "Unknown"
 */
export const formatDate = (dateObj: FirestoreTimestamp, formatStr: string): string => {
  const d = toDate(dateObj);
  if (!d) return "Unknown";

  try {
    return format(d, formatStr);
  } catch {
    return "Unknown";
  }
};

