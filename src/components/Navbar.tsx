import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Gamepad2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isGoogleUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSearchDefaults } from "@/lib/routes";
import { cn } from "@/lib/utils";

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const navLinkActiveClass = "bg-muted text-foreground";

function NavLink({
  to,
  children,
  exact = false,
  onNavigate,
  className,
}: {
  to: string;
  children: ReactNode;
  exact?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      onClick={onNavigate}
      className={cn(navLinkClass, className)}
      activeProps={{
        className: cn(navLinkClass, navLinkActiveClass, className),
      }}
    >
      {children}
    </Link>
  );
}

function AuthActions({ className }: { className?: string }) {
  const { isLoading, user } = db.useAuth();

  if (isLoading || !user || !isGoogleUser(user)) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <p className="max-w-48 truncate text-xs text-muted-foreground">
        {user.email}
      </p>
      <Button variant="outline" size="sm" onClick={() => db.auth.signOut()}>
        Sign out
      </Button>
    </div>
  );
}

function HostNavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { isLoading, user } = db.useAuth();
  const isHost = !isLoading && user && isGoogleUser(user);

  return (
    <>
      <NavLink to="/" exact onNavigate={onNavigate} className={className}>
        My decks
      </NavLink>
      {isHost ? (
        <>
          <NavLink to="/games" onNavigate={onNavigate} className={className}>
            Games
          </NavLink>
          <NavLink to="/high-scores" onNavigate={onNavigate} className={className}>
            My high scores
          </NavLink>
        </>
      ) : null}
    </>
  );
}

function MobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const close = () => onOpenChange(false);
  const { isLoading, user } = db.useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs">
        <nav className="flex flex-col gap-1 px-4 pt-4" aria-label="Main">
          <HostNavLinks onNavigate={close} className="w-full" />
        </nav>
        <SheetFooter className="border-t border-border">
          {!isLoading && user && isGoogleUser(user) ? (
            <>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  close();
                  void db.auth.signOut();
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link to="/login" search={loginSearchDefaults} onClick={close}>
                Sign in
              </Link>
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Gamepad2 className="size-5 text-primary" />
          <span className="hidden sm:inline">Squad Games</span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-3 md:justify-between">
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <HostNavLinks />
          </nav>

          <div className="flex items-center gap-2">
            <AuthActions className="hidden md:flex" />
            <ThemeToggle />
            <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
          </div>
        </div>
      </div>
    </header>
  );
}
