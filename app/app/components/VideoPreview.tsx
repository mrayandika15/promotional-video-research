"use client";

import { Player } from "@remotion/player";
import { PromotionalVideo } from "../remotion/PromotionalVideo";
import type { PromotionalVideoProps, SceneText } from "../remotion/types";

interface VideoPreviewProps {
  videos: PromotionalVideoProps["videos"];
  musicUrl: string | null;
  sceneTexts: SceneText[];
}

export default function VideoPreview({
  videos,
  musicUrl,
  sceneTexts,
}: VideoPreviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-purple-500" />
        <h2 className="text-xl font-semibold text-white">Preview</h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <Player
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
    </div>
  );
}
