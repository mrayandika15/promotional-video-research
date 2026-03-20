"use client";

import { Composition } from "remotion";
import { PromotionalVideo } from "./PromotionalVideo";

// Root composition for Remotion Studio / CLI rendering
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VideoComposition = PromotionalVideo as React.FC<any>;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PromotionalVideo"
      component={VideoComposition}
      durationInFrames={600}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        videos: {
          destination1: null,
          destination2: null,
          destination3: null,
          destination4: null,
        },
      }}
    />
  );
};
