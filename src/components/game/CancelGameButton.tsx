import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
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
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>
            Keep game
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isCancelling}
            onClick={(event) => {
              event.preventDefault();
              onCancel();
            }}
          >
            {isCancelling ? "Ending..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
