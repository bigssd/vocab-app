import type { ProgressRecord, Rating } from "../types/word";
import { emptyProgress } from "./storage";

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export const INTERVALS_DAYS = [1, 3, 7, 14, 30, 60, 90];
export const MAX_STAGE = INTERVALS_DAYS.length;

/**
 * Applies one rating and returns the next progress snapshot.
 *
 * known   -> advance to the next SRS stage (1/3/7/14/30/60/90 days)
 * fuzzy   -> demote one stage and shorten the next interval
 * forgot  -> reset the stage; 10 minutes now, 1 day if it lapses again quickly
 */
export function applyRating(
  current: ProgressRecord,
  rating: Rating,
  nowIso: string,
  countRatingEvent = true
): ProgressRecord {
  const now = new Date(nowIso).getTime();
  const base = current.status === "unlearned" ? emptyProgress() : current;
  const lastReviewAt = base.lastReviewedAt
    ? new Date(base.lastReviewedAt).getTime()
    : null;

  let stage = base.stage;
  let nextReviewAt: string;
  let status: ProgressRecord["status"] = base.status;
  let correctStreak = base.correctStreak;
  let lastIntervalHours = base.lastIntervalHours;

  if (rating === "known") {
    stage = Math.min(MAX_STAGE, stage + 1);
    const intervalDays = INTERVALS_DAYS[Math.max(0, stage - 1)];
    lastIntervalHours = intervalDays * 24;
    nextReviewAt = new Date(now + intervalDays * 24 * HOUR_MS).toISOString();
    correctStreak += 1;
    status = "known";
  } else if (rating === "fuzzy") {
    stage = Math.max(0, stage - 1);
    const currentHours = lastIntervalHours > 0 ? lastIntervalHours : 24;
    lastIntervalHours = Math.max(0.5, currentHours / 2);
    nextReviewAt = new Date(now + lastIntervalHours * HOUR_MS).toISOString();
    correctStreak = 0;
    status = "fuzzy";
  } else {
    stage = 0;
    correctStreak = 0;
    status = "forgot";
    const lapsedSoon =
      base.status === "forgot" &&
      lastReviewAt !== null &&
      now - lastReviewAt < 60 * MINUTE_MS;
    lastIntervalHours = lapsedSoon ? 24 : 10 / 60;
    nextReviewAt = new Date(now + lastIntervalHours * HOUR_MS).toISOString();
  }

  return {
    ...base,
    status,
    lastReviewedAt: nowIso,
    nextReviewAt,
    reviewCount: base.reviewCount + 1,
    knownCount: base.knownCount + (rating === "known" ? 1 : 0),
    forgotCount: base.forgotCount + (rating === "forgot" && countRatingEvent ? 1 : 0),
    fuzzyCount: base.fuzzyCount + (rating === "fuzzy" ? 1 : 0),
    correctStreak,
    stage,
    lastIntervalHours,
  };
}

export function dueNow(record: ProgressRecord | undefined, nowIso: string): boolean {
  if (!record?.nextReviewAt || !record.lastReviewedAt) return false;
  return new Date(record.nextReviewAt).getTime() <= new Date(nowIso).getTime();
}

export function isMistake(record: ProgressRecord | undefined): boolean {
  if (!record) return false;
  return record.forgotCount + record.misspellCount > 0 || record.status === "forgot";
}

export function isFuzzy(record: ProgressRecord | undefined): boolean {
  return record?.status === "fuzzy";
}
