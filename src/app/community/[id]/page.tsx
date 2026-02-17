import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Post } from "@/types/database";
import PostContent from "./PostContent";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("title, content")
    .eq("id", id)
    .single();

  if (!data) return { title: "nyanQuest" };

  return {
    title: `${data.title} - nyanQuest 커뮤니티`,
    description: data.content?.slice(0, 160),
    openGraph: {
      title: data.title,
      description: data.content?.slice(0, 160) ?? "nyanQuest 커뮤니티",
    },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "*, author:profiles!posts_author_id_fkey(nickname, avatar_url, manner_temp), system:trpg_systems(name)"
    )
    .eq("id", id)
    .single();

  if (!post) notFound();

  return <PostContent post={post as unknown as Post} />;
}
