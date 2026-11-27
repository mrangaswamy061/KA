import { cookies } from "next/headers";
import type { Profile } from "@/types/database";
import { LOCAL_SESSION_COOKIE, verifyLocalSessionToken } from "./local-token";

export {
  LOCAL_SESSION_COOKIE,
  getLocalAdminEmail,
  verifyLocalAdminCredentials,
  signLocalSessionToken,
  verifyLocalSessionToken,
} from "./local-token";

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
