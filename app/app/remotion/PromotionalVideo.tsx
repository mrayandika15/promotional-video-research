"use client";

import {
  AbsoluteFill,
  Sequence,
  Video,
  useCurrentFrame,
  interpolate,
  OffthreadVideo,
} from "remotion";
import type { PromotionalVideoProps } from "./types";

const SceneOverlay = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [delay, delay + 15], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          color: "white",
          padding: "12px 28px",
          borderRadius: 999,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const TransitionOverlay = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8], [1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        opacity,
      }}
    />
  );
};

const VideoScene = ({
  src,
  label,
}: {
  src: string;
  label: string;
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <TransitionOverlay />
      <SceneOverlay text={label} delay={10} />
    </AbsoluteFill>
  );
};

const Placeholder = ({ label }: { label: string }) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame, [0, 30, 60], [0.4, 0.6, 0.4], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: pulse,
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 20,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

const SCENE_DURATION = 150; // 5 seconds at 30fps

export const PromotionalVideo: React.FC<PromotionalVideoProps> = ({
  videos,
}) => {
  const scenes = [
    { key: "destination1" as const, label: "Destination 1" },
    { key: "destination2" as const, label: "Destination 2" },
    { key: "destination3" as const, label: "Destination 3" },
    { key: "destination4" as const, label: "Destination 4" },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {scenes.map((scene, i) => {
        const src = videos[scene.key];
        return (
          <Sequence
            key={scene.key}
            from={i * SCENE_DURATION}
            durationInFrames={SCENE_DURATION}
          >
            {src ? (
              <VideoScene src={src} label={scene.label} />
            ) : (
              <Placeholder label={scene.label} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
