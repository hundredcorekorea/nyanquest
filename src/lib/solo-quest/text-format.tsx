"use client";

import { Fragment } from "react";

/** Strip [판정 필요: ...] tags from displayed text — these are machine-parsed, not for the player */
export function stripDiceTags(text: string): string {
  return text.replace(/\s*\[판정 필요:[^\]]*\]/g, "").trim();
}

/** Extract scene keywords from [SCENE: ...] tag. Returns null if no tag found. */
export function extractSceneTag(text: string): string | null {
  const match = text.match(/\[SCENE:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : null;
}

/** Strip [SCENE: ...] tags from displayed text */
export function stripSceneTags(text: string): string {
  return text.replace(/\s*\[SCENE:[^\]]*\]/gi, "").trim();
}

/** Strip quest ending tags from displayed text */
export function stripEndTags(text: string): string {
  return text
    .replace(/\s*\[퀘스트 완료\]/g, "")
    .replace(/\s*\[Quest Complete\]/g, "")
    .replace(/\s*\[퀘스트 실패\]/g, "")
    .replace(/\s*\[Quest Failed\]/g, "")
    .trim();
}

/** Render inline markdown: **bold**, *italic*, "dialogue" → JSX */
export function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, or "quoted dialogue" (including Korean quotation marks)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|"([^"]+)"|"([^"]+)")/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push text before this match (narration — slightly dimmer)
    if (match.index > lastIndex) {
      parts.push(
        <span key={`n${lastIndex}`} className="text-gray-300">
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }
    if (match[2]) {
      // **bold**
      parts.push(<strong key={match.index} className="font-bold text-white">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={match.index} className="italic text-gray-200">{match[3]}</em>);
    } else if (match[4] || match[5]) {
      // "dialogue" or \u201Cdialogue\u201D — bright with left accent bar
      const dialogue = match[4] || match[5];
      parts.push(
        <span
          key={match.index}
          className="inline text-white font-medium border-l-2 border-amber-400/60 pl-1.5 ml-0.5"
        >
          &ldquo;{dialogue}&rdquo;
        </span>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`n${lastIndex}`} className="text-gray-300">
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : [<span key="t" className="text-gray-300">{text}</span>];
}
