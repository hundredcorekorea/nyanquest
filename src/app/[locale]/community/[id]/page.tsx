import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Post } from "@/types/database";
import PostContent from "./PostContent";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const supabase = await createClient();
  const t = await getTranslations({ locale, namespace: "Community" });
  const { data } = await supabase
    .from("posts")
    .select("title, content")
    .eq("id", id)
    .single();

  if (!data) return { title: "nyanQuest" };

  return {
    title: `${data.title} - nyanQuest ${t("community")}`,
    description: data.content?.slice(0, 160),
    openGraph: {
      title: data.title,
      description: data.content?.slice(0, 160) ?? `nyanQuest ${t("community")}`,
    },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
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
