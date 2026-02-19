import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "로그인이 필요하다냥!" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .single();

  if (!sub) {
    return Response.json(
      { error: "활성 구독이 없다냥" },
      { status: 404 }
    );
  }

  // Mark as cancelled but keep active until expires_at
  await admin
    .from("subscriptions")
    .update({
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  return Response.json({ ok: true, expiresAt: sub.expires_at });
}
