"use client";

import { useState, useCallback } from "react";
import VideoUploadForm from "./components/VideoUploadForm";
import VideoPreview from "./components/VideoPreview";
import MusicUpload from "./components/MusicUpload";
import SceneTextForm from "./components/SceneTextForm";
import type { VideoSlot, AudioSlot, SceneText } from "./remotion/types";

const initialSlots: VideoSlot[] = [
  { id: "destination1", label: "Destination 1", file: null, url: null },
  { id: "destination2", label: "Destination 2", file: null, url: null },
  { id: "destination3", label: "Destination 3", file: null, url: null },
  { id: "destination4", label: "Destination 4", file: null, url: null },
];

const initialAudio: AudioSlot = { file: null, url: null, name: null };

const defaultSceneTexts: SceneText[] = [
  {
    title: "국적기 왕복 직항 탑승",
    card1Title: "진에어/티웨이/에어서울\n/에어부산/제주항공",
    card1Subtitle: "(출발일별 일정, 가격, 항공 상이/해피콜 시 문의)",
    card2Title: "청주/부산/대구 출발가능",
    card2Subtitle: "(출발일별 일정, 가격, 항공 상이/해피콜 시 문의)",
    footnote: "이해를 돕기 위해 연출된 이미지 영상입니다",
  },
  {
    title: "특급 호텔 숙박",
    card1Title: "5성급 리조트 & 호텔",
    card1Subtitle: "최고급 시설과 서비스를 제공합니다",
    card2Title: "조식 포함 / 수영장 이용",
    card2Subtitle: "",
    footnote: "",
  },
  {
    title: "현지 맛집 투어 포함",
    card1Title: "현지 전통 음식 체험",
    card1Subtitle: "현지인이 추천하는 맛집 투어",
    card2Title: "매 식사 포함 / 특식 제공",
    card2Subtitle: "",
    footnote: "",
  },
  {
    title: "최저가 보장 특가",
    card1Title: "₩790,000~",
    card1Subtitle: "3박 5일 올인클루시브",
    card2Title: "지금 바로 문의하세요!",
    card2Subtitle: "DM 또는 전화 문의 환영",
    footnote: "가격은 출발일에 따라 변동될 수 있습니다",
  },
];

export default function Home() {
  const [slots, setSlots] = useState<VideoSlot[]>(initialSlots);
  const [audio, setAudio] = useState<AudioSlot>(initialAudio);
  const [sceneTexts, setSceneTexts] = useState<SceneText[]>(defaultSceneTexts);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const videos = {
    destination1: slots[0].url,
    destination2: slots[1].url,
    destination3: slots[2].url,
    destination4: slots[3].url,
  };

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setGenerated(false);

    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
    }, 3000);
  }, []);

  const filledCount = slots.filter((s) => s.file !== null).length;
  const hasMusic = audio.file !== null;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">
              Promotional Video Generator
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="rounded-full bg-white/5 px-3 py-1">
              Remotion + Next.js
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Status bar */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                filledCount === 4
                  ? "bg-green-500"
                  : filledCount > 0
                  ? "bg-yellow-500"
                  : "bg-zinc-600"
              }`}
            />
            <span className="text-sm text-zinc-400">
              {filledCount}/4 videos uploaded
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                hasMusic ? "bg-emerald-500" : "bg-zinc-600"
              }`}
            />
            <span className="text-sm text-zinc-400">
              {hasMusic ? "Music added" : "No music"}
            </span>
          </div>
          {generated && (
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400">
              Generated
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Left — Inputs */}
          <div className="flex flex-col gap-8">
            <VideoUploadForm
              slots={slots}
              onSlotsChange={setSlots}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
            <MusicUpload audio={audio} onAudioChange={setAudio} />
            <SceneTextForm
              sceneTexts={sceneTexts}
              onSceneTextsChange={setSceneTexts}
            />
          </div>

          {/* Right — Preview */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <VideoPreview
              videos={videos}
              musicUrl={audio.url}
              sceneTexts={sceneTexts}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
