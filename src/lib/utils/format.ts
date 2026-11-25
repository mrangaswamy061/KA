import crypto from "node:crypto";

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "Contact for pricing";
  }
  if (amount === 0) {
    return "Free / Community Initiative";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEventDate(
  startDate: string,
  endDate?: string | null
): string {
  const start = new Date(`${startDate}T00:00:00`);
  const fmt = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!endDate || endDate === startDate) {
    return fmt.format(start);
  }
  const end = new Date(`${endDate}T00:00:00`);
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateReferenceCode(prefix = "KGD"): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${y}${m}${d}-${rand}`;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
): string {
  const escape = (val: string | number | boolean | null | undefined) => {
    const str = val === null || val === undefined ? "" : String(val);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  return [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\r\n");
}
