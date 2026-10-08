// Shared helpers for promo codes restricted to specific customer emails.
// `allowedEmails` is stored as a JSON array string on the row (or null for
// "open to everyone") rather than a separate table, since it's just a
// short admin-entered list, not something queried independently.

/** Normalizes a raw list of typed emails for storage — null means unrestricted. */
export function normalizeAllowedEmails(allowedEmails: unknown): string | null {
  if (!Array.isArray(allowedEmails)) return null;
  const cleaned = Array.from(new Set(
    allowedEmails
      .map((e) => typeof e === 'string' ? e.trim().toLowerCase() : '')
      .filter(Boolean)
  ));
  return cleaned.length > 0 ? JSON.stringify(cleaned) : null;
}

/** Parses the stored JSON array back out for display in the admin UI. */
export function parseAllowedEmails(stored: string | null): string[] {
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** True if the code is unrestricted, or the given email is on its allow-list. */
export function isEmailAllowedForPromo(allowedEmailsStored: string | null, email: string | null | undefined): boolean {
  const allowed = parseAllowedEmails(allowedEmailsStored);
  if (allowed.length === 0) return true;
  if (!email) return false;
  return allowed.includes(email.trim().toLowerCase());
}
