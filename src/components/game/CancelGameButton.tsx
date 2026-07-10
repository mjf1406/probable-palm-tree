import {
  Credenza,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CancelGameButtonProps = {
  onCancel: () => void;
  isCancelling?: boolean;
  className?: string;
  label?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
};

export function CancelGameButton({
  onCancel,
  isCancelling = false,
  className,
  label = "Cancel game",
  title = "Cancel this game?",
  description = "All players will be removed from the lobby and this join code will stop working. This cannot be undone.",
  confirmLabel = "Cancel game",
}: CancelGameButtonProps) {
  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
            className,
          )}
          disabled={isCancelling}
        >
          {isCancelling ? "Ending..." : label}
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{title}</CredenzaTitle>
          <CredenzaDescription>{description}</CredenzaDescription>
        </CredenzaHeader>
        <CredenzaFooter>
          <CredenzaClose asChild>
            <Button variant="outline" disabled={isCancelling}>
              Keep game
            </Button>
          </CredenzaClose>
          <Button
            variant="destructive"
            disabled={isCancelling}
            onClick={onCancel}
          >
            {isCancelling ? "Ending..." : confirmLabel}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
