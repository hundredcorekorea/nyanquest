/**
 * Lightweight markdown → React renderer for announcements / notices.
 * Handles: headings (##/###), bold (**), italic (*), bullet lists (- / •), and blank-line paragraphs.
 * No external dependencies.
 */

import React from "react";

function inlineRender(text: string): React.ReactNode[] {
  // bold **text** then italic *text*
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2]) {
      // bold
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      // italic
      parts.push(
        <em key={key++} className="italic">
          {match[3]}
        </em>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.length ? parts : [text];
}

interface Props {
  content: string;
  className?: string;
}

export default function SimpleMarkdown({ content, className }: Props) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let listItems: React.ReactNode[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-2">
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line → flush list, add spacing
    if (!trimmed) {
      flushList();
      continue;
    }

    // Heading ### (h3)
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-base font-bold mt-4 mb-1.5">
          {inlineRender(trimmed.slice(4))}
        </h3>,
      );
      continue;
    }

    // Heading ## (h2)
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-lg font-bold mt-5 mb-2">
          {inlineRender(trimmed.slice(3))}
        </h2>,
      );
      continue;
    }

    // Bullet list (- or • or * at start)
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      listItems.push(
        <li key={key++}>{inlineRender(bulletMatch[1])}</li>,
      );
      continue;
    }

    // Normal paragraph line
    flushList();
    elements.push(
      <p key={key++} className="my-1.5">
        {inlineRender(trimmed)}
      </p>,
    );
  }

  flushList();

  return (
    <div className={className}>
      {elements}
    </div>
  );
}
