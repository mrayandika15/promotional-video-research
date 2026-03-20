"use client";

import { useState, useCallback } from "react";
import VideoUploadForm from "./components/VideoUploadForm";
import VideoPreview from "./components/VideoPreview";
import type { VideoSlot } from "./remotion/types";

const initialSlots: VideoSlot[] = [
  { id: "destination1", label: "Destination 1", file: null, url: null },
  { id: "destination2", label: "Destination 2", file: null, url: null },
  { id: "destination3", label: "Destination 3", file: null, url: null },
  { id: "destination4", label: "Destination 4", file: null, url: null },
];

export default function Home() {
  const [slots, setSlots] = useState<VideoSlot[]>(initialSlots);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const videos = {
    destination1: slots[0].url,
    destination2: slots[1].url,
    destination3: slots[2].url,
    destination4: slots[3].url,
  };

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setGenerated(false);

    // Simulate generation delay — in production this would call
    // the Remotion renderMedia API via a backend endpoint
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
    }, 3000);
  }, []);

  const filledCount = slots.filter((s) => s.file !== null).length;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="white"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">
              Promotional Video Generator
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="rounded-full bg-white/5 px-3 py-1">
              Remotion + Next.js
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Status bar */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                filledCount === 4
                  ? "bg-green-500"
                  : filledCount > 0
                  ? "bg-yellow-500"
                  : "bg-zinc-600"
              }`}
            />
            <span className="text-sm text-zinc-400">
              {filledCount}/4 videos uploaded
            </span>
          </div>
          {generated && (
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400">
              Generated
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Left — Upload Form */}
          <div>
            <VideoUploadForm
              slots={slots}
              onSlotsChange={setSlots}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>

          {/* Right — Preview */}
          <div>
            <VideoPreview videos={videos} />
          </div>
        </div>
      </main>
    </div>
  );
}
