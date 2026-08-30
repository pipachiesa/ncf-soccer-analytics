"use client";

import { useActionState } from "react";

import {
  updateProfileRole,
  type UpdateRoleState,
} from "./actions";

const INITIAL_STATE: UpdateRoleState = {
  status: "idle",
  message: "",
};

export function RoleForm({
  profileId,
  currentRole,
}: {
  profileId: string;
  currentRole: string;
}) {
  const [state, formAction, isPending] = useActionState(
    updateProfileRole,
    INITIAL_STATE,
  );

  return (
    <>
      <form action={formAction} className="flex items-center justify-end gap-2">
        <input type="hidden" name="profileId" value={profileId} />
        <select
          name="role"
          defaultValue={currentRole}
          aria-label="User role"
          className="rounded-md border border-border bg-panel px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="viewer">Viewer</option>
          <option value="importer">Importer</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </form>
      {state.status !== "idle" ? (
        <div
          role="status"
          className={`fixed right-6 bottom-6 z-50 rounded-md border px-4 py-3 text-sm shadow-lg ${
            state.status === "success"
              ? "border-accent bg-elevated text-foreground"
              : "border-pass-fail bg-panel text-pass-fail"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </>
  );
}
