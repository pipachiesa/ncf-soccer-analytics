import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { ProfileTable, type AdminProfile } from "./profile-table";

export default async function AdminPage() {
  const currentProfile = await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("email", { ascending: true });
  const roleCounts = (profiles ?? []).reduce(
    (counts, profile) => {
      const role = profile.role as "admin" | "importer" | "viewer";
      if (role in counts) counts[role] += 1;
      return counts;
    },
    { admin: 0, importer: 0, viewer: 0 },
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-5 lg:px-6">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">User administration</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Users & permissions</h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
            Importers can upload CSVs and edit the roster; viewers are read-only.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["admin", "importer", "viewer"] as const).map((role) => (
            <div className="min-w-20 rounded-sm border border-border bg-panel px-3 py-2 text-center" key={role}>
              <p className="text-lg font-black tabular-nums text-foreground">{roleCounts[role]}</p>
              <p className="text-[8px] font-black uppercase tracking-wider text-muted">{role}</p>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-pass-fail bg-panel px-4 py-3 text-sm text-pass-fail">
          Unable to load profiles: {error.message}
        </div>
      ) : (
        <ProfileTable currentProfileId={currentProfile.id} profiles={(profiles ?? []) as AdminProfile[]} />
      )}
    </div>
  );
}
