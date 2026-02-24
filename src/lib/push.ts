/**
 * Fire-and-forget: send push notification to a user via internal API.
 * Call this right after inserting a notification into the DB.
 */
export function sendPushToUser(
  userId: string,
  payload: { title?: string; body: string; url?: string }
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000";

  fetch(`${baseUrl}/api/push/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-push-secret": process.env.ADMIN_SECRET || "",
    },
    body: JSON.stringify({ userId, ...payload }),
  }).catch((err) => console.error("[push] Send failed:", err));
}
