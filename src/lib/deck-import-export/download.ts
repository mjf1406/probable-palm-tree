export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(title: string): string {
  const trimmed = title.trim() || "deck";
  return trimmed
    .split("")
    .filter((ch) => ch.charCodeAt(0) >= 32 && !/[<>:"/\\|?*]/.test(ch))
    .join("")
    .replace(/\s+/g, " ")
    .slice(0, 80)
    .trim();
}
