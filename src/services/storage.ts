import type {
  DayStat,
  ProgressRecord,
  Settings,
  StoreState,
} from "../types/word";

export const STORAGE_KEY = "exam-vocab-store-v1";
const EXPORT_KEY = "exam-vocab-backup-v1";

export function emptyProgress(): ProgressRecord {
  return {
    status: "unlearned",
    firstLearnedAt: null,
    lastReviewedAt: null,
    reviewCount: 0,
    knownCount: 0,
    forgotCount: 0,
    misspellCount: 0,
    fuzzyCount: 0,
    correctStreak: 0,
    stage: 0,
    lastIntervalHours: 0,
    nextReviewAt: null,
  };
}

export function emptyDay(): DayStat {
  return {
    newWords: 0,
    reviewEvents: 0,
    wordsLearned: 0,
    forgot: 0,
    fuzzy: 0,
    known: 0,
  };
}

export function defaultSettings(): Settings {
  return {
    dailyGoal: 50,
    mode: "flash",
    voiceURI: null,
    speechRate: 0.6,
    speechPitch: 0.8,
  };
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeProgress(value: unknown): ProgressRecord {
  const base = emptyProgress();
  if (!value || typeof value !== "object") return base;
  const raw = value as Record<string, unknown>;
  const status =
    raw.status === "known" ||
    raw.status === "fuzzy" ||
    raw.status === "forgot" ||
    raw.status === "unlearned"
      ? raw.status
      : base.status;
  return {
    status,
    firstLearnedAt: typeof raw.firstLearnedAt === "string" ? raw.firstLearnedAt : null,
    lastReviewedAt: typeof raw.lastReviewedAt === "string" ? raw.lastReviewedAt : null,
    nextReviewAt: typeof raw.nextReviewAt === "string" ? raw.nextReviewAt : null,
    reviewCount: Math.max(0, asNumber(raw.reviewCount, 0)),
    knownCount: Math.max(0, asNumber(raw.knownCount, 0)),
    forgotCount: Math.max(0, asNumber(raw.forgotCount, 0)),
    misspellCount: Math.max(0, asNumber(raw.misspellCount, 0)),
    fuzzyCount: Math.max(0, asNumber(raw.fuzzyCount, 0)),
    correctStreak: Math.max(0, asNumber(raw.correctStreak, 0)),
    stage: Math.max(0, asNumber(raw.stage, 0)),
    lastIntervalHours: Math.max(0, asNumber(raw.lastIntervalHours, 0)),
  };
}

function sanitizeDaily(value: unknown): Record<string, DayStat> {
  const result: Record<string, DayStat> = {};
  if (!value || typeof value !== "object") return result;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const day = emptyDay();
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    day.newWords = Math.max(0, asNumber(raw.newWords, 0));
    day.reviewEvents = Math.max(0, asNumber(raw.reviewEvents, 0));
    day.wordsLearned = Math.max(0, asNumber(raw.wordsLearned, 0));
    day.forgot = Math.max(0, asNumber(raw.forgot, 0));
    day.fuzzy = Math.max(0, asNumber(raw.fuzzy, 0));
    day.known = Math.max(0, asNumber(raw.known, 0));
    result[key] = day;
  }
  return result;
}

function sanitizeSettings(value: unknown): Settings {
  const fallback = defaultSettings();
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Record<string, unknown>;
  const goal = Math.min(500, Math.max(1, asNumber(raw.dailyGoal, 50)));
  return {
    dailyGoal: goal,
    mode: raw.mode === "spelling" ? "spelling" : "flash",
    voiceURI: typeof raw.voiceURI === "string" ? raw.voiceURI : null,
    speechRate: Math.min(1.2, Math.max(0.5, asNumber(raw.speechRate, 0.6))),
    speechPitch: Math.min(1.2, Math.max(0.6, asNumber(raw.speechPitch, 0.8))),
  };
}

export function emptyStore(): StoreState {
  return {
    schemaVersion: 1,
    progress: {},
    daily: {},
    settings: defaultSettings(),
  };
}

export function readStore(): StoreState {
  const fallback = emptyStore();
  if (!("localStorage" in window)) return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as StoreState;
    return {
      schemaVersion: 1,
      progress:
        parsed.progress && typeof parsed.progress === "object"
          ? Object.fromEntries(
              Object.entries(parsed.progress).map(([key, value]) => [
                key,
                sanitizeProgress(value),
              ])
            )
          : {},
      daily: sanitizeDaily(parsed.daily),
      settings: sanitizeSettings(parsed.settings),
    };
  } catch (error) {
    console.warn("本地学习数据无法读取，已使用空数据。", error);
    return fallback;
  }
}

export function writeStore(state: StoreState): void {
  if (!("localStorage" in window)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("本地学习数据保存失败。", error);
  }
}

export function clearStore(): void {
  if ("localStorage" in window) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function serializeExport(state: StoreState, exportedAt: string): string {
  const payload = {
    app: "exam-vocab-app",
    key: EXPORT_KEY,
    exportedAt,
    data: state,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseImport(text: string): StoreState {
  const parsed = JSON.parse(text) as {
    data?: StoreState;
    progress?: StoreState["progress"];
    daily?: StoreState["daily"];
    settings?: StoreState["settings"];
  };
  if (parsed && parsed.data && typeof parsed.data === "object") {
    const nested = parsed.data;
    return {
      schemaVersion: 1,
      progress:
        nested.progress && typeof nested.progress === "object"
          ? Object.fromEntries(
              Object.entries(nested.progress).map(([key, value]) => [
                key,
                sanitizeProgress(value),
              ])
            )
          : {},
      daily: sanitizeDaily(nested.daily),
      settings: sanitizeSettings(nested.settings),
    };
  }
  return {
    schemaVersion: 1,
    progress:
      parsed.progress && typeof parsed.progress === "object"
        ? Object.fromEntries(
            Object.entries(parsed.progress).map(([key, value]) => [
              key,
              sanitizeProgress(value),
            ])
          )
        : {},
    daily: sanitizeDaily(parsed.daily),
    settings: sanitizeSettings(parsed.settings),
  };
}
