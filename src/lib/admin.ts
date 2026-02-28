/** Admin user IDs — comma-separated in ADMIN_USER_IDS env var */
const ADMIN_IDS = new Set(
  (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean)
);

/** Returns true if the user is an admin (bypasses daily quest limits etc.) */
export function isAdmin(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return ADMIN_IDS.has(userId);
}
