export interface Entry {
  id: string;
  title?: string;
  text: string;
  date: string; // ISO string
  tags: string[];
  transcribed?: boolean;
  
  // Manual mood rating (1-5 scale)
  manualMood?: number;
  
  // Photo support
  photoUri?: string;
  hasPhoto?: boolean;
  
  // AI Analysis results
  aiAnalyzed?: boolean;
  mood?: {
    primary: string;
    confidence: number;
  };
  emotions?: string[];
  themes?: string[];
  insights?: {
    clarity: number;
    growthPotential: number;
    stressLevel: number;
  };
}