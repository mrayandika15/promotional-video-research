export interface VideoSlot {
  id: string;
  label: string;
  file: File | null;
  url: string | null;
}

export interface PromotionalVideoProps {
  videos: {
    destination1: string | null;
    destination2: string | null;
    destination3: string | null;
    destination4: string | null;
  };
}
