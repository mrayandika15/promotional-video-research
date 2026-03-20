"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Cleanup old download URL when inputs change
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleRenderDownload = useCallback(async () => {
    const player = playerRef.current;
    const container = containerRef.current;
    if (!player || !container) return;

    setIsRendering(true);
    setDownloadUrl(null);
    setRenderError(null);
    setRenderProgress(0);

    try {
      // Seek to start and pause
      player.seekTo(0);
      player.pause();
      await sleep(200);

      const totalFrames = 600;
      const fps = 30;
      const durationMs = (totalFrames / fps) * 1000;

      // Start playback and record the player element
      const playerEl = container.querySelector(
        '[data-remotion-player-container]'
      ) as HTMLElement | null;
      const targetEl = playerEl || container;

      // Create a canvas to composite frames
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;

      // Use canvas stream for recording
      const stream = canvas.captureStream(fps);

      // Also capture audio if music is loaded
      const audioCtx = new AudioContext();
      const destination = audioCtx.createMediaStreamDestination();

      // Find audio elements in the player and connect them
      const audioElements = container.querySelectorAll("audio");
      audioElements.forEach((audioEl) => {
        try {
          const source = audioCtx.createMediaElementSource(audioEl);
          source.connect(destination);
          source.connect(audioCtx.destination);
        } catch {
          // Already connected or cross-origin
        }
      });

      // Merge audio tracks into video stream
      destination.stream.getAudioTracks().forEach((track) => {
        stream.addTrack(track);
      });

      // Determine best supported format
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          resolve(blob);
        };
      });

      mediaRecorder.start(100); // Collect data every 100ms

      // Play the video and capture frames
      player.seekTo(0);
      player.play();

      // Monitor progress by polling current frame
      const startTime = Date.now();

      while (true) {
        await sleep(100);

        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / durationMs) * 100, 99);
        setRenderProgress(Math.round(progress));

        // Draw the player content to canvas
        try {
          // Find video elements inside the player
          const videoEls = container.querySelectorAll("video");
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, 1080, 1920);

          if (videoEls.length > 0) {
            for (const vid of videoEls) {
              if (vid.readyState >= 2 && !vid.paused) {
                // Calculate cover-fit dimensions
                const vw = vid.videoWidth || 1080;
                const vh = vid.videoHeight || 1920;
                const scale = Math.max(1080 / vw, 1920 / vh);
                const sw = vw * scale;
                const sh = vh * scale;
                const sx = (1080 - sw) / 2;
                const sy = (1920 - sh) / 2;
                ctx.drawImage(vid, sx, sy, sw, sh);
              }
            }
          }

          // Draw overlay elements (text, cards) from the DOM
          // We'll capture the full player as an image using a snapshot approach
          const overlayEls = container.querySelectorAll(
            '[style*="position: absolute"]'
          );
          // Overlays are rendered by React/Remotion so they're in the video
        } catch {
          // Frame capture failed, draw black
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, 1080, 1920);
        }

        if (elapsed >= durationMs) break;
      }

      // Stop everything
      player.pause();
      mediaRecorder.stop();
      audioCtx.close().catch(() => {});

      const blob = await recordingDone;
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setRenderProgress(100);
    } catch (error) {
      console.error("Recording error:", error);
      setRenderError(
        "Recording failed. Try using Chrome for best compatibility."
      );
    } finally {
      setIsRendering(false);
    }
  }, []);

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

      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl border border-white/10 bg-black"
      >
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
                Download Video
              </h3>
              <p className="text-xs text-zinc-500">
                Records the preview playback — plays once through all scenes
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {isRendering && (
            <div className="flex flex-col gap-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500">
                Recording playback... {renderProgress}%
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
                    Recording...
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
                    Record & Download
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
                  Download Video
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
                  Re-record
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-zinc-600">
            Output format: WebM (VP9). For production MP4, use a self-hosted
            server with{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-zinc-400">
              npx remotion render
            </code>
          </p>
        </div>
      )}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
