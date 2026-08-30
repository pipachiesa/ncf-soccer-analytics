"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type SyncFixturesResult = {
  inserted: number;
  updated: number;
  total: number;
};

export function SyncFixturesButton({ onSynced }: { onSynced?: () => void | Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncFixturesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSync() {
    setResult(null);
    setError(null);

    startTransition(async () => {
      try {
        const { data, error: invokeError } = await createClient().functions.invoke<SyncFixturesResult>("sync-fixtures");
        if (invokeError) throw invokeError;
        if (!data) throw new Error("Fixture sync returned no result.");
        setResult(data);
        await onSynced?.();
      } catch (syncError) {
        setError(syncError instanceof Error ? syncError.message : "Fixture sync failed.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded border border-accent bg-accent px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Syncing fixtures" : "Sync fixtures"}
      </button>
      {result ? (
        <p className="mt-2 text-xs text-pass-ok">
          {result.inserted} inserted · {result.updated} updated · {result.total} total
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-pass-fail">{error}</p> : null}
    </div>
  );
}
