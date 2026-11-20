export type CsvColumn = {
  key: string;
  label: string;
};

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let text: string;
  if (value instanceof Date) {
    text = value.toISOString();
  } else if (typeof value === "object") {
    text = JSON.stringify(value);
  } else {
    text = String(value);
  }

  if (/[";\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * CSV lisible par Excel/LibreOffice en français : séparateur point-virgule et
 * BOM UTF-8 pour que les accents s'affichent correctement.
 */
export function toCsv(columns: CsvColumn[], rows: Record<string, unknown>[]): string {
  const header = columns.map((column) => escapeCell(column.label)).join(";");
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(row[column.key])).join(";"),
  );
  return `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
}
