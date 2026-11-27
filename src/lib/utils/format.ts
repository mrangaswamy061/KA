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
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Produces a non-empty URL slug even for non-ASCII or punctuation-only titles.
 */
export function safeSlug(slugInput: unknown, fallbackTitle: string): string {
  const raw = typeof slugInput === "string" && slugInput.trim() ? slugInput : fallbackTitle;
  return slugify(raw) || `item-${Date.now().toString(36)}`;
}

/**
 * Returns today's date (YYYY-MM-DD) in Asia/Kolkata (IST).
 */
export function getIstTodayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Checks whether an event registration deadline has passed.
 * Date-only deadlines (YYYY-MM-DD) remain open until 23:59:59 IST on that date.
 */
export function isDeadlinePassed(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const trimmed = deadline.trim();
  if (!trimmed) return false;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T23:59:59+05:30`
    : trimmed;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return false;
  return ts < Date.now();
}

export function parseOptionalNumber(val: unknown): number | null {
  if (val === "" || val === null || val === undefined) return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

/**
 * Normalizes human time input ("6 AM", "06:30 pm", "18:00", "18:00:00") into HH:MM:SS
 * compatible with PostgreSQL TIME columns. Returns `{ ok: false }` on invalid non-empty text.
 */
export function normalizeOptionalTime(
  val: unknown
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (val === null || val === undefined) return { ok: true, value: null };
  const raw = String(val).trim();
  if (!raw) return { ok: true, value: null };

  const m = raw.match(
    /^(\d{1,2})(?:[:.](\d{2})(?:[:.](\d{2}))?)?\s*(am|pm)?$/i
  );
  if (!m) {
    return {
      ok: false,
      error: `Invalid time "${raw}". Use format like 06:00 AM or 18:00.`,
    };
  }

  let hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  const seconds = m[3] ? Number(m[3]) : 0;
  const meridiem = m[4]?.toLowerCase();

  if (minutes > 59 || seconds > 59) {
    return {
      ok: false,
      error: `Invalid time "${raw}". Minutes and seconds must be 00–59.`,
    };
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return {
        ok: false,
        error: `Invalid 12-hour time "${raw}". Hours must be 1–12 with AM/PM.`,
      };
    }
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
  } else if (hours > 23) {
    return {
      ok: false,
      error: `Invalid 24-hour time "${raw}". Hours must be 0–23.`,
    };
  }

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return { ok: true, value: `${hh}:${mm}:${ss}` };
}

/**
 * Expands date-only deadlines (YYYY-MM-DD) to end-of-day IST (23:59:59+05:30)
 * so Postgres TIMESTAMPTZ does not close registrations early at 05:30 AM IST.
 */
export function normalizeOptionalDeadline(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const raw = String(val).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T23:59:59+05:30`;
  }
  return raw;
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
