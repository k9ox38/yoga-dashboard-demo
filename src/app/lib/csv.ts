import { downloadBlob } from "./download";

/** Download rows as a UTF-8 CSV (with BOM so Excel opens Chinese text correctly). */
export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escape = (cell: string | number) => {
    const text = String(cell);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  downloadBlob(filename, new Blob([`﻿${rows.map((row) => row.map(escape).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" }));
}
