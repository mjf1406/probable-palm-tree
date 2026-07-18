import { Link, Outlet } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { joinSearchDefaults } from "@/lib/routes";

export function GameLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/join"
            search={joinSearchDefaults}
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <img
              src="/brand/logo-horizontal.webp"
              alt="ClassUpGames"
              className="h-7 w-auto object-contain"
            />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <Outlet />
    </div>
  );
}
