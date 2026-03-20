"use client";

import type { SceneText } from "../remotion/types";

interface SceneTextFormProps {
  sceneTexts: SceneText[];
  onSceneTextsChange: (texts: SceneText[]) => void;
}

const SCENE_LABELS = [
  { name: "장면 1 — 항공", color: "#4A90D9" },
  { name: "장면 2 — 숙박", color: "#D4A853" },
  { name: "장면 3 — 맛집", color: "#E06B5E" },
  { name: "장면 4 — 특가", color: "#5BAE6B" },
];

export default function SceneTextForm({
  sceneTexts,
  onSceneTextsChange,
}: SceneTextFormProps) {
  const updateScene = (index: number, field: keyof SceneText, value: string) => {
    const updated = [...sceneTexts];
    updated[index] = { ...updated[index], [field]: value };
    onSceneTextsChange(updated);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-orange-500" />
        <h2 className="text-xl font-semibold text-white">장면 텍스트</h2>
        <span className="text-sm text-zinc-500">Scene Text</span>
      </div>

      <div className="flex flex-col gap-4">
        {sceneTexts.map((scene, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
          >
            <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: SCENE_LABELS[i].color }}
              />
              <span className="text-sm font-semibold text-white">
                {SCENE_LABELS[i].name}
              </span>
              <span className="ml-auto text-xs text-zinc-500 truncate max-w-[160px]">
                {scene.title || "—"}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-zinc-500 shrink-0 transition-transform group-open:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>

            <div className="flex flex-col gap-3 px-5 pb-5 pt-2">
              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  제목 (Title)
                </label>
                <input
                  type="text"
                  value={scene.title}
                  onChange={(e) => updateScene(i, "title", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.08]"
                />
              </div>

              {/* Card 1 */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    카드 1 제목
                  </label>
                  <input
                    type="text"
                    value={scene.card1Title}
                    onChange={(e) => updateScene(i, "card1Title", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.08]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    카드 1 부제
                  </label>
                  <input
                    type="text"
                    value={scene.card1Subtitle}
                    onChange={(e) => updateScene(i, "card1Subtitle", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.08]"
                  />
                </div>
              </div>

              {/* Card 2 */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    카드 2 제목
                  </label>
                  <input
                    type="text"
                    value={scene.card2Title}
                    onChange={(e) => updateScene(i, "card2Title", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.08]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    카드 2 부제
                  </label>
                  <input
                    type="text"
                    value={scene.card2Subtitle}
                    onChange={(e) => updateScene(i, "card2Subtitle", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.08]"
                  />
                </div>
              </div>

              {/* Footnote */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  하단 메모 (Footnote)
                </label>
                <input
                  type="text"
                  value={scene.footnote}
                  onChange={(e) => updateScene(i, "footnote", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.08]"
                />
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
