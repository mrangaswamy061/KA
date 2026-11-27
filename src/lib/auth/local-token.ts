import crypto from "node:crypto";

export const LOCAL_SESSION_COOKIE = "kaggadu_local_session";

function getSecret(): string {
  if (process.env.LOCAL_AUTH_SECRET) {
    return process.env.LOCAL_AUTH_SECRET;
  }
  return crypto
    .createHash("sha256")
    .update(`${getLocalAdminEmail()}:${getLocalAdminPassword()}:kaggadu-local-session-v1`)
    .digest("hex");
}

export function getLocalAdminEmail(): string {
  return process.env.LOCAL_ADMIN_EMAIL || "MAHABALA@2020";
}

function getLocalAdminPassword(): string {
  return process.env.LOCAL_ADMIN_PASSWORD || "KAGGADU TREKKING";
}

function sha256Digest(value: string): Buffer {
  return crypto.createHash("sha256").update(value, "utf8").digest();
}

export function verifyLocalAdminCredentials(
  email: string,
  password: string
): boolean {
  const expectedEmail = getLocalAdminEmail().trim().toLowerCase();
  const actualEmail = email.trim().toLowerCase();
  const emailMatch = crypto.timingSafeEqual(
    sha256Digest(actualEmail),
    sha256Digest(expectedEmail)
  );
  const passMatch = crypto.timingSafeEqual(
    sha256Digest(password),
    sha256Digest(getLocalAdminPassword())
  );
  return emailMatch && passMatch;
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
