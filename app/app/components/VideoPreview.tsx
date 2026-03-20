"use client";

import { useRef, useState, useCallback } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { PromotionalVideo } from "../remotion/PromotionalVideo";
import type { PromotionalVideoProps, SceneText, VideoSlot, AudioSlot } from "../remotion/types";

interface VideoPreviewProps {
  videos: PromotionalVideoProps["videos"];
  musicUrl: string | null;
  sceneTexts: SceneText[];
  generated: boolean;
  slots: VideoSlot[];
  audio: AudioSlot;
}

export default function VideoPreview({
  videos,
  musicUrl,
  sceneTexts,
  generated,
  slots,
  audio,
}: VideoPreviewProps) {
  const playerRef = useRef<PlayerRef>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);

  const handleRenderDownload = useCallback(async () => {
    setIsRendering(true);
    setDownloadUrl(null);
    setRenderError(null);
    setRenderProgress(10);

    try {
      const formData = new FormData();

      // Append video files
      for (const slot of slots) {
        if (slot.file) {
          formData.append(slot.id, slot.file);
        }
      }

      // Append music file
      if (audio.file) {
        formData.append("music", audio.file);
      }

      // Append scene texts
      formData.append("sceneTexts", JSON.stringify(sceneTexts));

      setRenderProgress(20);

      const response = await fetch("/api/render", {
        method: "POST",
        body: formData,
      });

      setRenderProgress(80);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || "Render failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setRenderProgress(100);
    } catch (error) {
      setRenderError(String(error));
    } finally {
      setIsRendering(false);
    }
  }, [slots, audio, sceneTexts]);

  const triggerFileDownload = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "promotional-video.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [downloadUrl]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-purple-500" />
        <h2 className="text-xl font-semibold text-white">Preview</h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Player
          ref={playerRef}
          component={PromotionalVideo}
          inputProps={{ videos, musicUrl, sceneTexts }}
          durationInFrames={600}
          fps={30}
          compositionWidth={1080}
          compositionHeight={1920}
          style={{
            width: "100%",
            aspectRatio: "9 / 16",
          }}
          controls
          autoPlay={false}
          loop
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
        <span>1080 x 1920</span>
        <span>30fps</span>
        <span>20s (4 x 5s scenes)</span>
        {musicUrl && <span className="text-emerald-500">+ BGM</span>}
      </div>

      {/* Download Section */}
      {generated && (
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-green-400"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Download as MP4
              </h3>
              <p className="text-xs text-zinc-500">
                Server-side render via Remotion — H.264, 1080x1920
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {isRendering && (
            <div className="flex flex-col gap-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500">
                Rendering MP4... {renderProgress}%
              </span>
            </div>
          )}

          {/* Error */}
          {renderError && (
            <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-400">
              {renderError}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {!downloadUrl ? (
              <button
                onClick={handleRenderDownload}
                disabled={isRendering}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
              >
                {isRendering ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
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
                    Rendering MP4...
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Render & Download MP4
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={triggerFileDownload}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition-colors hover:bg-green-500"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download .mp4
                </button>
                <button
                  onClick={() => {
                    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
                    setDownloadUrl(null);
                    setRenderProgress(0);
                    setRenderError(null);
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5"
                >
                  Re-render
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
