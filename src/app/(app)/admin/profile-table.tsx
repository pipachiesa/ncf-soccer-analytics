"use client";

import { Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { RoleForm } from "./role-form";

export type AdminProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string | null;
};

function formatJoinedDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function ProfileTable({ profiles, currentProfileId }: { profiles: AdminProfile[]; currentProfileId: string }) {
  const [search, setSearch] = useState("");
  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter((profile) =>
      [profile.email, profile.full_name, profile.role]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [profiles, search]);

  return (
    <section className="overflow-hidden rounded-md border border-border bg-panel">
      <div className="flex flex-col justify-between gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck aria-hidden="true" className="size-4 text-accent" />
          <div>
            <h2 className="text-sm font-black text-foreground">User access</h2>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {filteredProfiles.length} of {profiles.length} users
            </p>
          </div>
        </div>
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Search users</span>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted" />
          <input
            aria-label="Search users"
            className="h-9 w-full rounded-sm border border-border bg-elevated pr-3 pl-9 text-xs font-semibold text-foreground placeholder:text-muted focus:border-accent"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search email, name or role"
            type="search"
            value={search}
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-border bg-elevated text-[9px] font-black uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Full name</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Access role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProfiles.map((profile) => {
              const isSelf = profile.id === currentProfileId;
              return (
                <tr className="bg-panel transition-colors hover:bg-elevated/50" key={profile.id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-sm border border-border bg-elevated text-xs font-black uppercase text-accent">
                        {(profile.email ?? "?").slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{profile.email ?? "No email"}</p>
                        {isSelf ? <p className="text-[9px] font-black uppercase tracking-wider text-accent">You</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground">{profile.full_name ?? "—"}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-muted">{formatJoinedDate(profile.created_at)}</td>
                  <td className="px-4 py-4">
                    <RoleForm
                      currentRole={profile.role}
                      isSelf={isSelf}
                      key={`${profile.id}-${profile.role}`}
                      profileId={profile.id}
                    />
                  </td>
                </tr>
              );
            })}
            {!filteredProfiles.length ? (
              <tr>
                <td className="px-4 py-12 text-center text-sm font-semibold text-muted" colSpan={4}>
                  No users match this search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
