import { NextResponse } from "next/server";
import { LOCAL_SESSION_COOKIE } from "@/lib/auth/local-session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(LOCAL_SESSION_COOKIE);
  return response;
}
