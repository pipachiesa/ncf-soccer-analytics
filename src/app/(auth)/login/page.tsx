/*
 * Manual Supabase Dashboard setup:
 * 1. Enable the Google provider under Authentication > Providers.
 * 2. Paste your Google OAuth Client ID and Client Secret into that provider.
 * 3. Add <site-url>/auth/callback and
 *    http://localhost:3000/auth/callback to the allowed redirect URLs.
 */

"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { withBasePath } from "@/lib/base-path";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${withBasePath("/auth/callback/")}`,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold tracking-tight">
          NCF Soccer Analytics
        </h1>
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isLoading}
          className="mt-8 w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Redirecting…" : "Sign in with Google"}
        </button>
        {error ? (
          <p className="mt-4 text-center text-sm text-pass-fail">{error}</p>
        ) : null}
      </div>
    </main>
  );
}
