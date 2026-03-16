export const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || "rollingtrunk.com,hest.page")
  .split(",")
  .map((d) => d.trim());

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
