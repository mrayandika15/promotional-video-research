"use client";

import { useState, useRef, useCallback } from "react";
import type { VideoSlot } from "../remotion/types";

interface VideoUploadFormProps {
  slots: VideoSlot[];
  onSlotsChange: (slots: VideoSlot[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function VideoUploadForm({
  slots,
  onSlotsChange,
  onGenerate,
  isGenerating,
}: VideoUploadFormProps) {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileChange = useCallback(
    (index: number, file: File | null) => {
      const updated = [...slots];
      if (file) {
        const url = URL.createObjectURL(file);
        // Revoke old URL if exists
        if (updated[index].url) {
          URL.revokeObjectURL(updated[index].url!);
        }
        updated[index] = { ...updated[index], file, url };
      } else {
        if (updated[index].url) {
          URL.revokeObjectURL(updated[index].url!);
        }
        updated[index] = { ...updated[index], file: null, url: null };
      }
      onSlotsChange(updated);
    },
    [slots, onSlotsChange]
  );

  const allSlotsFilled = slots.every((s) => s.file !== null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-blue-500" />
        <h2 className="text-xl font-semibold text-white">Upload Videos</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {slots.map((slot, i) => (
          <div
            key={slot.id}
            className="group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20"
          >
            <span className="text-sm font-medium text-zinc-400">
              {slot.label}
            </span>

            {slot.url ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                <video
                  src={slot.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
                <button
                  onClick={() => handleFileChange(i, null)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/70 backdrop-blur transition-colors hover:bg-red-500/80 hover:text-white"
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
                onClick={() => fileInputRefs.current[i]?.click()}
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] transition-colors hover:border-blue-500/40 hover:bg-blue-500/5"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-zinc-500"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm text-zinc-500">
                  Click to upload video
                </span>
              </button>
            )}

            <input
              ref={(el) => {
                fileInputRefs.current[i] = el;
              }}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange(i, file);
                e.target.value = "";
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onGenerate}
        disabled={!allSlotsFilled || isGenerating}
        className="mt-2 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 text-lg font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isGenerating ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                d="M4 12a8 8 0 018-8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-75"
              />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Generate Promotional Video
          </>
        )}
      </button>

      {!allSlotsFilled && (
        <p className="text-center text-sm text-zinc-500">
          Upload all 4 videos to enable generation
        </p>
      )}
    </div>
  );
}
