"use client";

import { Camera, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function PlayerPhotoUploader({
  playerId,
  playerName,
  imageUrl,
  canEdit,
  onUploaded,
}: {
  playerId: number;
  playerName: string;
  imageUrl: string | null;
  canEdit: boolean;
  onUploaded: () => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The image must be smaller than 5 MB.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${playerId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("player-images").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("player-images").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("players")
        .update({ image_url: data.publicUrl })
        .eq("player_id", playerId);
      if (updateError) throw updateError;
      await onUploaded();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The player image could not be uploaded.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="text-center">
      <div
        aria-label={`${playerName} photo`}
        className="mx-auto size-28 rounded-full border-2 border-accent bg-panel bg-cover bg-center shadow-lg sm:size-32"
        role="img"
        style={imageUrl ? { backgroundImage: `url(${JSON.stringify(imageUrl).slice(1, -1)})` } : undefined}
      >
        {!imageUrl ? (
          <div className="grid size-full place-items-center rounded-full bg-panel text-3xl font-black text-accent">
            {playerName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "NCF"}
          </div>
        ) : null}
      </div>
      {canEdit ? (
        <>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => void upload(event.target.files?.[0])}
            ref={inputRef}
            type="file"
          />
          <button
            className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-border bg-panel px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-muted hover:border-accent hover:text-accent disabled:opacity-50"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {uploading ? <LoaderCircle className="size-3 animate-spin" /> : <Camera className="size-3" />}
            {uploading ? "Uploading" : imageUrl ? "Change photo" : "Add photo"}
          </button>
        </>
      ) : null}
      {error ? <p className="mt-2 text-[9px] font-semibold text-pass-fail">{error}</p> : null}
    </div>
  );
}
