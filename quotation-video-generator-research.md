# Travel Quotation Video Generator — Research Document

> Research date: 2026-03-20
> Author: JDR Engineering Team

---

## 1. The Problem

Travel agencies need promotional videos for social media (TikTok/Reels/Shorts). They only have **raw images and short video clips** of destinations, hotels, food, etc. They need a system that takes these raw assets and **automatically generates a polished, high-energy quotation video** (~1:15, 9:16 vertical) with transitions, text overlays, and music.

**Input:** Client uploads images + videos + trip details (destination, price, selling points)
**Output:** A ready-to-post promotional video

---

## 2. Reference Video Breakdown

The target output is a **~1:15 travel quotation teaser** in **9:16 vertical format**.

### Scene Structure

| Scene | Timestamp | Client Assets Needed | Auto-Generated Elements |
|-------|-----------|---------------------|------------------------|
| **Hook** | 0:00–0:10 | 2 images/clips (transport, arrival) | Destination banner, zoom animation |
| **Accommodation** | 0:11–0:20 | 2–3 hotel images | Ken Burns pan/zoom, "5-star hotel" badge |
| **Journey** | 0:21–0:40 | 3–4 activity images/clips | Activity name badges, fast-cut transitions |
| **Food** | 0:41–0:55 | 2–3 food/restaurant images | "Local restaurants" badge, slide transitions |
| **Activities** | 0:56–1:10 | 2–3 extra activity clips | Selling point pills, energy transitions |
| **Final Pitch** | 1:11–1:15 | 1 scenic/sunset image | Price CTA overlay, fade out |

### What the System Must Generate Automatically

- **Motion from stills**: Ken Burns effect (slow pan/zoom) to make static images cinematic
- **Transitions**: Fast cuts (1.5–2s), cross-fades, slide-ins between scenes
- **Text overlays**: Colorful pill-shaped badges with selling points, destination banners, price CTA
- **Audio**: Background music with fade-in/out, beat-synced cuts (stretch goal)
- **Timing**: Automatic scene duration allocation based on number of assets provided
- **Output**: 1080×1920, 30fps, H.264 MP4

---

## 3. Video Generation Approach

### Core: Remotion (React → Video)

Remotion is a React framework for creating videos programmatically. Each frame is a React component rendered at a specific time. This is the core engine that transforms client assets into video.

**Why Remotion for this problem:**
- Client gives images → Remotion wraps them in animated React components (Ken Burns, slide-in, scale)
- Client gives text → Remotion renders animated text overlays (pill badges, banners, CTAs)
- Everything is code → templates are reusable, parameterized, version-controlled
- `@remotion/player` gives **live preview in browser** before final render

### Assembly: FFmpeg

After Remotion renders individual scenes, FFmpeg handles:
- Concatenating scenes with transitions
- Mixing background music (fade-in/out, volume normalization)
- Final encoding (H.264, optimized for social media upload)

### Processing Pipeline

```
Client uploads images/videos + fills in trip details
    ↓
1. ASSET PREPARATION (parallel)
   - Validate & normalize all uploads
   - Resize images to 1080×1920 (cover crop / smart crop)
   - Transcode videos to consistent format (WebM/MP4, 30fps)
   - Generate thumbnails for editor preview
    ↓
2. SCENE RENDERING (parallel per scene)
   - Remotion renders each scene as individual MP4 segment
   - Applies Ken Burns, text overlays, transitions per scene
   - Each scene = 5–20 seconds depending on asset count
    ↓
3. FINAL ASSEMBLY (sequential)
   - FFmpeg concatenates all scene segments
   - Applies cross-fade transitions between scenes
   - Mixes background music track
   - Outputs final MP4 (1080×1920, 30fps, H.264)
    ↓
4. DELIVERY
   - Upload to storage (S3/R2)
   - Generate shareable link / direct download
   - Notify client via WebSocket
```

---

## 4. Template System

Templates define **how** client assets get transformed into video. Each template is a set of React components with slot definitions.

### Template Manifest

```typescript
export const travelQuotationManifest = {
  id: 'travel-quotation',
  name: 'Travel Quotation Teaser',
  format: { width: 1080, height: 1920, fps: 30 },
  totalDurationMs: 75000,  // ~1:15

  // What the client needs to provide
  mediaSlots: [
    { name: 'hook-1', type: 'image|video', label: 'Transport/Arrival', scene: 'hook', required: true },
    { name: 'hook-2', type: 'image|video', label: 'Destination Arrival', scene: 'hook', required: false },
    { name: 'hotel-1', type: 'image', label: 'Hotel Exterior/Pool', scene: 'accommodation', required: true },
    { name: 'hotel-2', type: 'image', label: 'Hotel Room', scene: 'accommodation', required: true },
    { name: 'activity-1', type: 'image|video', label: 'Activity 1', scene: 'journey', required: true },
    { name: 'activity-2', type: 'image|video', label: 'Activity 2', scene: 'journey', required: true },
    { name: 'activity-3', type: 'image|video', label: 'Activity 3', scene: 'journey', required: false },
    { name: 'food-1', type: 'image', label: 'Food 1', scene: 'food', required: true },
    { name: 'food-2', type: 'image', label: 'Food 2', scene: 'food', required: false },
    { name: 'extra-1', type: 'image|video', label: 'Extra Activity', scene: 'activities', required: false },
    { name: 'sunset', type: 'image', label: 'Scenic Closing Shot', scene: 'final', required: true },
  ],

  textSlots: [
    { name: 'destination', label: 'Destination Name', placeholder: 'Nha Trang & Dalat' },
    { name: 'duration', label: 'Trip Duration', placeholder: '3 Nights, 5 Days' },
    { name: 'highlights', label: 'Selling Points (one per line)', multiline: true },
    { name: 'price', label: 'Price', placeholder: '₩790,000~' },
    { name: 'cta', label: 'Call to Action', placeholder: 'DM for inquiry' },
  ],

  audioSlot: {
    name: 'bgm',
    label: 'Background Music',
    defaultTrack: '/assets/audio/upbeat-travel.mp3',
    allowCustom: true,
  },
};
```

### How Templates Transform Assets

| Client Gives | Template Generates |
|-------------|-------------------|
| Static hotel photo | Ken Burns zoom-in with warm color grade, "5-star hotel" pill badge animating in |
| Raw food photo | Slide-in transition, slight zoom, "Local restaurants included" overlay |
| Short activity clip | Trimmed to 2s, cross-fade transition, activity name badge |
| Trip price text | Animated price CTA with gradient background on final scene |
| Destination name | Top banner with destination + duration, animated entrance |

---

## 5. AI Video Generation Providers (Optional Enhancements)

For cases where clients don't have enough media or want higher production value, AI can fill gaps.

### Image-to-Video (Animate Client Photos)

| Provider | Model | Cost/Clip | Duration | Quality | Best For |
|----------|-------|-----------|----------|---------|----------|
| **Kling AI** | Kling V3 | $0.50–1.00 | 10s | High | Animating travel photos with camera motion |
| **Runway** | Gen-4 Turbo | ~$0.50 | 5–10s | High | Cinematic shot generation from stills |
| **Luma AI** | Dream Machine | $0.30–0.50 | 5s | Medium-High | Fast generation, travel-friendly |
| **Pika** | Pika 2.2 | $0.20–0.40 | 4s | Medium | Budget option for simple animations |
| **Minimax** | Video-01 | $0.10–0.30 | 6s | Medium | Cheapest, acceptable quality |
| **Google Veo** | Veo 2 | ~$0.30 | 8s | High | Good if on GCP |

### Other AI Services

| Service | Purpose | Provider | Cost |
|---------|---------|----------|------|
| Background removal | Clean product/hotel shots | Replicate `rembg` | $0.002/image |
| Image upscaling | Fix low-res client uploads | Real-ESRGAN | $0.01/image |
| Smart cropping | Auto-crop to 9:16 focusing on subject | Replicate | $0.005/image |
| AI voiceover | Narration track | ElevenLabs | $0.18/1000 chars |
| Music generation | Custom BGM per video | Suno / Udio | $0.10–0.50/track |

### When to Use AI vs Template Compositing

| Scenario | Approach | Cost |
|----------|----------|------|
| Client has all required images/videos | **Template only** — Ken Burns + transitions | < $0.10 |
| Client has images but wants them animated | **AI image-to-video** on select scenes | $1–3 extra |
| Client is missing some scenes | **AI generates filler b-roll** from text prompt | $1–5 extra |
| Client wants voiceover | **AI TTS** narration track | ~$0.50 extra |
| Client uploaded low-res photos | **AI upscale** before processing | ~$0.10 extra |

---

## 6. Cost Analysis

### Per-Video Cost

| Tier | What's Included | Cost/Video |
|------|----------------|------------|
| **Basic** | Template compositing only (Ken Burns, transitions, overlays, music) | < $0.10 |
| **Enhanced** | Basic + AI upscaling + smart crop + bg removal | ~$0.50 |
| **Premium** | Enhanced + AI-animated scenes (2–3 clips via Kling/Runway) | $2–5 |
| **Full AI** | Premium + AI voiceover + AI-generated filler scenes | $5–10 |

### Infrastructure (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| VPS (2+ cores, 4GB+ RAM) | $40–80 | Remotion + FFmpeg rendering |
| Redis | $15–30 | Job queue (BullMQ) |
| PostgreSQL | $15–25 | Application data |
| Cloudflare R2 | $0.015/GB | Zero egress, media storage |
| CDN | $10 | Video delivery |
| **Total** | **~$80–150/month** | Scales with worker count |

---

## 7. Implementation Phases

### Phase 1 — Core Video Generation Engine

> Goal: Client uploads assets → system generates video

| Step | Task | Detail |
|------|------|--------|
| 1.1 | Remotion template | Build travel-quotation template with all 6 scenes, Ken Burns, text overlays |
| 1.2 | Asset processor | Sharp-based resize/crop/transcode pipeline for client uploads |
| 1.3 | Rendering pipeline | BullMQ workers: asset prep → scene render → FFmpeg assembly |
| 1.4 | API endpoints | Upload (presigned URL), generate, status, download |
| 1.5 | Basic frontend | Upload form, slot filling, text input, generate button, download result |

### Phase 2 — Preview & Polish

> Goal: Live preview before generation, professional transitions

| Step | Task | Detail |
|------|------|--------|
| 2.1 | Live preview | `@remotion/player` in-browser preview with client assets |
| 2.2 | Transition library | Multiple transition styles (cross-fade, slide, zoom, wipe) |
| 2.3 | Text animation | Animated pill badges, typing effect, slide-in overlays |
| 2.4 | Music sync | Beat detection for cut timing (stretch goal) |
| 2.5 | Progress UI | Real-time generation progress via WebSocket |

### Phase 3 — AI Enhancements

> Goal: Higher production value for premium tier

| Step | Task | Detail |
|------|------|--------|
| 3.1 | AI image-to-video | Kling/Runway integration to animate select client photos |
| 3.2 | Smart preprocessing | AI upscaling, background removal, smart 9:16 crop |
| 3.3 | AI filler generation | Generate missing scene footage from text prompts |
| 3.4 | Multiple templates | Additional template designs beyond travel quotation |

### Phase 4 — Production & Scale

| Step | Task | Detail |
|------|------|--------|
| 4.1 | Auth & accounts | User registration, project management |
| 4.2 | Payments | Credit-based system (Stripe) |
| 4.3 | Template marketplace | User-created / designer-submitted templates |
| 4.4 | Batch generation | Generate multiple videos from CSV + asset folder |

---

## 8. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Video engine** | Remotion 4.x | React → video rendering (scenes, animations, overlays) |
| **Assembly** | FFmpeg (fluent-ffmpeg) | Scene concat, transitions, audio mixing, final encode |
| **Image processing** | Sharp | Resize, crop, format conversion for client uploads |
| **Job queue** | BullMQ + Redis | Pipeline orchestration with dependency graphs |
| **Backend** | Express.js | REST API + WebSocket (Socket.IO) |
| **Frontend** | Next.js + React | Editor UI + `@remotion/player` live preview |
| **Storage** | Cloudflare R2 | Client uploads + generated videos (S3-compatible, zero egress) |
| **Database** | PostgreSQL + Prisma | Video jobs, templates, user data |
| **Validation** | Zod | Input validation for API + template manifests |
| **Monorepo** | Turborepo | Shared video-templates package between frontend preview + backend render |

### Key Dependencies

**Video Generation:**
- `@remotion/renderer` — Server-side rendering of React compositions to MP4
- `@remotion/player` — Browser-side preview of compositions
- `fluent-ffmpeg` — Programmatic FFmpeg for assembly + encoding
- `sharp` — Fast image preprocessing (resize, crop, convert)

**Infrastructure:**
- `bullmq` + `ioredis` — Job queue with flow dependencies (scenes → assembly)
- `@aws-sdk/client-s3` — S3/R2 uploads and downloads
- `socket.io` — Real-time progress updates to frontend
- `prisma` — Type-safe database access

---

## 9. Key Considerations

### Handling Different Client Input Quality

| Problem | Solution |
|---------|----------|
| Image too small (< 1080px) | Auto-upscale with Sharp (basic) or AI upscaling (premium) |
| Image wrong aspect ratio | Smart crop to 9:16 with subject detection |
| Video too long | Auto-trim to scene duration (first N seconds) |
| Video wrong format | Transcode to WebM/MP4 via FFmpeg |
| Not enough assets provided | Skip optional scenes, adjust timing; or AI-generate filler (premium) |
| Too many assets provided | Allow client to reorder/select which to include |

### Scalability

- Each video generation is an independent job — **horizontally scalable** by adding workers
- Remotion rendering is CPU-bound — consider dedicated render workers
- FFmpeg assembly is I/O + CPU — keep temp files on fast local SSD
- Redis handles job orchestration — lightweight, single instance sufficient for 1000s of jobs/day

### Template Extensibility

New templates only require:
1. A `manifest.ts` defining slots
2. React scene components using `<MediaSlot>` and `<TextOverlay>`
3. No backend changes needed — the pipeline is template-agnostic
