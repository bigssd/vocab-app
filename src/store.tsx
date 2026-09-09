import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  DayStat,
  ProgressRecord,
  Rating,
  Settings,
  StoreState,
} from "./types/word";
import { toDayKey } from "./services/date";
import { applyRating } from "./services/srs";
import {
  countLearnedToday,
} from "./services/stats";
import {
  emptyDay,
  emptyStore,
  readStore,
  writeStore,
} from "./services/storage";

interface StoreApi {
  state: StoreState;
  rateWord: (wordId: number, rating: Rating) => void;
  gradeSpelling: (wordId: number, correct: boolean) => void;
  patchSettings: (settings: Partial<Settings>) => void;
  replaceData: (next: StoreState) => void;
  clearLearningData: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

function addDay(
  day: DayStat | undefined,
  nowIso: string,
  isNew: boolean,
  wasRatedToday: boolean,
  rating: Rating
): DayStat {
  const current: DayStat = day ?? emptyDay();
  const next = { ...current };
  next.newWords += isNew ? 1 : 0;
  next.reviewEvents += isNew ? 0 : 1;
  if (!wasRatedToday) next.wordsLearned += 1;
  if (rating === "known") next.known += 1;
  if (rating === "fuzzy") next.fuzzy += 1;
  if (rating === "forgot") next.forgot += 1;
  return next;
}

function applyRatingToStore(
  state: StoreState,
  wordId: number,
  rating: Rating,
  spellingMiss: boolean
): StoreState {
  const nowIso = new Date().toISOString();
  const dayKey = toDayKey(nowIso);
  const key = String(wordId);
  const previous = state.progress[key];
  const progress = applyRating(
    previous ?? {
      status: "unlearned",
      firstLearnedAt: null,
      lastReviewedAt: null,
      nextReviewAt: null,
      reviewCount: 0,
      knownCount: 0,
      forgotCount: 0,
      misspellCount: 0,
      fuzzyCount: 0,
      correctStreak: 0,
      stage: 0,
      lastIntervalHours: 0,
    },
    rating,
    nowIso,
    !spellingMiss
  );
  if (spellingMiss) {
    progress.misspellCount += 1;
  }

  const nextProgress: Record<string, ProgressRecord> = {
    ...state.progress,
    [key]: {
      ...progress,
      firstLearnedAt: previous?.firstLearnedAt ?? nowIso,
    },
  };

  const isNew = !previous?.firstLearnedAt;
  const wasRatedToday =
    !!previous?.lastReviewedAt && toDayKey(previous.lastReviewedAt) === dayKey;
  const nextDay = addDay(state.daily[dayKey], nowIso, isNew, wasRatedToday, rating);
  nextDay.wordsLearned = Math.max(
    nextDay.wordsLearned,
    countLearnedToday(nextProgress, dayKey)
  );

  return {
    ...state,
    progress: nextProgress,
    daily: { ...state.daily, [dayKey]: nextDay },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => readStore());

  useEffect(() => {
    writeStore(state);
  }, [state]);

  const rateWord = useCallback((wordId: number, rating: Rating) => {
    setState((current) =>
      applyRatingToStore(current, wordId, rating, false)
    );
  }, []);

  const gradeSpelling = useCallback((wordId: number, correct: boolean) => {
    setState((current) =>
      applyRatingToStore(current, wordId, correct ? "known" : "forgot", !correct)
    );
  }, []);

  const patchSettings = useCallback((settings: Partial<Settings>) => {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, ...settings },
    }));
  }, []);

  const replaceData = useCallback((next: StoreState) => {
    setState({
      schemaVersion: 1,
      progress: next.progress ?? {},
      daily: next.daily ?? {},
      settings: next.settings ?? emptyStore().settings,
    });
  }, []);

  const clearLearningData = useCallback(() => {
    setState((current) => ({
      ...emptyStore(),
      settings: current.settings,
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      rateWord,
      gradeSpelling,
      patchSettings,
      replaceData,
      clearLearningData,
    }),
    [state, rateWord, gradeSpelling, patchSettings, replaceData, clearLearningData]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return context;
}
