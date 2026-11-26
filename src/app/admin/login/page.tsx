"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState(
    configured ? "" : "MAHABALA@2020"
  );
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "unauthorized"
      ? "Your account does not have administrator or staff permissions."
      : null
  );
  const [notice, setNotice] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (!configured) {
        const res = await fetch("/api/admin/local-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Invalid credentials.");
          return;
        }
        router.push("/admin/dashboard");
        router.refresh();
        return;
      }

      const supabase = createClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
        setError(authErr.message);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!configured) {
      setNotice(
        "Local database mode is active. Set LOCAL_ADMIN_PASSWORD in .env.local to change the local admin password."
      );
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/login`,
      });
      if (resetErr) {
        setError(resetErr.message);
        return;
      }
      setNotice("If an account exists for that email, a password reset link has been sent.");
    } catch {
      setError("Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F4ED] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 text-[#18372D]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/kaggadu-logo.png"
              alt="Kaggadu Adventures"
              className="h-11 w-11 rounded-full object-cover bg-white border border-[#E9E9E2] shadow-sm"
            />
            <span className="font-editorial text-2xl font-semibold">
              Kaggadu Adventures
            </span>
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8C735A] font-semibold">
            Staff & Admin Portal
          </p>
        </div>

        <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-5">
          <h1 className="font-editorial text-2xl font-semibold text-[#18372D]">
            {mode === "login" ? "Sign In to Dashboard" : "Reset Password"}
          </h1>

          {!configured && (
            <div className="rounded-md border border-[#A8B8A0] bg-[#A8B8A0]/15 px-4 py-3 text-xs text-[#18372D] flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#244B3C]" aria-hidden="true" />
              <div>
                <p className="font-semibold">Local Persistent Mode Active</p>
                <p className="mt-0.5 text-[#262B27]/80">
                  Supabase is not configured yet, so data persists locally in{" "}
                  <code>data/kaggadu-db.json</code>. Sign in with your configured
                  local admin ID and password (override via{" "}
                  <code>LOCAL_ADMIN_EMAIL</code> and{" "}
                  <code>LOCAL_ADMIN_PASSWORD</code>).
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="rounded-md border border-[#244B3C]/30 bg-[#A8B8A0]/20 px-4 py-3 text-sm text-[#18372D] flex items-start gap-2"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{notice}</span>
            </div>
          )}

          <form
            onSubmit={mode === "login" ? handleLogin : handleResetPassword}
            className="space-y-4"
          >
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-[#18372D] mb-1">
                {configured ? "Email Address" : "Admin ID / Email"}
              </label>
              <input
                id="admin-email"
                type={configured ? "email" : "text"}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={configured ? "admin@kaggaduadventures.com" : "MAHABALA@2020"}
                className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
              />
            </div>

            {mode === "login" && (
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-[#18372D] mb-1">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#244B3C] px-5 py-3 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D] disabled:opacity-60 transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {mode === "login" ? "Sign In" : "Send Reset Link"}
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 text-xs text-[#244B3C]">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "forgot" : "login");
                setError(null);
                setNotice(null);
              }}
              className="font-semibold hover:underline"
            >
              {mode === "login" ? "Forgot password?" : "Back to Sign In"}
            </button>
            <Link href="/" className="text-[#8C735A] hover:underline">
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F4ED]" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
