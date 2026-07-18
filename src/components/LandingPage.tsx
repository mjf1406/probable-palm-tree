import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { isGoogleUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { joinSearchDefaults, loginSearchDefaults } from "@/lib/routes";

export function LandingPage() {
  const { user } = db.useAuth();
  const isHost = isGoogleUser(user);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.5_0.134_242.749/0.18),transparent),radial-gradient(ellipse_50%_40%_at_100%_100%,oklch(0.542_0.034_322.5/0.12),transparent),radial-gradient(ellipse_40%_30%_at_0%_80%,oklch(0.588_0.158_241.966/0.1),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-10 flex items-center justify-end px-4 py-4 sm:px-6">
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col items-center justify-center px-6 pb-16 text-center">
        <img
          src="/brand/logo-vertical.webp"
          alt="ClassUpGames"
          className="mb-8 h-52 w-auto object-contain sm:h-64 animate-in fade-in zoom-in-95 duration-700"
        />
        <p className="max-w-md text-balance text-lg text-muted-foreground sm:text-xl animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150 fill-mode-both">
          Games for the whole class built on scientific themes. Class up and play on!
        </p>
        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-both">
          <Button asChild size="lg" className="min-w-44">
            {isHost ? (
              <Link to="/decks">Host a game</Link>
            ) : (
              <Link to="/login" search={loginSearchDefaults}>
                Host a game
              </Link>
            )}
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-44">
            <Link to="/join" search={joinSearchDefaults}>
              Join a game
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
