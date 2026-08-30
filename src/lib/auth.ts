import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "admin" | "importer" | "viewer";

export type CurrentProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole;
};

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    // Authentication should never loop back to /login just because the
    // profile trigger has not populated its row yet. Treat a valid Supabase
    // user as a viewer until the database profile is available.
    const metadata = user.user_metadata as {
      full_name?: string;
      name?: string;
    };

    return {
      id: user.id,
      email: user.email ?? null,
      full_name: metadata.full_name ?? metadata.name ?? null,
      role: "viewer",
    };
  }

  return profile as CurrentProfile;
}

export async function requireRole(roles: string[]) {
  const profile = await getCurrentProfile();

  if (!profile || !roles.includes(profile.role)) {
    redirect("/");
  }

  return profile;
}
