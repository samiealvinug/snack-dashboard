/** Supabase Auth uses an internal email identifier, but the shop UI is username-only. */
export function authIdentifierFromUsername(username: string): string {
  const value = username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(value)) {
    throw new Error("Username must be 3–40 characters and use only letters, numbers, dot, underscore or hyphen.");
  }
  return `${value}@username.julienneshop.local`;
}
