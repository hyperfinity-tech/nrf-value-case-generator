const markdownRowSeparatorPattern = /^\|?[-:|\s]+\|?$/;
const labelCamelPattern = /([A-Z])/g;
const labelUnderscorePattern = /_/g;
const labelLeadingPattern = /^\w/;

export type MarkdownTable = {
  headers: string[];
  rows: string[][];
};

export const normalizeDataUrl = (input: string | null | undefined, mimeType: string): string | null => {
  if (!input) return null;
  // Already a data URL
  if (input.startsWith("data:")) return input;
  // URL path (mock mode or external URL)
  if (input.startsWith("/") || input.startsWith("http://") || input.startsWith("https://")) return input;
  // Raw base64 - add data URL prefix
  return `data:${mimeType};base64,${input}`;
};

export const formatLabel = (label: string): string =>
  label
    .replace(labelCamelPattern, " $1")
    .replace(labelUnderscorePattern, " ")
    .replace(labelLeadingPattern, (char) => char.toUpperCase())
    .trim();

export const formatNumber = (value: number, maximumFractionDigits = 2): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);

export const formatPercentage = (value: number): string => `${formatNumber(value, 1)}%`;

export const formatMillions = (value: number): string => `${formatNumber(value, 1)}m`;

export const parseMarkdownTable = (markdown: string): MarkdownTable | null => {
  const rawLines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (rawLines.length < 2) return null;

  const [headerLine, ...restLines] = rawLines;
  if (!headerLine.includes("|")) return null;

  const headers = headerLine
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

  const rows: string[][] = [];

  for (const line of restLines) {
    if (markdownRowSeparatorPattern.test(line)) continue;
    if (!line.includes("|")) continue;

    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (cells.length > 0) rows.push(cells);
  }

  return headers.length > 0 && rows.length > 0 ? { headers, rows } : null;
};

export const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "N/A";

  if (typeof value === "string") return value;

  if (typeof value === "number") return formatNumber(value);

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) return value.join(", ");

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.value === "number" && typeof record.unit === "string") {
      const confidence = typeof record.confidence === "string" ? ` (${record.confidence})` : "";
      const note = typeof record.note === "string" ? ` — ${record.note}` : "";
      return `${formatNumber(record.value)} ${record.unit}${confidence}${note}`;
    }

    if (typeof record.value === "number" && typeof record.confidence === "string") {
      const note = typeof record.note === "string" ? ` — ${record.note}` : "";
      return `${formatNumber(record.value)} (${record.confidence})${note}`;
    }

    return JSON.stringify(record, null, 2);
  }

  return String(value);
};
