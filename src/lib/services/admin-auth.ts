import {
  createServerSupabaseClient,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";
import { getLocalStaffProfile } from "@/lib/auth/local-session";
import type { Profile } from "@/types/database";

export function hasSupabaseConfigMismatch(): boolean {
  return isSupabaseServerConfigured() && !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function getAuthenticatedStaffProfile(): Promise<Profile | null> {
  if (!isSupabaseServerConfigured()) {
    return getLocalStaffProfile();
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) return null;
  if (profile.role !== "admin" && profile.role !== "content_manager") {
    return null;
  }

  return profile as Profile;
}
