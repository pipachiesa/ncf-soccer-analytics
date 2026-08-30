import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { RoleForm } from "./role-form";

export default async function AdminPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .order("email", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent">Administration</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          User roles
        </h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-elevated">
        {error ? (
          <p className="p-6 text-sm text-pass-fail">
            Unable to load profiles: {error.message}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-elevated text-sm text-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 text-right font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profiles?.map((profile) => (
                  <tr key={profile.id} className="bg-panel">
                    <td className="px-5 py-4 text-sm text-foreground">
                      {profile.email ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-foreground">
                      {profile.full_name ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <RoleForm
                        profileId={profile.id}
                        currentRole={profile.role}
                      />
                    </td>
                  </tr>
                ))}
                {!profiles?.length ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="bg-panel px-5 py-10 text-center text-sm text-muted"
                    >
                      No profiles found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
