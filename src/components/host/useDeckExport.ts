import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  downloadBlob,
  exportBlooketCsv,
  exportGimkitCsv,
  exportKahootXlsx,
  exportSquadGames,
  getExportPreview,
  type DeckExportData,
  type ExportFormat,
} from "@/lib/deck-import-export";

type PendingExport = Exclude<ExportFormat, "squad-games"> | null;

export function useDeckExport(deck: DeckExportData) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<PendingExport>(null);
  const clearPendingTimeoutRef = useRef<number | null>(null);
  const preview = getExportPreview(deck);

  useEffect(() => {
    return () => {
      if (clearPendingTimeoutRef.current != null) {
        window.clearTimeout(clearPendingTimeoutRef.current);
      }
    };
  }, []);

  const clearPendingFormat = useCallback(() => {
    if (clearPendingTimeoutRef.current != null) {
      window.clearTimeout(clearPendingTimeoutRef.current);
    }
    clearPendingTimeoutRef.current = window.setTimeout(() => {
      setPendingFormat(null);
      clearPendingTimeoutRef.current = null;
    }, 150);
  }, []);

  const runExport = useCallback(
    (format: ExportFormat) => {
      try {
        if (format === "squad-games") {
          const file = exportSquadGames(deck);
          downloadBlob(file.blob, file.filename);
          toast.success(
            `Exported as ClassUpGames (${file.extension.toUpperCase()})`,
          );
          return;
        }

        if (preview.exportableCount === 0) {
          toast.error("No exportable questions for this format.");
          return;
        }

        const file =
          format === "kahoot"
            ? exportKahootXlsx(deck)
            : format === "blooket"
              ? exportBlooketCsv(deck)
              : exportGimkitCsv(deck);

        downloadBlob(file.blob, file.filename);
        toast.success(`Exported for ${formatLabel(format)}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Export failed. Try again.",
        );
      }
    },
    [deck, preview.exportableCount],
  );

  const requestThirdPartyExport = useCallback((format: PendingExport) => {
    if (!format) return;
    if (clearPendingTimeoutRef.current != null) {
      window.clearTimeout(clearPendingTimeoutRef.current);
      clearPendingTimeoutRef.current = null;
    }
    setPendingFormat(format);
    window.setTimeout(() => setPreviewOpen(true), 0);
  }, []);

  const confirmPendingExport = useCallback(() => {
    if (!pendingFormat) return;
    runExport(pendingFormat);
    setPreviewOpen(false);
    clearPendingFormat();
  }, [pendingFormat, runExport, clearPendingFormat]);

  const closePreview = useCallback(
    (open: boolean) => {
      setPreviewOpen(open);
      if (!open) {
        clearPendingFormat();
      }
    },
    [clearPendingFormat],
  );

  return {
    preview,
    previewOpen,
    pendingFormat,
    runExport,
    requestThirdPartyExport,
    confirmPendingExport,
    closePreview,
  };
}

function formatLabel(format: ExportFormat): string {
  switch (format) {
    case "kahoot":
      return "Kahoot!";
    case "blooket":
      return "Blooket";
    case "gimkit":
      return "Gimkit";
    default:
      return "ClassUpGames";
  }
}
