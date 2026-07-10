import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import {
  formatSkippedTypeSummary,
  type ExportFormat,
  type ExportPreview,
} from "@/lib/deck-import-export";

const PLATFORM_NOTES: Record<Exclude<ExportFormat, "squad-games">, string> = {
  kahoot:
    "Only multiple choice and true/false questions are exported. Kahoot supports up to 4 answers per question.",
  blooket:
    "Only multiple choice and true/false questions are exported. Blooket imports CSV with up to 4 answers per question.",
  gimkit:
    "Only multiple choice and true/false questions are exported. Gimkit uses one correct answer and up to three incorrect answers.",
};

type ExportPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: Exclude<ExportFormat, "squad-games">;
  preview: ExportPreview;
  onConfirm: () => void;
};

export function ExportPreviewDialog({
  open,
  onOpenChange,
  format,
  preview,
  onConfirm,
}: ExportPreviewDialogProps) {
  const skippedTypes = formatSkippedTypeSummary(preview.skippedByType);
  const canExport = preview.exportableCount > 0;

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Export preview</CredenzaTitle>
          <CredenzaDescription>{PLATFORM_NOTES[format]}</CredenzaDescription>
        </CredenzaHeader>

        <div className="space-y-3 text-sm">
          <p>
            <span className="font-medium">{preview.exportableCount}</span> of{" "}
            <span className="font-medium">{preview.totalQuestions}</span>{" "}
            questions will be exported.
          </p>

          {skippedTypes.length > 0 ? (
            <div>
              <p className="font-medium">Skipped question types</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {skippedTypes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {preview.invalidMcCount > 0 ? (
            <p className="text-muted-foreground">
              {preview.invalidMcCount} multiple choice question
              {preview.invalidMcCount === 1 ? "" : "s"} skipped because they
              need at least two answers.
            </p>
          ) : null}

          {!canExport ? (
            <p className="text-destructive">
              No exportable questions found for this format.
            </p>
          ) : null}
        </div>

        <CredenzaFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!canExport}>
            Download
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
