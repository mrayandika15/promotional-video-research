export interface VideoSlot {
  id: string;
  label: string;
  file: File | null;
  url: string | null;
}

export interface AudioSlot {
  file: File | null;
  url: string | null;
  name: string | null;
}

export interface SceneText {
  title: string;
  card1Title: string;
  card1Subtitle: string;
  card2Title: string;
  card2Subtitle: string;
  footnote: string;
}

export interface PromotionalVideoProps {
  videos: {
    destination1: string | null;
    destination2: string | null;
    destination3: string | null;
    destination4: string | null;
  };
  musicUrl: string | null;
  sceneTexts: SceneText[];
}
