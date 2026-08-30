"use client";

import { type FormEvent, useActionState, useRef, useState } from "react";

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
  isSelf,
}: {
  profileId: string;
  currentRole: string;
  isSelf: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    updateProfileRole,
    INITIAL_STATE,
  );
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const confirmationRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isSelf || currentRole !== "admin" || selectedRole === "admin") return;

    const confirmed = window.confirm(
      "Remove your own admin access? You may not be able to return to this page.",
    );
    if (!confirmed) {
      event.preventDefault();
      return;
    }
    if (confirmationRef.current) confirmationRef.current.value = "yes";
  }

  return (
    <>
      <form action={formAction} className="flex items-center justify-end gap-2" onSubmit={handleSubmit}>
        <input type="hidden" name="profileId" value={profileId} />
        <input ref={confirmationRef} type="hidden" name="confirmedSelfDemotion" value="no" />
        <select
          name="role"
          aria-label={isSelf ? "Your role" : "User role"}
          className="h-9 rounded-sm border border-border bg-elevated px-3 text-xs font-bold capitalize text-foreground outline-none focus:border-accent"
          onChange={(event) => {
            setSelectedRole(event.target.value);
            if (confirmationRef.current) confirmationRef.current.value = "no";
          }}
          value={selectedRole}
        >
          <option value="viewer">Viewer</option>
          <option value="importer">Importer</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={isPending || selectedRole === currentRole}
          className="h-9 rounded-sm bg-accent px-3 text-xs font-black text-[var(--bg)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </form>
      {state.status !== "idle" ? (
        <div
          role="status"
          className={`fixed right-5 bottom-5 z-50 rounded-md border px-4 py-3 text-sm font-semibold shadow-xl ${
            state.status === "success"
              ? "border-accent bg-panel text-foreground"
              : "border-pass-fail bg-panel text-pass-fail"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </>
  );
}
