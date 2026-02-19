import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { PartySession } from "@/types/party-session";
import type { PartyMember } from "@/types/database";
import SessionChat from "./SessionChat";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Check party membership
  const { data: membership } = await supabase
    .from("party_members")
    .select("role")
    .eq("party_id", id)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .single();

  if (!membership) redirect(`/party/${id}`);

  // Get active session
  const { data: session } = await supabase
    .from("party_sessions")
    .select("*")
    .eq("party_id", id)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!session) {
    // No active session, redirect to party page
    redirect(`/party/${id}`);
  }

  const typedSession = session as unknown as PartySession;

  // Get party info
  const { data: party } = await supabase
    .from("parties")
    .select("title, creator_id")
    .eq("id", id)
    .single();

  if (!party) notFound();

  // Get party members
  const { data: members } = await supabase
    .from("party_members")
    .select("*, user:profiles(id, nickname, avatar_url, cat_type)")
    .eq("party_id", id)
    .eq("status", "accepted");

  const typedMembers = (members ?? []) as unknown as PartyMember[];

  // Check premium
  const { data: isPremium } = await supabase.rpc("is_premium", {
    p_user_id: user.id,
  });

  return (
    <SessionChat
      session={typedSession}
      partyId={id}
      partyTitle={party.title}
      creatorId={party.creator_id}
      currentUserId={user.id}
      members={typedMembers}
      isPremium={!!isPremium}
    />
  );
}
