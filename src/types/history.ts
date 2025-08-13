export interface JournalEntry {
  id: string;
  time: Date;
  title: string;
  content: string;
  mood: string;
  moodScore: number;
  type: 'voice' | 'text' | 'photo';
  attachments?: string[];
  aiAnalysis?: {
    emotions: string[];
    themes: string[];
    sentiment: string;
    sentimentScore: number;
    insights: string[];
  };
  autoTags?: string[];
}

export interface DayEntry {
  id: string;
  date: Date;
  entries: JournalEntry[];
  moodAverage: number;
  highlights: string;
  stats: {
    audioMinutes: number;
    photos: number;
    words: number;
  };
  aiInsights?: string[];
}

export interface WeekData {
  id: string;
  startDate: Date;
  endDate: Date;
  entries: any[];
  entryCount: number;
  moodData: number[];
  avgMood: number;
  totalWords: number;
  highlights: string[];
  lowlights: string[];
  topTags: string[];
  aiSummary?: string;
  isGeneratingSummary?: boolean;
}

export interface MonthData {
  month: string;
  year: number;
  entries: any[];
  totalEntries: number;
  totalDays: number;
  avgMood: number;
  totalWords: number;
  moodTrend: string;
  highlights: string[];
  lowlights: string[];
  topTags: string[];
  topEmotions: string[];
  aiSummary?: string;
  insights: string[];
  isGeneratingSummary?: boolean;
}

export interface CachedSummary {
  id: string;
  summary: string;
  timestamp: number;
  entriesHash: string;
}

export interface UnifiedHistoryScreenProps {
  entries: any[];
  showDummyData: boolean;
  onToggleDummyData: () => void;
}