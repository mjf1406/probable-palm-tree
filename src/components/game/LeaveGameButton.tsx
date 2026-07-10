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

type LeaveGameButtonProps = {
  onLeave: () => void;
  isLeaving?: boolean;
  className?: string;
};

export function LeaveGameButton({
  onLeave,
  isLeaving = false,
  className,
}: LeaveGameButtonProps) {
  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(className)}
          disabled={isLeaving}
        >
          {isLeaving ? "Leaving..." : "Leave game"}
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Leave game?</CredenzaTitle>
          <CredenzaDescription>
            You will be removed from the game and need to re-join with the code
            to play again.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaFooter>
          <CredenzaClose asChild>
            <Button variant="outline" disabled={isLeaving}>
              Cancel
            </Button>
          </CredenzaClose>
          <Button
            variant="destructive"
            disabled={isLeaving}
            onClick={onLeave}
          >
            {isLeaving ? "Leaving..." : "Leave game"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
