"use client";

import { Pencil, Plus, Shield, Trash2, UserRound, X } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";

import { deletePlayer, savePlayer, type PlayerActionState } from "./actions";

export type RosterPlayer = {
  player_id: number;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  shirt_number: number | null;
  minutes_played: number;
};

type RosterManagerProps = {
  players: RosterPlayer[];
  canEdit: boolean;
};

const POSITIONS = [
  "GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM",
  "RM", "LM", "RW", "LW", "CF", "ST",
] as const;

const INITIAL_STATE: PlayerActionState = { status: "idle", message: "" };

function playerName(player: RosterPlayer) {
  return [player.first_name, player.last_name].filter(Boolean).join(" ") || "Unnamed player";
}

export function RosterManager({ players, canEdit }: RosterManagerProps) {
  const [editingPlayer, setEditingPlayer] = useState<RosterPlayer | null | undefined>(undefined);
  const [toast, setToast] = useState<PlayerActionState>(INITIAL_STATE);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Squad management</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Team roster</h1>
          <p className="mt-1 text-xs text-muted">
            {players.length} player{players.length === 1 ? "" : "s"} registered
            {!canEdit ? " · read-only access" : ""}
          </p>
        </div>
        {canEdit ? (
          <button
            className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-xs font-black text-[var(--bg)] transition-opacity hover:opacity-90"
            onClick={() => setEditingPlayer(null)}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add player
          </button>
        ) : null}
      </div>

      {players.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => (
            <article className="overflow-hidden rounded-md border border-border bg-panel" key={player.player_id}>
              <div className="flex items-stretch">
                <div className="grid w-20 shrink-0 place-items-center border-r border-border bg-elevated">
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted">No.</p>
                    <p className="text-3xl font-black tabular-nums text-accent">
                      {player.shirt_number ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-foreground">{playerName(player)}</p>
                      <span className="mt-1 inline-flex rounded-full border border-border bg-elevated px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-foreground">
                        {player.position ?? "—"}
                      </span>
                    </div>
                    <UserRound aria-hidden="true" className="size-4 shrink-0 text-muted" />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted">Minutes</p>
                      <p className="mt-0.5 text-sm font-black tabular-nums text-foreground">
                        {player.minutes_played.toLocaleString("en-US")}
                      </p>
                    </div>
                    {canEdit ? (
                      <div className="flex items-center gap-1">
                        <button
                          aria-label={`Edit ${playerName(player)}`}
                          className="rounded-sm border border-border bg-elevated p-2 text-muted transition-colors hover:border-accent hover:text-foreground"
                          onClick={() => setEditingPlayer(player)}
                          type="button"
                        >
                          <Pencil aria-hidden="true" className="size-3.5" />
                        </button>
                        <DeleteButton player={player} onResult={setToast} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-md border border-dashed border-border bg-panel p-8 text-center">
          <div>
            <Shield aria-hidden="true" className="mx-auto size-8 text-accent" />
            <h2 className="mt-3 text-base font-bold text-foreground">No players yet</h2>
            <p className="mt-1 text-xs text-muted">
              {canEdit ? "Add the first player to start building the squad." : "The squad has not been added yet."}
            </p>
          </div>
        </div>
      )}

      {editingPlayer !== undefined ? (
        <PlayerDialog
          key={editingPlayer?.player_id ?? "new"}
          player={editingPlayer}
          onClose={() => setEditingPlayer(undefined)}
          onResult={setToast}
        />
      ) : null}

      {toast.status !== "idle" ? <Toast state={toast} onClose={() => setToast(INITIAL_STATE)} /> : null}
    </>
  );
}

function PlayerDialog({
  player,
  onClose,
  onResult,
}: {
  player: RosterPlayer | null;
  onClose: () => void;
  onResult: (state: PlayerActionState) => void;
}) {
  const [state, formAction, isPending] = useActionState(savePlayer, INITIAL_STATE);

  useEffect(() => {
    if (state.status === "idle") return;
    onResult(state);
    if (state.status === "success") onClose();
  }, [state, onClose, onResult]);

  return (
    <div
      aria-label={player ? "Edit player dialog" : "Add player dialog"}
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[color:var(--bg)]/80 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-md border border-border bg-panel shadow-2xl">
        <header className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent">Squad</p>
            <h2 className="mt-0.5 text-lg font-black text-foreground">{player ? "Edit player" : "Add player"}</h2>
          </div>
          <button aria-label="Close player form" className="rounded-sm p-1.5 text-muted hover:bg-elevated hover:text-foreground" onClick={onClose} type="button">
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>

        <form action={formAction} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <input name="player_id" type="hidden" value={player?.player_id ?? ""} />
          <Field label="First name" name="first_name" defaultValue={player?.first_name ?? ""} />
          <Field label="Last name" name="last_name" defaultValue={player?.last_name ?? ""} />
          <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
            Position
            <select
              className="h-10 rounded-sm border border-border bg-elevated px-3 text-sm font-semibold normal-case tracking-normal text-foreground focus:border-accent"
              defaultValue={player?.position && POSITIONS.includes(player.position as typeof POSITIONS[number]) ? player.position : "CM"}
              name="position"
              required
            >
              {POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}
            </select>
          </label>
          <Field label="Shirt number" name="shirt_number" defaultValue={player?.shirt_number?.toString() ?? ""} type="number" />

          {state.status === "error" ? (
            <p className="sm:col-span-2 rounded-sm border border-pass-fail bg-elevated px-3 py-2 text-xs text-pass-fail">{state.message}</p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2">
            <button className="rounded-sm border border-border bg-elevated px-4 py-2 text-xs font-bold text-foreground" onClick={onClose} type="button">Cancel</button>
            <button className="rounded-sm bg-accent px-4 py-2 text-xs font-black text-[var(--bg)] disabled:opacity-60" disabled={isPending} type="submit">
              {isPending ? "Saving…" : player ? "Save changes" : "Add player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue: string; type?: "text" | "number" }) {
  return (
    <label className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
      {label}
      <input
        className="h-10 rounded-sm border border-border bg-elevated px-3 text-sm font-semibold normal-case tracking-normal text-foreground focus:border-accent"
        defaultValue={defaultValue}
        max={type === "number" ? 999 : undefined}
        min={type === "number" ? 0 : undefined}
        name={name}
        required
        type={type}
      />
    </label>
  );
}

function DeleteButton({ player, onResult }: { player: RosterPlayer; onResult: (state: PlayerActionState) => void }) {
  const [state, dispatch, isPending] = useActionState(deletePlayer, INITIAL_STATE);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.status !== "idle") onResult(state);
  }, [state, onResult]);

  function handleDelete() {
    if (!window.confirm(`Delete ${playerName(player)}? This cannot be undone.`)) return;
    const formData = new FormData();
    formData.set("player_id", player.player_id.toString());
    startTransition(() => dispatch(formData));
  }

  return (
    <button
      aria-label={`Delete ${playerName(player)}`}
      className="rounded-sm border border-border bg-elevated p-2 text-muted transition-colors hover:border-pass-fail hover:text-pass-fail disabled:opacity-50"
      disabled={isPending}
      onClick={handleDelete}
      type="button"
    >
      <Trash2 aria-hidden="true" className="size-3.5" />
    </button>
  );
}

function Toast({ state, onClose }: { state: PlayerActionState; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed right-5 bottom-5 z-[60] max-w-sm rounded-md border bg-panel px-4 py-3 text-sm font-semibold shadow-xl ${state.status === "error" ? "border-pass-fail text-pass-fail" : "border-accent text-foreground"}`}
      role="status"
    >
      {state.message}
    </div>
  );
}
