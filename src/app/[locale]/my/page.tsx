"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile, Party, UserTitle } from "@/types/database";
import { useToast } from "@/components/Toast";
import { usePremium } from "@/hooks/usePremium";
import { TITLES, getTitleDef } from "@/lib/titles";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import PlayProfileDisplay from "@/components/PlayProfileDisplay";
import PlayProfileEditor from "@/components/PlayProfileEditor";
import type { FavoriteWork } from "@/types/database";

async function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = maxSize;
      canvas.height = maxSize;
      const ctx = canvas.getContext("2d")!;

      // Center crop
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, maxSize, maxSize);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/webp",
        0.85
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function MyPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const { isPremium, isTrial, trialDaysLeft, subscription } = usePremium();
  const t = useTranslations("MyPage");
  const tCommon = useTranslations("Common");
  const tStatus = useTranslations("Status");
  const tPlayProfile = useTranslations("PlayProfile");
  const locale = useLocale();
  const dateLocale = locale === "ko" ? "ko-KR" : "en-US";
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [joinedParties, setJoinedParties] = useState<Party[]>([]);
  const [editing, setEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"my" | "joined">("my");
  const [uploading, setUploading] = useState(false);
  const [earnedTitles, setEarnedTitles] = useState<UserTitle[]>([]);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [editingPlayProfile, setEditingPlayProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CAT_LEVELS = [
    { min: 0, name: t("catLevels.babyCat"), emoji: "🐱", title: t("catTitles.newbornAdventurer") },
    { min: 50, name: t("catLevels.apprenticeCat"), emoji: "😺", title: t("catTitles.curiousExplorer") },
    { min: 150, name: t("catLevels.adventurerCat"), emoji: "😸", title: t("catTitles.reliablePartyMember") },
    { min: 300, name: t("catLevels.veteranCat"), emoji: "😼", title: t("catTitles.veteranDiceRoller") },
    { min: 500, name: t("catLevels.archmage"), emoji: "🧙‍♂️", title: t("catTitles.legendaryButler") },
  ];

  function getCatLevel(exp: number) {
    for (let i = CAT_LEVELS.length - 1; i >= 0; i--) {
      if (exp >= CAT_LEVELS[i].min) return CAT_LEVELS[i];
    }
    return CAT_LEVELS[0];
  }

  function getNextLevel(exp: number) {
    for (const level of CAT_LEVELS) {
      if (exp < level.min) return level;
    }
    return null;
  }

  const STYLE_OPTIONS = [
    t("styleTags.narrativeFocus"),
    t("styleTags.combatFocus"),
    t("styleTags.exploration"),
    t("styleTags.roleplayFanatic"),
    t("styleTags.newbieWelcome"),
    t("styleTags.ruleOriented"),
    t("styleTags.improviser"),
    t("styleTags.planner"),
  ];

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (prof) {
        setProfile(prof);
        setEditNickname(prof.nickname);
        setEditTags(prof.style_tags ?? []);
      }

      // Load earned titles
      const { data: titles } = await supabase
        .from("user_titles")
        .select("*")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: true });
      if (titles) setEarnedTitles(titles);

      // My parties (as creator)
      const { data: myParties } = await supabase
        .from("parties")
        .select("*, system:trpg_systems(name)")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });
      if (myParties) setParties(myParties as unknown as Party[]);

      // Joined parties (as member, excluding my own created parties)
      const { data: memberships } = await supabase
        .from("party_members")
        .select("party_id")
        .eq("user_id", user.id)
        .in("status", ["accepted", "pending"]);

      if (memberships && memberships.length > 0) {
        const myPartyIds = new Set((myParties ?? []).map((p: { id: string }) => p.id));
        const ids = memberships
          .map((m) => m.party_id)
          .filter((pid) => !myPartyIds.has(pid));
        if (ids.length > 0) {
          const { data: joined } = await supabase
            .from("parties")
            .select("*, system:trpg_systems(name)")
            .in("id", ids)
            .order("created_at", { ascending: false });
          if (joined) setJoinedParties(joined as unknown as Party[]);
        }
      }
    };
    load();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast(t("avatarUploadSizeError"), "error");
      return;
    }

    setUploading(true);
    try {
      const resized = await resizeImage(file, 256);
      const path = `${user.id}/avatar.webp`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, resized, { upsert: true, contentType: "image/webp" });

      if (uploadError) {
        toast(t("avatarUploadFailed", { error: uploadError.message }), "error");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const avatarUrl = urlData.publicUrl + "?t=" + Date.now();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (updateError) {
        toast(t("profileUpdateFailed", { error: updateError.message }), "error");
        return;
      }

      setProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : prev));
      toast(t("avatarChanged"), "success");
    } catch {
      toast(t("imageProcessError"), "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetTitle = async (titleId: string | null) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ active_title: titleId, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      toast(t("titleChangeFailed", { error: error.message }), "error");
      return;
    }
    setProfile((prev) => (prev ? { ...prev, active_title: titleId } : prev));
    setShowTitleModal(false);
    toast(titleId ? t("titleChanged") : t("titleRemoved"), "success");
  };

  const handleSave = async () => {
    if (!user || !editNickname.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nickname: editNickname.trim(),
        style_tags: editTags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast(t("saveFailed", { error: error.message }), "error");
    } else {
      setProfile((prev) =>
        prev
          ? { ...prev, nickname: editNickname.trim(), style_tags: editTags }
          : prev
      );
      setEditing(false);
    }
    setSaving(false);
  };

  const toggleTag = (tag: string) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (!user) {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-gray-600 font-medium">{tCommon("loginRequired")}</p>
        <p className="text-sm text-gray-400 mt-1">
          {tCommon("loginRequiredDesc")}
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 pb-24">
        <div className="text-4xl animate-bounce">🐱</div>
        <p className="text-sm text-gray-400 mt-2">{tCommon("loading")}</p>
      </div>
    );
  }

  const catLevel = getCatLevel(profile.cat_exp);
  const nextLevel = getNextLevel(profile.cat_exp);
  const progress = nextLevel
    ? ((profile.cat_exp - catLevel.min) / (nextLevel.min - catLevel.min)) * 100
    : 100;

  const activeTitleDef = profile.active_title ? getTitleDef(profile.active_title) : null;
  const earnedTitleIds = new Set(earnedTitles.map((t) => t.title_id));

  const statusColors: Record<string, string> = {
    recruiting: "text-orange-600",
    filled: "text-gray-500",
    completed: "text-green-600",
    cancelled: "text-red-500",
  };
  const statusLabels: Record<string, string> = {
    recruiting: tStatus("recruiting"),
    filled: tStatus("filled"),
    completed: tStatus("completed"),
    cancelled: tStatus("cancelled"),
  };

  return (
    <div className="pb-24 space-y-6">
      {/* Cat & Profile Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6">
        <div className="flex items-start gap-4">
          {/* Cat avatar — clickable for upload */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-amber-100 overflow-hidden group"
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover"
                />
              ) : (
                catLevel.emoji
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <span className="text-xs font-medium text-amber-600">
              {catLevel.name}
            </span>
          </div>

          {/* Profile info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  maxLength={20}
                />
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        editTags.includes(tag)
                          ? "bg-amber-400 text-white"
                          : "bg-white border border-gray-200 text-gray-500"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    {saving ? tCommon("saving") : tCommon("save")}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditNickname(profile.nickname);
                      setEditTags(profile.style_tags ?? []);
                    }}
                    className="px-4 py-1.5 border border-gray-200 text-xs text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {tCommon("cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-gray-900 truncate">
                    {profile.nickname}
                  </h2>
                  {isPremium && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                      Premium
                    </span>
                  )}
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-amber-500 hover:text-amber-600"
                  >
                    {tCommon("edit")}
                  </button>
                </div>

                {/* Active title */}
                <button
                  onClick={() => setShowTitleModal(true)}
                  className="flex items-center gap-1 mt-0.5 group"
                >
                  {activeTitleDef ? (
                    <span className="text-xs text-amber-600 font-medium">
                      {activeTitleDef.emoji} {locale === "ko" ? activeTitleDef.name : activeTitleDef.nameEn}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {catLevel.title}
                    </span>
                  )}
                  <span className="text-xs text-gray-300 group-hover:text-amber-400 transition-colors">
                    {t("change")}
                  </span>
                </button>

                {/* Style tags */}
                {profile.style_tags && profile.style_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.style_tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-white/80 text-amber-700 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-400">{t("mannerTemp")}</p>
                    <p className="text-sm font-bold text-amber-600">
                      {profile.manner_temp}°
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t("experience")}</p>
                    <p className="text-sm font-bold text-amber-600">
                      {profile.cat_exp} EXP
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t("titlesCount")}</p>
                    <p className="text-sm font-bold text-amber-600">
                      {earnedTitles.length}/{TITLES.length}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* EXP bar */}
        {!editing && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{catLevel.name}</span>
              <span>{nextLevel ? nextLevel.name : tCommon("max")}</span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Play Profile */}
      {editingPlayProfile ? (
        <PlayProfileEditor
          userId={user.id}
          initialWorks={profile.favorite_works ?? []}
          initialPreferred={profile.preferred_elements ?? []}
          initialAvoided={profile.avoided_elements ?? []}
          onSave={(works, preferred, avoided) => {
            setProfile((prev) =>
              prev
                ? { ...prev, favorite_works: works, preferred_elements: preferred, avoided_elements: avoided }
                : prev
            );
            setEditingPlayProfile(false);
          }}
          onCancel={() => setEditingPlayProfile(false)}
        />
      ) : (profile.favorite_works?.length > 0 ||
          profile.preferred_elements?.length > 0 ||
          profile.avoided_elements?.length > 0) ? (
        <div className="space-y-2">
          <PlayProfileDisplay
            favoriteWorks={profile.favorite_works ?? []}
            preferredElements={profile.preferred_elements ?? []}
            avoidedElements={profile.avoided_elements ?? []}
          />
          <button
            onClick={() => setEditingPlayProfile(true)}
            className="text-xs text-amber-500 hover:text-amber-600 font-medium"
          >
            ✏️ {tCommon("edit")}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditingPlayProfile(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-amber-200 text-sm font-medium text-amber-500 hover:bg-amber-50 transition-colors"
        >
          🎭 {tPlayProfile("empty")} — {tPlayProfile("writeNow")}
        </button>
      )}

      {/* Premium subscription card */}
      {isPremium && subscription ? (
        <Link href="/premium">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div>
                  <p className="text-sm font-bold text-purple-700">{t("premiumActive")}</p>
                  <p className="text-xs text-gray-500">
                    {t("premiumActiveUntil", { date: new Date(subscription.expires_at).toLocaleDateString(dateLocale) })}
                  </p>
                </div>
              </div>
              <span className="text-xs text-purple-500">{t("premiumManage")} &rarr;</span>
            </div>
          </div>
        </Link>
      ) : isPremium && isTrial ? (
        <Link href="/premium">
          <div className={`rounded-2xl border p-4 hover:shadow-md transition-all ${
            trialDaysLeft <= 3
              ? "bg-gradient-to-r from-orange-100 to-red-100 border-orange-300"
              : "bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{trialDaysLeft <= 3 ? "⏳" : "🎁"}</span>
                <div>
                  <p className={`text-sm font-bold ${trialDaysLeft <= 3 ? "text-orange-700" : "text-purple-700"}`}>
                    {t("premiumTrialActive")}
                  </p>
                  <p className={`text-xs ${trialDaysLeft <= 3 ? "text-orange-600 font-medium" : "text-purple-500"}`}>
                    {t("premiumTrialDays", { days: trialDaysLeft })}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-medium ${trialDaysLeft <= 3 ? "text-orange-600" : "text-purple-500"}`}>
                {t("premiumTrialSubscribe")} &rarr;
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <Link href="/premium">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t("premiumSubscribe")}</p>
                  <p className="text-xs text-gray-500">{t("premiumSubscribeDesc")}</p>
                </div>
              </div>
              <span className="text-xs text-purple-500">{t("premiumView")} &rarr;</span>
            </div>
          </div>
        </Link>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
        <button
          onClick={() => setTab("my")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "my"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-gray-500"
          }`}
        >
          {t("myAdventures", { count: parties.length })}
        </button>
        <button
          onClick={() => setTab("joined")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "joined"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-gray-500"
          }`}
        >
          {t("joinedAdventures", { count: joinedParties.length })}
        </button>
      </div>

      {/* Party list */}
      <div className="space-y-2">
        {(tab === "my" ? parties : joinedParties).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">😿</div>
            <p className="text-sm text-gray-400">
              {tab === "my"
                ? t("noMyAdventures")
                : t("noJoinedAdventures")}
            </p>
            {tab === "my" && (
              <Link
                href="/create"
                className="inline-block mt-3 px-4 py-2 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors"
              >
                {t("createFirstAdventure")}
              </Link>
            )}
          </div>
        ) : (
          (tab === "my" ? parties : joinedParties).map((p) => (
            <Link key={p.id} href={tab === "my" ? `/party/${p.id}/manage` : `/party/${p.id}`}>
              <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {p.system?.name ?? p.custom_system_name ?? tCommon("undecided")}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span
                        className={`text-xs font-medium ${statusColors[p.status]}`}
                      >
                        {statusLabels[p.status]}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">
                        {p.current_players}/{p.max_players}{tCommon("personUnit")}
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-300 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Title selection modal */}
      {showTitleModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowTitleModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{t("titleSelect")}</h3>
              <button
                onClick={() => setShowTitleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-2">
              {/* Clear title option */}
              <button
                onClick={() => handleSetTitle(null)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  !profile.active_title
                    ? "border-amber-300 bg-amber-50"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">🐱</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t("defaultTitle")}</p>
                    <p className="text-xs text-gray-400">{catLevel.title}</p>
                  </div>
                </div>
              </button>

              {TITLES.map((title) => {
                const earned = earnedTitleIds.has(title.id);
                const isActive = profile.active_title === title.id;
                return (
                  <button
                    key={title.id}
                    onClick={() => earned && handleSetTitle(title.id)}
                    disabled={!earned}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      isActive
                        ? "border-amber-300 bg-amber-50"
                        : earned
                        ? "border-gray-100 hover:bg-gray-50"
                        : "border-gray-50 bg-gray-50/50 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg w-8 text-center ${!earned ? "grayscale" : ""}`}>
                        {title.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${earned ? "text-gray-900" : "text-gray-400"}`}>
                            {locale === "ko" ? title.name : title.nameEn}
                          </p>
                          {isActive && (
                            <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">
                              {t("inUse")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {earned
                            ? (locale === "ko" ? title.description : title.descriptionEn)
                            : `🔒 ${locale === "ko" ? title.condition : title.conditionEn}`}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
