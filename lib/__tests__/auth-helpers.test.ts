import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before the module under test is imported
// ---------------------------------------------------------------------------

const mockVerifySessionCookie = vi.fn();

vi.mock("@/lib/firebase-admin-auth", () => ({
  adminAuth: {
    verifySessionCookie: mockVerifySessionCookie,
  },
}));

vi.mock("@/lib/auth-config", () => ({
  SESSION_COOKIE_NAME: "session",
  isAllowedEmail: (email: string | undefined) =>
    email?.endsWith("@allowed.com") ?? false,
}));

// ---------------------------------------------------------------------------
// Import the module AFTER mocks are set up so it picks up the mocked modules
// ---------------------------------------------------------------------------
// We re-import for each describe block that needs a fresh module state by
// using vi.resetModules() in beforeEach where needed.

describe("verifySession", () => {
  const COOKIE = "valid-cookie-value";
  const DECODED_CLAIMS = {
    uid: "user-1",
    email: "admin@allowed.com",
  } as any;

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    mockVerifySessionCookie.mockReset();
    mockVerifySessionCookie.mockResolvedValue(DECODED_CLAIMS);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function getVerifySession() {
    const { verifySession } = await import("@/lib/auth-helpers");
    return verifySession;
  }

  it("throws when no cookie value is provided", async () => {
    const verifySession = await getVerifySession();
    await expect(verifySession(undefined)).rejects.toThrow("No session cookie");
  });

  it("verifies the cookie via Firebase on first call", async () => {
    const verifySession = await getVerifySession();
    const result = await verifySession(COOKIE);

    expect(mockVerifySessionCookie).toHaveBeenCalledOnce();
    expect(result).toEqual(DECODED_CLAIMS);
  });

  it("returns cached claims on subsequent calls within TTL", async () => {
    const verifySession = await getVerifySession();

    await verifySession(COOKIE);
    await verifySession(COOKIE);
    await verifySession(COOKIE);

    // Firebase should only have been called once
    expect(mockVerifySessionCookie).toHaveBeenCalledOnce();
  });

  it("re-verifies with Firebase after the 5-minute TTL expires", async () => {
    const verifySession = await getVerifySession();

    await verifySession(COOKIE);
    expect(mockVerifySessionCookie).toHaveBeenCalledOnce();

    // Advance time past the 5-minute TTL
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    await verifySession(COOKIE);
    expect(mockVerifySessionCookie).toHaveBeenCalledTimes(2);
  });

  it("throws when the email domain is not allowed", async () => {
    mockVerifySessionCookie.mockResolvedValueOnce({
      uid: "user-2",
      email: "hacker@evil.com",
    });
    const verifySession = await getVerifySession();

    await expect(verifySession(COOKIE)).rejects.toThrow(
      "Invalid or expired session"
    );
  });

  it("throws when Firebase rejects the cookie", async () => {
    mockVerifySessionCookie.mockRejectedValueOnce(new Error("Token expired"));
    const verifySession = await getVerifySession();

    await expect(verifySession(COOKIE)).rejects.toThrow(
      "Invalid or expired session"
    );
  });

  it("evicts the cache when it exceeds 1000 entries and keeps the current entry", async () => {
    const verifySession = await getVerifySession();

    // Fill the cache with 1000 distinct cookies
    for (let i = 0; i < 1000; i++) {
      mockVerifySessionCookie.mockResolvedValueOnce(DECODED_CLAIMS);
      await verifySession(`cookie-${i}`);
    }

    // The 1001st cookie should trigger eviction and still succeed
    mockVerifySessionCookie.mockResolvedValueOnce(DECODED_CLAIMS);
    const result = await verifySession("cookie-overflow");
    expect(result).toEqual(DECODED_CLAIMS);

    // After eviction, the first cookie should no longer be cached (miss = new call)
    mockVerifySessionCookie.mockResolvedValueOnce(DECODED_CLAIMS);
    await verifySession("cookie-0");
    // Total calls = 1000 (fill) + 1 (overflow) + 1 (re-verify after eviction)
    expect(mockVerifySessionCookie).toHaveBeenCalledTimes(1002);
  });
});

describe("getSessionFromRequest", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    mockVerifySessionCookie.mockReset();
    mockVerifySessionCookie.mockResolvedValue({
      uid: "user-1",
      email: "admin@allowed.com",
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makeRequest(cookieHeader: string | null) {
    return new Request("http://localhost/api/test", {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  }

  it("throws when there is no cookie header", async () => {
    const { getSessionFromRequest } = await import("@/lib/auth-helpers");
    await expect(getSessionFromRequest(makeRequest(null))).rejects.toThrow(
      "No cookies"
    );
  });

  it("throws when the session cookie is missing from the header", async () => {
    const { getSessionFromRequest } = await import("@/lib/auth-helpers");
    await expect(
      getSessionFromRequest(makeRequest("other=value; unrelated=abc"))
    ).rejects.toThrow("No session cookie");
  });

  it("extracts the session cookie and returns verified claims", async () => {
    const { getSessionFromRequest } = await import("@/lib/auth-helpers");
    const req = makeRequest("session=my-token; other=value");
    const claims = await getSessionFromRequest(req);
    expect(claims.uid).toBe("user-1");
    expect(mockVerifySessionCookie).toHaveBeenCalledOnce();
  });
});
