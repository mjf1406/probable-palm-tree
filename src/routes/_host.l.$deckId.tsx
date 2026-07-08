import { createFileRoute } from "@tanstack/react-router";
import { RequireGoogleAuth } from "@/components/RequireGoogleAuth";
import { LaunchDeckPage } from "@/components/host/LaunchDeckPage";

export const Route = createFileRoute("/_host/l/$deckId")({
  component: LaunchDeckRoute,
});

function LaunchDeckRoute() {
  return (
    <RequireGoogleAuth>
      <LaunchDeckPage />
    </RequireGoogleAuth>
  );
}
