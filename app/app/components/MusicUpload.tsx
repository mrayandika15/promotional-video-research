"use client";

import { useRef } from "react";
import type { AudioSlot } from "../remotion/types";

interface MusicUploadProps {
  audio: AudioSlot;
  onAudioChange: (audio: AudioSlot) => void;
}

export default function MusicUpload({ audio, onAudioChange }: MusicUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (audio.url) URL.revokeObjectURL(audio.url);
      const url = URL.createObjectURL(file);
      onAudioChange({ file, url, name: file.name });
    } else {
      if (audio.url) URL.revokeObjectURL(audio.url);
      onAudioChange({ file: null, url: null, name: null });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-emerald-500" />
        <h2 className="text-xl font-semibold text-white">Background Music</h2>
      </div>

      {audio.url ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          {/* Music icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-emerald-400"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>

          {/* File info + player */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-sm font-medium text-white">
              {audio.name}
            </span>
            <audio
              src={audio.url}
              controls
              className="h-8 w-full [&::-webkit-media-controls-panel]:bg-zinc-800"
            />
          </div>

          {/* Remove button */}
          <button
            onClick={() => handleFileChange(null)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/50 transition-colors hover:bg-red-500/20 hover:text-red-400"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-zinc-500"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm font-medium text-zinc-300">
              Upload background music
            </span>
            <span className="text-xs text-zinc-500">
              MP3, WAV, OGG — plays across all scenes
            </span>
          </div>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          handleFileChange(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
