export type Entry = {
  id: string;
  createdAt: string; // ISO
  text: string;
  tags: string[];
  mood?: string;
  hasAudio?: boolean;
  audioUri?: string;
};
