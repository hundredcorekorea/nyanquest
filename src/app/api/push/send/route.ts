import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";
import webpush from "web-push";

// POST /api/push/send — internal: send push to a user (secret-protected)
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-push-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, title, body, url } = await request.json();
  if (!userId || !body) {
    return Response.json({ error: "Missing userId or body" }, { status: 400 });
  }

  webpush.setVapidDetails(
    "mailto:nyanquest@reaf.co",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) {
    return Response.json({ ok: true, sent: 0 });
  }

  const payload = JSON.stringify({
    title: title || "nyanQuest",
    body,
    url: url || "/",
  });

  let sent = 0;
  const stale: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        stale.push(sub.endpoint);
      }
    }
  }

  // Clean up expired subscriptions
  if (stale.length > 0) {
    await admin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .in("endpoint", stale);
  }

  return Response.json({ ok: true, sent });
}
