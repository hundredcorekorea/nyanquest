"use client";

import ReportButton from "@/components/ReportButton";
import BlockButton from "@/components/BlockButton";

interface Props {
  targetUserId: string;
}

export default function ProfileActions({ targetUserId }: Props) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <ReportButton reportType="user" targetId={targetUserId} />
      <BlockButton targetUserId={targetUserId} />
    </div>
  );
}
