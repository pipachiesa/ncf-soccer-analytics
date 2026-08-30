"use client";

import type { ProfileRole } from "@/lib/auth-types";
import { createClient } from "@/lib/supabase/client";

export type UpdateRoleState = {
  status: "idle" | "success" | "error";
  message: string;
};

const VALID_ROLES: ProfileRole[] = ["viewer", "importer", "admin"];

// After your first Google login, promote yourself once in the Supabase SQL editor:
// update profiles set role='admin' where email='felipechiesa05@gmail.com';
export async function updateProfileRole(
  _previousState: UpdateRoleState,
  formData: FormData,
): Promise<UpdateRoleState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Your session has expired." };
  const { data: currentProfile } = await supabase.from("profiles").select("id, role").eq("id", user.id).single();
  if (currentProfile?.role !== "admin") return { status: "error", message: "Admin access is required." };

  const profileId = formData.get("profileId");
  const role = formData.get("role");
  const confirmedSelfDemotion = formData.get("confirmedSelfDemotion") === "yes";

  if (
    typeof profileId !== "string" ||
    typeof role !== "string" ||
    !VALID_ROLES.includes(role as ProfileRole)
  ) {
    return { status: "error", message: "Invalid role update." };
  }

  if (profileId === currentProfile.id && role !== "admin" && !confirmedSelfDemotion) {
    return {
      status: "error",
      message: "Confirm before removing your own admin access.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", message: `Role updated to ${role}.` };
}
