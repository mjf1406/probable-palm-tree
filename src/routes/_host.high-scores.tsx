import { createFileRoute } from "@tanstack/react-router";
import { RequireGoogleAuth } from "@/components/RequireGoogleAuth";
import { HighScoresPage } from "@/components/host/HighScoresPage";

export const Route = createFileRoute("/_host/high-scores")({
  component: HighScoresRoute,
});

function HighScoresRoute() {
  return (
    <RequireGoogleAuth>
      <HighScoresPage />
    </RequireGoogleAuth>
  );
}
