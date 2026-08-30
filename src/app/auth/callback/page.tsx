"use client";

import { useEffect, useState } from "react";

import { withBasePath } from "@/lib/base-path";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Completing Google sign-in…");

  useEffect(() => {
    async function completeSignIn() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        setMessage("The sign-in link is invalid. Returning to login…");
        window.setTimeout(() => window.location.replace(withBasePath("/login/")), 1200);
        return;
      }
      const { error } = await createClient().auth.exchangeCodeForSession(code);
      if (error) {
        setMessage(`Sign-in failed: ${error.message}`);
        window.setTimeout(() => window.location.replace(withBasePath("/login/")), 1800);
        return;
      }
      window.location.replace(withBasePath("/"));
    }
    void completeSignIn();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="rounded-md border border-border bg-panel px-6 py-5 text-center shadow-xl">
        <div className="mx-auto size-7 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="mt-3 text-sm font-semibold">{message}</p>
      </div>
    </main>
  );
}
