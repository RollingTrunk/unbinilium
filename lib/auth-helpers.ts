import { adminAuth } from "@/lib/firebase-admin-auth";
import { SESSION_COOKIE_NAME, isAllowedEmail } from "./auth-config";
import { createHash } from "crypto";
import type { DecodedIdToken } from "firebase-admin/auth";

// Re-export for backwards compatibility
export { isAllowedEmail } from "./auth-config";

// In-memory cache for verified session claims to avoid repeated network calls
// to Google Identity Toolkit on every API route execution.
const sessionCache = new Map<string, { claims: DecodedIdToken; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function hashCookieValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function verifySession(cookieValue: string | undefined) {
  if (!cookieValue) {
    throw new Error("No session cookie");
  }

  const cacheKey = hashCookieValue(cookieValue);
  const now = Date.now();
  const cached = sessionCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.claims;
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(cookieValue, true);

    if (!isAllowedEmail(decodedClaims.email)) {
      throw new Error("Unauthorized domain");
    }

    sessionCache.set(cacheKey, { claims: decodedClaims, timestamp: now });

    // Evict cache if it grows too large
    if (sessionCache.size > 1000) {
      sessionCache.clear();
      sessionCache.set(cacheKey, { claims: decodedClaims, timestamp: now });
    }

    return decodedClaims;
  } catch (error) {
    throw new Error("Invalid or expired session");
  }
}

export async function getSessionFromRequest(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) {
    throw new Error("No cookies");
  }

  const cookies = cookieHeader.split(";").map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!sessionCookie) {
    throw new Error("No session cookie");
  }

  const cookieValue = sessionCookie.split("=")[1];
  return verifySession(cookieValue);
}
