import { createFileRoute } from "@tanstack/react-router";
import { RequireGoogleAuth } from "@/components/RequireGoogleAuth";
import { GamesPage } from "@/components/host/GamesPage";

export const Route = createFileRoute("/_host/games")({
  component: GamesRoute,
});

function GamesRoute() {
  return (
    <RequireGoogleAuth>
      <GamesPage />
    </RequireGoogleAuth>
  );
}
