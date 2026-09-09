export type Rating = "forgot" | "fuzzy" | "known";
export type WordStatus = "unlearned" | Rating;
export type Accent = "auto" | "us" | "uk";

export interface Word {
  id: number;
  rank: number;
  word: string;
  phonetic: string | null;
  dictionaryMeaning: string | null;
  frequency: number;
  example: string | null;
  examMeaning: string | null;
}

export interface WordFile {
  meta: {
    source: string;
    sheet: string;
    count: number;
    sortedBy: string;
  };
  words: Word[];
}

export interface ProgressRecord {
  status: WordStatus;
  firstLearnedAt: string | null;
  lastReviewedAt: string | null;
  reviewCount: number;
  knownCount: number;
  forgotCount: number;
  misspellCount: number;
  fuzzyCount: number;
  correctStreak: number;
  stage: number;
  lastIntervalHours: number;
  nextReviewAt: string | null;
}

export interface DayStat {
  newWords: number;
  reviewEvents: number;
  wordsLearned: number;
  forgot: number;
  fuzzy: number;
  known: number;
}

export interface Settings {
  dailyGoal: number;
  mode: "flash" | "spelling";
  voiceURI: string | null;
  accent: Accent;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
}

export interface StoreState {
  schemaVersion: number;
  progress: Record<string, ProgressRecord>;
  daily: Record<string, DayStat>;
  settings: Settings;
}

export type SessionKind = "today" | "review" | "mistakes" | "new";
export type TrainingMode = "flash" | "spelling";

export interface StudyItem {
  wordId: number;
  reason: "due" | "mistake" | "fuzzy" | "fresh";
}

export interface StudyPlan {
  items: StudyItem[];
  groupCounts: {
    due: number;
    mistake: number;
    fuzzy: number;
    fresh: number;
  };
}
