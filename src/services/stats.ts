import type { DayStat, ProgressRecord, StoreState, Word } from "../types/word";
import { toDayKey } from "./date";
import { errorCount } from "./studyPlan";

export function countLearnedToday(
  progress: Record<string, ProgressRecord>,
  dayKey: string
): number {
  let count = 0;
  for (const record of Object.values(progress)) {
    if (record.lastReviewedAt && toDayKey(record.lastReviewedAt) === dayKey) {
      count += 1;
    }
  }
  return count;
}

export interface StatusCounts {
  total: number;
  known: number;
  fuzzy: number;
  forgot: number;
  unlearned: number;
  learning: number;
  mistakes: number;
  learned: number;
}

export function summarizeProgress(
  words: Word[],
  progress: Record<string, ProgressRecord>
): StatusCounts {
  const counts: StatusCounts = {
    total: words.length,
    known: 0,
    fuzzy: 0,
    forgot: 0,
    unlearned: 0,
    learning: 0,
    mistakes: 0,
    learned: 0,
  };
  for (const word of words) {
    const record = progress[String(word.id)];
    const status = record?.status ?? "unlearned";
    if (status === "known") counts.known += 1;
    else if (status === "fuzzy") counts.fuzzy += 1;
    else if (status === "forgot") counts.forgot += 1;
    else counts.unlearned += 1;
    if (record?.lastReviewedAt) {
      counts.learned += 1;
      if (errorCount(record) > 0) counts.mistakes += 1;
    }
  }
  counts.learning = words.length - counts.known - counts.unlearned;
  return counts;
}

export interface Coverage {
  limit: number | null;
  learned: number;
  known: number;
  total: number;
  percent: number;
}

export function coverageFor(
  words: Word[],
  progress: Record<string, ProgressRecord>,
  limit: number | null
): Coverage {
  const subset = limit === null ? words : words.slice(0, limit);
  const total = subset.length;
  let learned = 0;
  let known = 0;
  for (const word of subset) {
    const record = progress[String(word.id)];
    if (record?.lastReviewedAt) learned += 1;
    if (record?.status === "known") known += 1;
  }
  return {
    limit,
    learned,
    known,
    total,
    percent: total === 0 ? 0 : Math.round((learned / total) * 1000) / 10,
  };
}

export function streakDays(
  daily: Record<string, DayStat>,
  todayKey: string
): number {
  const base = new Date(`${todayKey}T12:00:00`);
  let cursor = base;
  if (!daily[todayKey]?.wordsLearned) {
    cursor = new Date(base.getTime() - 24 * 60 * 60 * 1000);
  }
  let streak = 0;
  while (true) {
    const key = toDayKey(cursor);
    if (!daily[key]?.wordsLearned) break;
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

export function cumulativeDays(daily: Record<string, DayStat>): number {
  return Object.values(daily).filter((day) => day.wordsLearned > 0).length;
}

export function lastDayKeys(todayKey: string, length: number): string[] {
  const date = new Date(`${todayKey}T12:00:00`);
  const keys: string[] = [];
  for (let index = length - 1; index >= 0; index -= 1) {
    const cursor = new Date(date.getTime() - index * 24 * 60 * 60 * 1000);
    keys.push(toDayKey(cursor));
  }
  return keys;
}

export interface TrendPoint {
  date: string;
  newWords: number;
  reviewEvents: number;
  wordsLearned: number;
  forgot: number;
  fuzzy: number;
  known: number;
  accuracy: number | null;
}

export function trendPoints(
  daily: Record<string, DayStat>,
  todayKey: string,
  length: number
): TrendPoint[] {
  return lastDayKeys(todayKey, length).map((date) => {
    const day = daily[date] ?? {
      newWords: 0,
      reviewEvents: 0,
      wordsLearned: 0,
      forgot: 0,
      fuzzy: 0,
      known: 0,
    };
    const answered = day.known + day.fuzzy + day.forgot;
    return {
      date,
      ...day,
      accuracy: answered === 0 ? null : Math.round((day.known / answered) * 100),
    };
  });
}

export function aggregateStats(state: StoreState): {
  learnedTotal: number;
  reviewTotal: number;
  knownRatings: number;
  answerAccuracy: number | null;
} {
  let learnedTotal = 0;
  let reviewTotal = 0;
  let knownRatings = 0;
  let answered = 0;
  for (const day of Object.values(state.daily)) {
    learnedTotal += day.wordsLearned;
    reviewTotal += day.reviewEvents;
    knownRatings += day.known;
    answered += day.known + day.fuzzy + day.forgot;
  }
  return {
    learnedTotal,
    reviewTotal,
    knownRatings,
    answerAccuracy: answered === 0 ? null : Math.round((knownRatings / answered) * 100),
  };
}
