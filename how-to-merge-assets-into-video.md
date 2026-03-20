# How to Merge Images/Videos into Promotional Videos

## What is Remotion?

**Remotion** is an open-source framework that lets you create videos using React. Instead of dragging clips around in a video editor, you write React components — and Remotion renders them frame-by-frame into a real MP4 video.

**Think of it this way:**
- A normal React app renders components to the **browser screen**
- Remotion renders components to **video frames** (30 per second)

Every frame of your video is just a React component at a specific point in time. That means anything you can build in React — layouts, animations, text, images — you can put in a video.

### Core Concepts

| Concept | What It Does |
|---------|-------------|
| `useCurrentFrame()` | Returns the current frame number — use this to animate things over time |
| `interpolate()` | Maps frame numbers to values (e.g., frame 0–150 → opacity 0–1) |
| `<Sequence>` | Places a component on the timeline at a specific start time and duration |
| `<Composition>` | Defines the video (width, height, fps, total duration) |
| `<Img>`, `<Video>`, `<Audio>` | Remotion-aware media components that sync with the video timeline |
| `renderMedia()` | Server-side API to render a composition to MP4/WebM |
| `@remotion/player` | In-browser preview — users see the video before rendering |

### Simple Example

```tsx
import { useCurrentFrame, interpolate, AbsoluteFill, Img } from 'remotion';

// This component = one frame of video
// Remotion calls it 30 times per second (at 30fps)
const ZoomingPhoto = ({ src }) => {
  const frame = useCurrentFrame();                        // e.g., 0, 1, 2, ... 150
  const scale = interpolate(frame, [0, 150], [1, 1.3]);  // zoom from 1x to 1.3x

  return (
    <AbsoluteFill>
      <Img src={src} style={{ transform: `scale(${scale})` }} />
    </AbsoluteFill>
  );
};
```

At frame 0, the image is at normal size. At frame 150 (5 seconds at 30fps), it's zoomed to 130%. That's the Ken Burns effect — just CSS transforms driven by the frame counter.

---

## How We Use Remotion to Generate Promotional Videos

**The approach:** Client gives us raw images/videos + trip details → We feed them as props into Remotion React components → Remotion renders a polished MP4.

```
Client images/videos  →  Remotion (React components)  →  Final MP4 video
```

---

## How It Works

### 1. Each scene is a React component

Instead of editing in Premiere or After Effects, you write React code. Each frame of the video is just a React component rendered at a specific timestamp.

```tsx
// A simple scene that shows a hotel image with Ken Burns zoom
const AccommodationScene = ({ hotelImage, label }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 150], [1, 1.3]); // slow zoom in

  return (
    <AbsoluteFill>
      <Img src={hotelImage} style={{ transform: `scale(${zoom})` }} />
      <PillBadge text={label} />
    </AbsoluteFill>
  );
};
```

### 2. Scenes are composed into a timeline

Remotion uses `<Sequence>` to place scenes on a timeline — just like tracks in a video editor, but in code.

```tsx
const TravelVideo = ({ assets, texts }) => {
  return (
    <Composition width={1080} height={1920} fps={30}>
      <Sequence from={0} durationInFrames={300}>
        <HookScene media={assets.hook} destination={texts.destination} />
      </Sequence>

      <Sequence from={300} durationInFrames={300}>
        <AccommodationScene hotelImage={assets.hotel1} label="5-Star Hotel" />
      </Sequence>

      <Sequence from={600} durationInFrames={450}>
        <JourneyScene activities={assets.activities} />
      </Sequence>

      <Sequence from={1050} durationInFrames={300}>
        <FoodScene images={assets.food} />
      </Sequence>

      <Sequence from={1350} durationInFrames={150}>
        <FinalPitchScene image={assets.sunset} price={texts.price} />
      </Sequence>

      {/* Background music plays the entire duration */}
      <Audio src="/assets/audio/upbeat-travel.mp3" />
    </Composition>
  );
};
```

### 3. Remotion renders it to MP4

```ts
// Server-side rendering
import { bundle } from '@remotion/bundler';
import { renderMedia } from '@remotion/renderer';

const bundled = await bundle('./src/index.ts');

await renderMedia({
  composition: 'TravelVideo',
  serveUrl: bundled,
  codec: 'h264',
  outputLocation: 'output/travel-promo.mp4',
  inputProps: {
    assets: { hook: '/uploads/airplane.jpg', hotel1: '/uploads/hotel.jpg', ... },
    texts: { destination: 'Nha Trang', price: '₩790,000~', ... },
  },
});
```

That's it. **Images in → MP4 out.**

---

## What Remotion Handles Automatically

| Task | How |
|------|-----|
| **Static image → motion** | Ken Burns (pan/zoom) via CSS transforms animated per frame |
| **Scene transitions** | Cross-fade, slide, wipe — built with `interpolate()` + `<Sequence>` overlap |
| **Text overlays** | React components (pill badges, banners, CTAs) — styled with CSS, animated per frame |
| **Video clips** | `<Video>` component trims and places client clips at exact timestamps |
| **Background music** | `<Audio>` component with volume control and fade-in/out |
| **Final output** | `renderMedia()` produces H.264 MP4 at any resolution/fps |

---

## Why Remotion (vs Alternatives)

| Approach | Pros | Cons |
|----------|------|------|
| **Remotion** | React-based (familiar), live preview in browser, programmatic, deterministic | Needs Node.js + Chrome for rendering |
| FFmpeg filter graphs | Free, fast, no browser needed | Extremely complex syntax for animations/overlays |
| After Effects + Templater | Pro-quality output | Expensive license, hard to automate at scale |
| Shotstack API | Hosted, no infra to manage | $0.49/min of video, vendor lock-in |
| Creatomate API | Good template system | $0.40+/video, limited customization |

**Remotion wins** because:
- Templates are just React — any developer can build/modify them
- `@remotion/player` gives free in-browser preview before rendering
- Self-hosted = near-zero per-video cost (just CPU time)
- Full control over every pixel and every frame

---

## Minimal Steps to Get Started

```bash
# 1. Create a Remotion project
npx create-video@latest

# 2. Build your scene components (React)
#    - Use <Img>, <Video>, <Audio> for client assets
#    - Use interpolate() for animations (Ken Burns, fade, slide)
#    - Use <Sequence> to arrange scenes on timeline

# 3. Preview in browser
npx remotion studio

# 4. Render to MP4
npx remotion render TravelVideo output.mp4

# 5. For server-side (production), use @remotion/renderer API
#    renderMedia({ composition, inputProps, codec: 'h264', ... })
```
