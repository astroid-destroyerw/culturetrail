const SESSION_COOKIE = "cultureTrailAuth";

// In-memory session store — fine for a single-instance hackathon demo.
// Tokens are invalidated on server restart.
const validTokens = new Set<string>();

export function validateToken(token: string): boolean {
  return validTokens.has(token);
}

export function issueToken(): string {
  const token =
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36);
  validTokens.add(token);
  return token;
}

export function revokeToken(token: string): void {
  validTokens.delete(token);
}

export { SESSION_COOKIE };
