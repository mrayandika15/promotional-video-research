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

const SCENE_COLORS = ["#4A90D9", "#D4A853", "#E06B5E", "#5BAE6B"];
const SCENE_DURATION = 150; // frames per scene
const TOTAL_FRAMES = 600;
const FPS = 30;
const W = 1080;
const H = 1920;

/* ─── Canvas overlay drawing ─── */

function drawOverlays(
  ctx: CanvasRenderingContext2D,
  frame: number,
  sceneTexts: SceneText[]
) {
  const sceneIndex = Math.min(Math.floor(frame / SCENE_DURATION), 3);
  const localFrame = frame - sceneIndex * SCENE_DURATION;
  const scene = sceneTexts[sceneIndex];
  const color = SCENE_COLORS[sceneIndex];

  // Helper: ease-out for animations
  const ease = (f: number, delay: number, dur: number) =>
    Math.max(0, Math.min(1, (f - delay) / dur));
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  // ── Gradient overlay (bottom 60%) ──
  const grad = ctx.createLinearGradient(0, H * 0.4, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.3, "rgba(0,0,0,0.15)");
  grad.addColorStop(0.7, "rgba(0,0,0,0.65)");
  grad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Fade-in from black at scene start ──
  if (localFrame < 12) {
    ctx.fillStyle = `rgba(0,0,0,${1 - localFrame / 12})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Fade-out to black at scene end ──
  if (localFrame > SCENE_DURATION - 8) {
    const t = (localFrame - (SCENE_DURATION - 8)) / 8;
    ctx.fillStyle = `rgba(0,0,0,${t})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Layout: everything bottom-right aligned
  const padX = 48;
  const padBottom = 80;
  let y = H - padBottom;

  // ── Footnote ──
  if (scene.footnote) {
    const ft = easeOut(ease(localFrame, 35, 12));
    if (ft > 0) {
      ctx.globalAlpha = ft;
      ctx.font = "400 28px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.textAlign = "right";
      ctx.fillText(`※ ${scene.footnote}`, W - padX, y);
      ctx.globalAlpha = 1;
      y -= 50;
    }
  }

  // ── Info Card 2 ──
  if (scene.card2Title) {
    const ct2 = easeOut(ease(localFrame, 23, 12));
    if (ct2 > 0) {
      y = drawInfoCard(ctx, scene.card2Title, scene.card2Subtitle, color, padX, y, ct2);
      y -= 16;
    }
  }

  // ── Info Card 1 ──
  if (scene.card1Title) {
    const ct1 = easeOut(ease(localFrame, 15, 12));
    if (ct1 > 0) {
      y = drawInfoCard(ctx, scene.card1Title, scene.card1Subtitle, color, padX, y, ct1);
      y -= 24;
    }
  }

  // ── Scene Title ──
  const tt = easeOut(ease(localFrame, 8, 12));
  if (tt > 0) {
    ctx.globalAlpha = tt;
    const titleY = y + (1 - tt) * 30;
    ctx.font = "900 76px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;
    ctx.fillText(scene.title, W - padX, titleY);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.globalAlpha = 1;
    y = titleY - 80;
  }

  // ── Brand Header ──
  const bt = easeOut(ease(localFrame, 3, 12));
  if (bt > 0) {
    const bw = 240;
    const bh = 56;
    const bx = W - padX - bw;
    const by = y - bh;
    const scale = 0.7 + bt * 0.3;
    ctx.globalAlpha = bt;
    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(bx + bw / 2), -(by + bh / 2));

    // White pill background
    roundRect(ctx, bx, by, bw, bh, 14);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Blue logo square
    roundRect(ctx, bx + 12, by + 10, 36, 36, 8);
    const logoGrad = ctx.createLinearGradient(bx + 12, by + 10, bx + 48, by + 46);
    logoGrad.addColorStop(0, "#4A90D9");
    logoGrad.addColorStop(1, "#2E5CA8");
    ctx.fillStyle = logoGrad;
    ctx.fill();

    // "JD" text in logo
    ctx.font = "900 18px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("JD", bx + 30, by + 34);

    // "JDR 투어" text
    ctx.font = "800 26px sans-serif";
    ctx.fillStyle = "#2E5CA8";
    ctx.textAlign = "left";
    ctx.fillText("JDR 투어", bx + 58, by + 37);

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function drawInfoCard(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  color: string,
  padX: number,
  bottomY: number,
  opacity: number
): number {
  ctx.globalAlpha = opacity;

  const cardW = W - padX * 2;
  const titleLines = wrapText(ctx, title.replace(/\\n/g, "\n"), "700 40px sans-serif", cardW - 60);
  const subtitleLines = subtitle
    ? wrapText(ctx, subtitle, "400 28px sans-serif", cardW - 60)
    : [];

  const lineH = 48;
  const subLineH = 36;
  const cardPadY = 28;
  const cardH =
    cardPadY * 2 +
    titleLines.length * lineH +
    (subtitleLines.length > 0 ? 12 + subtitleLines.length * subLineH : 0);

  const cardX = padX;
  const cardY = bottomY - cardH;
  const slideY = (1 - opacity) * 25;

  // Card background
  roundRect(ctx, cardX, cardY + slideY, cardW, cardH, 20);
  ctx.fillStyle = hexToRgba(color, 0.75);
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Title text
  ctx.font = "700 40px sans-serif";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  let ty = cardY + slideY + cardPadY + 36;
  for (const line of titleLines) {
    ctx.fillText(line, W / 2, ty);
    ty += lineH;
  }

  // Subtitle text
  if (subtitleLines.length > 0) {
    ctx.font = "400 28px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ty += 4;
    for (const line of subtitleLines) {
      ctx.fillText(line, W / 2, ty);
      ty += subLineH;
    }
  }

  ctx.globalAlpha = 1;
  return cardY;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number
): string[] {
  ctx.font = font;
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split("");
    let current = "";
    for (const char of words) {
      const test = current + char;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length > 0 ? lines : [""];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ─── Component ─── */

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
      await sleep(500);

      const durationMs = (TOTAL_FRAMES / FPS) * 1000;

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      const stream = canvas.captureStream(FPS);

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

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 10_000_000,
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

      mediaRecorder.start(50);
      player.seekTo(0);
      player.play();

      const startTime = Date.now();
      let stopped = false;

      // Use requestAnimationFrame for smooth frame capture
      const captureFrame = () => {
        if (stopped) return;

        const elapsed = Date.now() - startTime;
        const currentFrame = Math.floor((elapsed / 1000) * FPS);

        // Draw black background
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);

        // Draw video frames
        const videoEls = container.querySelectorAll("video");
        for (const vid of videoEls) {
          try {
            if (vid.readyState >= 2) {
              const vw = vid.videoWidth || W;
              const vh = vid.videoHeight || H;
              const scale = Math.max(W / vw, H / vh);
              const sw = vw * scale;
              const sh = vh * scale;
              ctx.drawImage(vid, (W - sw) / 2, (H - sh) / 2, sw, sh);
            }
          } catch {
            // Skip this video element
          }
        }

        // Draw overlays (text, cards, brand header)
        drawOverlays(ctx, Math.min(currentFrame, TOTAL_FRAMES - 1), sceneTexts);

        // Update progress (recording = 0-50%)
        setProgress(Math.round(Math.min((elapsed / durationMs) * 50, 49)));

        if (elapsed < durationMs) {
          requestAnimationFrame(captureFrame);
        } else {
          stopped = true;
          player.pause();
          mediaRecorder.stop();
          audioCtx.close().catch(() => {});
        }
      };

      requestAnimationFrame(captureFrame);

      const webmBlob = await recordingDone;
      setProgress(50);

      // ── Step 2: Convert WebM → MP4 ──
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
  }, [sceneTexts]);

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
                Records playback with overlays → converts to H.264 MP4
              </p>
            </div>
          </div>

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
                {phase === "recording"
                  ? `Recording playback... ${progress}%`
                  : `Converting to MP4... ${progress}%`}
              </span>
            </div>
          )}

          {renderError && (
            <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-400">
              {renderError}
            </div>
          )}

          <div className="flex gap-3">
            {phase !== "done" ? (
              <button
                onClick={handleRenderDownload}
                disabled={isWorking}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
              >
                {isWorking ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    {phase === "recording" ? "Recording..." : "Converting to MP4..."}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

          {/* Note */}
          <div className="flex gap-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/10 p-3.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mt-0.5 shrink-0 text-yellow-500/70"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-xs leading-relaxed text-zinc-500">
              <span className="font-medium text-zinc-400">Client-side rendering</span>{" "}
              — This demo renders video in your browser due to Vercel serverless
              limitations. In production, this will be replaced with server-side
              rendering using Remotion&apos;s <code className="rounded bg-white/5 px-1 py-0.5 text-zinc-400">renderMedia()</code> API
              for higher quality, faster output, and full 1080x1920 resolution.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
