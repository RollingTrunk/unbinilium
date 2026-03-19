const ALLOWED_DOMAINS = ["rollingtrunk.com", "hest.page"];

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export function isAllowedEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const domain = email.split("@")[1];
  return ALLOWED_DOMAINS.includes(domain) || process.env.NODE_ENV === "development";
}
