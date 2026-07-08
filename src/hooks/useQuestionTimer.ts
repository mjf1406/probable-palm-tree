import { useEffect, useState } from "react";
import { getTimeRemaining } from "@/lib/game";

export function useQuestionTimer(
  questionStartedAt: number | undefined | null,
  questionTimeSeconds: number,
  isPlaying: boolean,
) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  if (!isPlaying || questionStartedAt == null) {
    return questionTimeSeconds;
  }

  return getTimeRemaining(questionStartedAt, questionTimeSeconds, now);
}
