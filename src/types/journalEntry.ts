export interface Entry {
  id: string;
  title: string;
  text: string;
  date: string;
  tags: string[];
  transcribed?: boolean;

  photoUri?: string;              // Local photo path
  hasPhoto?: boolean;             // Quick check if entry has photo
  
  // AI Analysis fields
  mood?: {
    primary: string;
    secondary?: string;
    intensity: number;
    confidence: number;
  };
  emotions?: string[];
  themes?: string[];
  insights?: {
    keyTopics: string[];
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    energy: 'high' | 'medium' | 'low';
    clarity: number;
  };
  aiAnalyzed?: boolean;
}

export interface TranscriptionResult {
  text: string;
  tags: string[];
  mood?: string;
}