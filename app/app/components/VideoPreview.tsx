"use client";

import { useRef, useState, useCallback } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { PromotionalVideo } from "../remotion/PromotionalVideo";
import type { PromotionalVideoProps, SceneText } from "../remotion/types";

interface VideoPreviewProps {
  videos: PromotionalVideoProps["videos"];
  musicUrl: string | null;
  sceneTexts: SceneText[];
  generated: boolean;
}

export default function VideoPreview({
  videos,
  musicUrl,
  sceneTexts,
  generated,
}: VideoPreviewProps) {
  const playerRef = useRef<PlayerRef>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const handleDownload = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;

    // Find the player container's canvas/video element
    const container = (player as unknown as { getContainerNode: () => HTMLDivElement }).getContainerNode();
    if (!container) return;

    setIsRecording(true);
    setDownloadUrl(null);
    setRecordingProgress(0);

    // Seek to start
    player.seekTo(0);
    player.pause();

    // We'll capture by playing and recording the visible element
    const playerElement = container.querySelector("iframe");
    const targetElement = playerElement?.contentDocument?.body || container;

    // Use a canvas-based approach to capture frames
    const fps = 30;
    const totalFrames = 600;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;

    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 8_000_000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setIsRecording(false);
      setRecordingProgress(100);
    };

    mediaRecorder.start();

    // Play through and capture each frame
    const ctx = canvas.getContext("2d")!;

    for (let frame = 0; frame < totalFrames; frame++) {
      player.seekTo(frame);

      // Wait for frame to render
      await new Promise((r) => setTimeout(r, 50));

      // Capture the player container to canvas
      try {
        // Try to use html2canvas-like approach via drawImage on video elements
        const videoElements = container.querySelectorAll("video");
        if (videoElements.length > 0) {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, 1080, 1920);
          videoElements.forEach((vid) => {
            try {
              ctx.drawImage(vid, 0, 0, 1080, 1920);
            } catch {
              // Cross-origin video, skip
            }
          });
        } else {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, 1080, 1920);
        }
      } catch {
        // Fallback: draw black frame
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 1080, 1920);
      }

      setRecordingProgress(Math.round((frame / totalFrames) * 100));
    }

    mediaRecorder.stop();
  }, []);

  const triggerFileDownload = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "promotional-video.webm";
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
                Video Ready
              </h3>
              <p className="text-xs text-zinc-500">
                Download your promotional video
              </p>
            </div>
          </div>

          {isRecording && (
            <div className="flex flex-col gap-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${recordingProgress}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500">
                Rendering... {recordingProgress}%
              </span>
            </div>
          )}

          <div className="flex gap-3">
            {!downloadUrl ? (
              <button
                onClick={handleDownload}
                disabled={isRecording}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
              >
                {isRecording ? (
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
                    Rendering Video...
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
                    Render & Download
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
                  Download .webm
                </button>
                <button
                  onClick={() => {
                    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
                    setDownloadUrl(null);
                    setRecordingProgress(0);
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5"
                >
                  Re-render
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-zinc-600">
            For production-quality MP4 output, use Remotion CLI:{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-zinc-400">
              npx remotion render PromotionalVideo output.mp4
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
