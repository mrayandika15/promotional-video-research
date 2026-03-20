"use client";

import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  interpolate,
  OffthreadVideo,
  spring,
  useVideoConfig,
} from "remotion";
import type { PromotionalVideoProps, SceneText } from "./types";

/* ─── Animated helpers ─── */

const useSlideUp = (delay: number, distance = 40) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 } });
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };
};

const useScaleIn = (delay: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 100 } });
  return {
    opacity: progress,
    transform: `scale(${interpolate(progress, [0, 1], [0.7, 1])})`,
  };
};

/* ─── Brand Header (하나투어 style) ─── */

const BrandHeader = ({ delay = 0 }: { delay?: number }) => {
  const style = useScaleIn(delay);

  return (
    <div
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: "white",
        padding: "10px 28px",
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          background: "linear-gradient(135deg, #4A90D9, #2E5CA8)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 18,
          fontWeight: 900,
        }}
      >
        JD
      </div>
      <span
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "#2E5CA8",
          letterSpacing: -0.5,
        }}
      >
        JDR 투어
      </span>
    </div>
  );
};

/* ─── Scene Title (국적기 왕복 직항 탑승 style) ─── */

const SceneTitle = ({
  text,
  delay = 5,
}: {
  text: string;
  delay?: number;
}) => {
  const style = useSlideUp(delay);

  return (
    <div
      style={{
        ...style,
        fontSize: 44,
        fontWeight: 900,
        color: "white",
        textAlign: "right",
        textShadow: "0 3px 12px rgba(0,0,0,0.6)",
        lineHeight: 1.3,
        letterSpacing: -0.5,
        width: "100%",
      }}
    >
      {text}
    </div>
  );
};

/* ─── Info Card (rounded rectangle card style) ─── */

const InfoCard = ({
  title,
  subtitle,
  delay = 10,
  color = "#4A90D9",
}: {
  title: string;
  subtitle?: string;
  delay?: number;
  color?: string;
}) => {
  const style = useSlideUp(delay, 30);

  return (
    <div
      style={{
        ...style,
        background: `linear-gradient(135deg, ${color}dd, ${color}99)`,
        backdropFilter: "blur(12px)",
        borderRadius: 20,
        padding: "20px 32px",
        border: "1px solid rgba(255,255,255,0.2)",
        width: "100%",
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "white",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.75)",
            textAlign: "center",
            marginTop: 8,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

/* ─── Footnote ─── */

const Footnote = ({ text, delay = 20 }: { text: string; delay?: number }) => {
  const style = useSlideUp(delay, 15);

  return (
    <div
      style={{
        ...style,
        fontSize: 16,
        color: "rgba(255,255,255,0.5)",
        textAlign: "right",
        width: "100%",
      }}
    >
      ※ {text}
    </div>
  );
};

/* ─── Scene Overlay Layouts ─── */

const SCENE_COLORS = ["#4A90D9", "#D4A853", "#E06B5E", "#5BAE6B"];

const KoreanSceneOverlay = ({
  sceneIndex,
  sceneText,
}: {
  sceneIndex: number;
  sceneText: SceneText;
}) => {
  const color = SCENE_COLORS[sceneIndex];
  const cards = [
    { title: sceneText.card1Title, subtitle: sceneText.card1Subtitle },
    { title: sceneText.card2Title, subtitle: sceneText.card2Subtitle },
  ].filter((c) => c.title);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        padding: "40px 32px 60px",
        gap: 16,
        background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.65) 75%, rgba(0,0,0,0.85) 100%)",
      }}
    >
      <BrandHeader delay={3} />
      <SceneTitle text={sceneText.title} delay={8} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        {cards.map((card, i) => (
          <InfoCard
            key={i}
            title={card.title}
            subtitle={card.subtitle}
            color={color}
            delay={15 + i * 8}
          />
        ))}
      </div>
      {sceneText.footnote && <Footnote text={sceneText.footnote} delay={35} />}
    </div>
  );
};

/* ─── Transition ─── */

const SceneTransition = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade from black at start
  const fadeIn = interpolate(frame, [0, 12], [1, 0], {
    extrapolateRight: "clamp",
  });

  // Fade to black at end (last 8 frames of scene)
  const fadeOut = interpolate(
    frame,
    [SCENE_DURATION - 8, SCENE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        opacity: Math.max(fadeIn, fadeOut),
        pointerEvents: "none",
      }}
    />
  );
};

/* ─── Video Scene ─── */

const VideoScene = ({
  src,
  sceneIndex,
  sceneText,
}: {
  src: string;
  sceneIndex: number;
  sceneText: SceneText;
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, SCENE_DURATION], [1, 1.08], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
      <KoreanSceneOverlay sceneIndex={sceneIndex} sceneText={sceneText} />
      <SceneTransition />
    </AbsoluteFill>
  );
};

/* ─── Placeholder ─── */

const Placeholder = ({
  sceneText,
}: {
  sceneText: SceneText;
}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame, [0, 30, 60], [0.3, 0.5, 0.3], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          opacity: pulse,
        }}
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <div
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          {sceneText.title}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─── Main Composition ─── */

const SCENE_DURATION = 150; // 5 seconds at 30fps
const TOTAL_DURATION = SCENE_DURATION * 4;

export const PromotionalVideo: React.FC<PromotionalVideoProps> = ({
  videos,
  musicUrl,
  sceneTexts,
}) => {
  const scenes = [
    { key: "destination1" as const },
    { key: "destination2" as const },
    { key: "destination3" as const },
    { key: "destination4" as const },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Background music — plays across all scenes */}
      {musicUrl && (
        <Audio
          src={musicUrl}
          volume={(f) => {
            if (f < 15) return interpolate(f, [0, 15], [0, 0.8]);
            if (f > TOTAL_DURATION - 30)
              return interpolate(
                f,
                [TOTAL_DURATION - 30, TOTAL_DURATION],
                [0.8, 0],
                { extrapolateRight: "clamp" }
              );
            return 0.8;
          }}
        />
      )}

      {/* Video scenes */}
      {scenes.map((scene, i) => {
        const src = videos[scene.key];
        const text = sceneTexts[i];
        return (
          <Sequence
            key={scene.key}
            from={i * SCENE_DURATION}
            durationInFrames={SCENE_DURATION}
          >
            {src ? (
              <VideoScene src={src} sceneIndex={i} sceneText={text} />
            ) : (
              <Placeholder sceneText={text} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
