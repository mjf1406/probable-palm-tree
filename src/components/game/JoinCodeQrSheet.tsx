import QRCode from "react-qr-code";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { GameCodeDisplay } from "@/components/GameCodeDisplay";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getJoinPageUrl, getJoinUrl } from "@/lib/routes";

type JoinCodeQrSheetProps = {
  code: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JoinCodeQrSheet({
  code,
  open,
  onOpenChange,
}: JoinCodeQrSheetProps) {
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    toast.success("Join code copied!");
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(getJoinUrl(code));
    toast.success("Join link copied!");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Join this game</SheetTitle>
          <SheetDescription>
            Scan the QR code or share the link so players can join at{" "}
            <span className="font-mono text-foreground">{getJoinPageUrl()}</span>
            .
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-6 px-4 pb-4">
          <div className="rounded-xl border bg-card p-4">
            <QRCode
              value={getJoinUrl(code)}
              size={240}
              bgColor="transparent"
              fgColor="currentColor"
              className="h-auto w-full max-w-[240px] text-foreground"
            />
          </div>

          <div className="text-center">
            <p className="mb-2 text-sm text-muted-foreground">Join code</p>
            <GameCodeDisplay code={code} size="xl" />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void handleCopyCode()}>
              <Copy className="size-4" />
              Copy code
            </Button>
            <Button variant="outline" size="sm" onClick={() => void handleCopyLink()}>
              <Copy className="size-4" />
              Copy join link
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
