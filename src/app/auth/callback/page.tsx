"use client";

import { useEffect, useRef, useState } from "react";

import { withBasePath } from "@/lib/base-path";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Completing Google sign-in…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function completeSignIn() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      const oauthError = hash.get("error_description") ?? query.get("error_description");
      if (oauthError) throw new Error(oauthError);

      const supabase = createClient();
      let { data: { session }, error } = await supabase.auth.getSession();
      if (!session && !error) {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
        ({ data: { session }, error } = await supabase.auth.getSession());
      }
      if (error) {
        throw error;
      }
      if (!session) throw new Error("Google did not return a session. Please try again.");
      window.location.replace(withBasePath("/"));
    }
    void completeSignIn().catch((error) => {
      setMessage(`Sign-in failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      window.setTimeout(() => window.location.replace(withBasePath("/login/")), 2200);
    });
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
