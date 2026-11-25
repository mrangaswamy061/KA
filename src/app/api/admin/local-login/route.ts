import { NextResponse } from "next/server";
import {
  LOCAL_SESSION_COOKIE,
  signLocalSessionToken,
  verifyLocalAdminCredentials,
} from "@/lib/auth/local-session";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (isSupabaseServerConfigured()) {
    return NextResponse.json(
      { error: "Supabase Auth is active. Use Supabase sign-in." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const email = String(body.email || "");
    const password = String(body.password || "");

    if (!verifyLocalAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: "Invalid administrator email or password." },
        { status: 401 }
      );
    }

    const token = signLocalSessionToken(email.trim().toLowerCase());
    const response = NextResponse.json({ success: true });
    response.cookies.set(LOCAL_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
