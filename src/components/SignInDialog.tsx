import { useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { db } from "@/lib/db";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";

const googleClientId = import.meta.env.VITE_GOOGLE_ID;
const googleClientName = import.meta.env.VITE_GOOGLE_CLIENT_NAME;

type SignInDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function SignInDialog({
  open,
  onOpenChange,
  onSuccess,
}: SignInDialogProps) {
  const [nonce] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
      setIsSigningIn(false);
    }
    onOpenChange(nextOpen);
  };

  const missingConfig = !googleClientId || !googleClientName;

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent className="sm:max-w-sm">
        <CredenzaHeader>
          <CredenzaTitle>Host sign in</CredenzaTitle>
          <CredenzaDescription>
            Sign in with Google to create decks and launch games.
          </CredenzaDescription>
        </CredenzaHeader>

        {missingConfig ? (
          <p className="text-destructive text-sm">
            Missing VITE_GOOGLE_ID or VITE_GOOGLE_CLIENT_NAME in .env
          </p>
        ) : (
          <div className="space-y-4">
            {error ? (
              <p className="text-destructive text-center text-sm">{error}</p>
            ) : null}

            <div className="flex justify-center">
              <GoogleOAuthProvider clientId={googleClientId}>
                <GoogleLogin
                  nonce={nonce}
                  onError={() => setError("Google sign-in failed. Try again.")}
                  onSuccess={({ credential }) => {
                    if (!credential) {
                      setError("Google sign-in failed. Try again.");
                      return;
                    }

                    setError(null);
                    setIsSigningIn(true);

                    db.auth
                      .signInWithIdToken({
                        clientName: googleClientName,
                        idToken: credential,
                        nonce,
                      })
                      .then(() => {
                        onOpenChange(false);
                        onSuccess?.();
                      })
                      .catch(() => {
                        setError("Sign-in failed. Please try again.");
                      })
                      .finally(() => {
                        setIsSigningIn(false);
                      });
                  }}
                />
              </GoogleOAuthProvider>
            </div>

            {isSigningIn ? (
              <p className="text-center text-xs text-muted-foreground">
                Signing in...
              </p>
            ) : null}
          </div>
        )}
      </CredenzaContent>
    </Credenza>
  );
}
