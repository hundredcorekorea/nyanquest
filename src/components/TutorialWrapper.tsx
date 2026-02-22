"use client";

import TutorialOverlay, { useTutorialState } from "./TutorialOverlay";

export default function TutorialWrapper() {
  const { showTutorial, dismissTutorial } = useTutorialState();

  if (!showTutorial) return null;

  return <TutorialOverlay onComplete={dismissTutorial} />;
}
