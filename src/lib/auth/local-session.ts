import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { Profile } from "@/types/database";

export const LOCAL_SESSION_COOKIE = "kaggadu_local_session";

function getSecret(): string {
  return (
    process.env.LOCAL_AUTH_SECRET ||
    "kaggadu-local-dev-secret-change-in-production"
  );
}

export function getLocalAdminEmail(): string {
  return process.env.LOCAL_ADMIN_EMAIL || "MAHABALA@2020";
}

function getLocalAdminPassword(): string {
  return process.env.LOCAL_ADMIN_PASSWORD || "KAGGADU TREKKING";
}

export function verifyLocalAdminCredentials(
  email: string,
  password: string
): boolean {
  const expectedEmail = getLocalAdminEmail().toLowerCase();
  const expectedPass = getLocalAdminPassword();

  if (email.trim().toLowerCase() !== expectedEmail) {
    return false;
  }

  const a = Buffer.from(password);
  const b = Buffer.from(expectedPass);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function signLocalSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      role: "admin",
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString("base64url");

  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${sig}`;
}

export function verifyLocalSessionToken(
  token: string | undefined
): { email: string; role: "admin" } | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { email: string; role: "admin"; exp: number };
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    return { email: decoded.email, role: "admin" };
  } catch {
    return null;
  }
}

export async function getLocalStaffProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LOCAL_SESSION_COOKIE)?.value;
  const session = verifyLocalSessionToken(token);
  if (!session) return null;

  return {
    id: "local-admin",
    email: session.email,
    full_name: "Kaggadu Administrator",
    role: "admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
