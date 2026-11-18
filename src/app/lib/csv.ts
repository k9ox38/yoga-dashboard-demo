/** Download rows as a UTF-8 CSV (with BOM so Excel opens Chinese text correctly). */
export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escape = (cell: string | number) => {
    const text = String(cell);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const blob = new Blob([`﻿${rows.map((row) => row.map(escape).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
