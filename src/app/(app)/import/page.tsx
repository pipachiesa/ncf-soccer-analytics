"use client";

import { useEffect } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { withBasePath } from "@/lib/base-path";
import { ImportClient } from "./import-client";

export default function ImportPage() {
  const { profile } = useAuth();
  const allowed = profile.role === "importer" || profile.role === "admin";
  useEffect(() => {
    if (!allowed) window.location.replace(withBasePath("/"));
  }, [allowed]);
  if (!allowed) return null;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent">Data management</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          Import match events
        </h1>
      </div>
      <ImportClient />
    </div>
  );
}
