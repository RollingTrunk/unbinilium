import { adminAuth } from "@/lib/firebase-admin-auth";
import { ALLOWED_DOMAINS, SESSION_COOKIE_NAME } from "./auth-config";

export function isAllowedEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const domain = email.split("@")[1];
  return ALLOWED_DOMAINS.includes(domain);
}

export async function verifySession(cookieValue: string | undefined) {
  if (!cookieValue) {
    throw new Error("No session cookie");
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(cookieValue, true);
    
    if (!isAllowedEmail(decodedClaims.email)) {
      throw new Error("Unauthorized domain");
    }
    
    return decodedClaims;
  } catch (error) {
    throw new Error("Invalid or expired session");
  }
}

export async function getSessionFromRequest(req: Request) {
  // Get the cookies header from the request object
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) {
    throw new Error("No cookies");
  }

  // Find the exact session cookie
  const cookies = cookieHeader.split(";").map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  
  if (!sessionCookie) {
    throw new Error("No session cookie");
  }

  const cookieValue = sessionCookie.split("=")[1];
  return verifySession(cookieValue);
}
