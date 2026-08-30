import { requireRole } from "@/lib/auth";

import { ImportClient } from "./import-client";

export default async function ImportPage() {
  await requireRole(["importer", "admin"]);

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
