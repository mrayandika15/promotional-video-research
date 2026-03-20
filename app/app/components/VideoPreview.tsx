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

type RenderPhase = "idle" | "recording" | "converting" | "done";

export default function VideoPreview({
  videos,
  musicUrl,
  sceneTexts,
  generated,
}: VideoPreviewProps) {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<RenderPhase>("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleRenderDownload = useCallback(async () => {
    const player = playerRef.current;
    const container = containerRef.current;
    if (!player || !container) return;

    setPhase("recording");
    setDownloadUrl(null);
    setRenderError(null);
    setProgress(0);

    try {
      // ── Step 1: Record playback as WebM ──
      player.seekTo(0);
      player.pause();
      await sleep(300);

      const totalFrames = 600;
      const fps = 30;
      const durationMs = (totalFrames / fps) * 1000;

      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;

      const stream = canvas.captureStream(fps);

      // Capture audio
      const audioCtx = new AudioContext();
      const destination = audioCtx.createMediaStreamDestination();
      const audioElements = container.querySelectorAll("audio");
      audioElements.forEach((audioEl) => {
        try {
          const source = audioCtx.createMediaElementSource(audioEl);
          source.connect(destination);
          source.connect(audioCtx.destination);
        } catch {
          // Already connected
        }
      });
      destination.stream.getAudioTracks().forEach((track) => {
        stream.addTrack(track);
      });

      const mimeType = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp9,opus"
      )
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
          resolve(new Blob(chunks, { type: "video/webm" }));
        };
      });

      mediaRecorder.start(100);
      player.seekTo(0);
      player.play();

      const startTime = Date.now();

      while (true) {
        await sleep(100);
        const elapsed = Date.now() - startTime;

        // Recording = 0-50% of total progress
        setProgress(Math.round(Math.min((elapsed / durationMs) * 50, 49)));

        // Draw video frames to canvas
        try {
          const videoEls = container.querySelectorAll("video");
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, 1080, 1920);
          for (const vid of videoEls) {
            if (vid.readyState >= 2 && !vid.paused) {
              const vw = vid.videoWidth || 1080;
              const vh = vid.videoHeight || 1920;
              const scale = Math.max(1080 / vw, 1920 / vh);
              const sw = vw * scale;
              const sh = vh * scale;
              ctx.drawImage(vid, (1080 - sw) / 2, (1920 - sh) / 2, sw, sh);
            }
          }
        } catch {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, 1080, 1920);
        }

        if (elapsed >= durationMs) break;
      }

      player.pause();
      mediaRecorder.stop();
      audioCtx.close().catch(() => {});

      const webmBlob = await recordingDone;
      setProgress(50);

      // ── Step 2: Convert WebM → MP4 using @remotion/webcodecs ──
      setPhase("converting");

      const { convertMedia } = await import("@remotion/webcodecs");

      const webmFile = new File([webmBlob], "recording.webm", {
        type: "video/webm",
      });

      const result = await convertMedia({
        src: webmFile,
        container: "mp4",
        videoCodec: "h264",
        audioCodec: "aac",
        onProgress: (state) => {
          // Converting = 50-95% of total progress
          if (state.overallProgress !== null) {
            setProgress(50 + Math.round(state.overallProgress * 45));
          }
        },
      });

      const mp4Blob = await result.save();
      const url = URL.createObjectURL(mp4Blob);
      setDownloadUrl(url);
      setProgress(100);
      setPhase("done");
    } catch (error) {
      console.error("Render error:", error);
      setRenderError(String(error));
      setPhase("idle");
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

  const resetDownload = useCallback(() => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setProgress(0);
    setRenderError(null);
    setPhase("idle");
  }, [downloadUrl]);

  const isWorking = phase === "recording" || phase === "converting";

  const phaseLabel =
    phase === "recording"
      ? "Recording playback..."
      : phase === "converting"
      ? "Converting to MP4..."
      : "";

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
                Download as MP4
              </h3>
              <p className="text-xs text-zinc-500">
                Records playback → converts to H.264 MP4 in browser
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {isWorking && (
            <div className="flex flex-col gap-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    backgroundColor:
                      phase === "recording" ? "#3b82f6" : "#8b5cf6",
                  }}
                />
              </div>
              <span className="text-xs text-zinc-500">
                {phaseLabel} {progress}%
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
            {phase !== "done" ? (
              <button
                onClick={handleRenderDownload}
                disabled={isWorking}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
              >
                {isWorking ? (
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
                    {phase === "recording"
                      ? "Recording..."
                      : "Converting to MP4..."}
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
                    Record & Download MP4
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
                  onClick={resetDownload}
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
