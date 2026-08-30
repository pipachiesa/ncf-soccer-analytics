"use server";

import { revalidatePath } from "next/cache";

import { requireRole, type ProfileRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
  const currentProfile = await requireRole(["admin"]);

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

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/", "layout");

  return { status: "success", message: `Role updated to ${role}.` };
}
