import { format } from "date-fns";

export type FirestoreTimestamp = { 
  _seconds?: number; 
  seconds?: number; 
  nanoseconds?: number 
} | string | number | Date | null | undefined;

/**
 * Robustly formats a date that could be a Firestore Timestamp, string, number, or Date object.
 * @param dateObj The date-like object to format
 * @param formatStr The date-fns format string
 * @returns Formatted date string or "Unknown"
 */
export const formatDate = (dateObj: FirestoreTimestamp, formatStr: string): string => {
  if (!dateObj) return "Unknown";
  
  try {
    let d: Date;
    
    // Handle Firestore-style timestamp objects
    if (typeof dateObj === 'object' && dateObj !== null) {
      if ('_seconds' in dateObj && typeof dateObj._seconds === 'number') {
        d = new Date(dateObj._seconds * 1000);
      } else if ('seconds' in dateObj && typeof dateObj.seconds === 'number') {
        d = new Date(dateObj.seconds * 1000);
      } else if (dateObj instanceof Date) {
        d = dateObj;
      } else {
        d = new Date(dateObj as unknown as string);
      }
    } else {
      d = new Date(dateObj);
    }

    if (isNaN(d.getTime())) return "Unknown";
    return format(d, formatStr);
  } catch {
    return "Unknown";
  }
};
