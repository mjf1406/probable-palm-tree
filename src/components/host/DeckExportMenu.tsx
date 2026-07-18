import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DeckExportData } from "@/lib/deck-import-export";
import { ExportPreviewDialog } from "@/components/host/ExportPreviewDialog";
import { useDeckExport } from "@/components/host/useDeckExport";

type DeckExportMenuProps = {
  deck: DeckExportData;
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  onClick?: (event: React.MouseEvent) => void;
};

export function DeckExportMenu({
  deck,
  trigger,
  align = "end",
  onClick,
}: DeckExportMenuProps) {
  const {
    preview,
    previewOpen,
    pendingFormat,
    runExport,
    requestThirdPartyExport,
    confirmPendingExport,
    closePreview,
  } = useDeckExport(deck);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onClick}
            >
              <Download className="size-4" />
              Export
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} onClick={onClick}>
          <DropdownMenuItem onSelect={() => void runExport("squad-games")}>
            ClassUpGames
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => requestThirdPartyExport("kahoot")}>
            Kahoot!
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => requestThirdPartyExport("blooket")}>
            Blooket
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => requestThirdPartyExport("gimkit")}>
            Gimkit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {pendingFormat ? (
        <ExportPreviewDialog
          open={previewOpen}
          onOpenChange={closePreview}
          format={pendingFormat}
          preview={preview}
          onConfirm={confirmPendingExport}
        />
      ) : null}
    </>
  );
}
