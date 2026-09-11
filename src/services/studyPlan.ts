import type {
  ProgressRecord,
  SessionKind,
  StudyItem,
  StudyPlan,
  Word,
} from "../types/word";
import { dueNow, isMistake } from "./srs";

function recordOf(progress: Record<string, ProgressRecord>, id: number) {
  return progress[String(id)];
}

export function buildStudyPlan(
  words: Word[],
  progress: Record<string, ProgressRecord>,
  goal: number,
  nowIso: string,
  kind: SessionKind = "today"
): StudyPlan {
  const items: StudyItem[] = [];
  const added = new Set<number>();
  const counts = { due: 0, mistake: 0, fuzzy: 0, fresh: 0 };

  const add = (word: Word, reason: StudyItem["reason"]) => {
    if (items.length >= goal || added.has(word.id)) return;
    added.add(word.id);
    items.push({ wordId: word.id, reason });
    counts[reason]++;
  };

  const all = [...words].sort((a, b) => a.rank - b.rank);
  const due = all.filter(
    (word) =>
      (kind === "today" || kind === "review") &&
      dueNow(recordOf(progress, word.id), nowIso)
  );
  const mistakeWords = all.filter(
    (word) =>
      (kind === "today" || kind === "mistakes") &&
      isMistake(recordOf(progress, word.id)) &&
      !dueNow(recordOf(progress, word.id), nowIso)
  );
  const fuzzyWords = all.filter(
    (word) =>
      kind === "today" &&
      recordOf(progress, word.id)?.status === "fuzzy" &&
      !dueNow(recordOf(progress, word.id), nowIso)
  );
  const freshWords = all.filter(
    (word) =>
      (kind === "today" || kind === "new") &&
      !recordOf(progress, word.id)?.lastReviewedAt
  );

  if (kind === "mistakes") {
    mistakeWords.sort((a, b) => {
      const left = recordOf(progress, a.id);
      const right = recordOf(progress, b.id);
      return (
        errorCount(right) - errorCount(left) ||
        (right?.nextReviewAt ?? "").localeCompare(left?.nextReviewAt ?? "") ||
        a.rank - b.rank
      );
    });
  } else {
    due.sort((a, b) => {
      const left = recordOf(progress, a.id)?.nextReviewAt ?? "";
      const right = recordOf(progress, b.id)?.nextReviewAt ?? "";
      return left.localeCompare(right) || a.rank - b.rank;
    });
    mistakeWords.sort(
      (a, b) =>
        errorCount(recordOf(progress, b.id)) -
          errorCount(recordOf(progress, a.id)) ||
        a.rank - b.rank
    );
  }

  if (kind === "mistakes") {
    mistakeWords.forEach((word) => add(word, "mistake"));
  } else {
    due.forEach((word) => add(word, "due"));
  }

  if (kind === "new") {
    freshWords.forEach((word) => add(word, "fresh"));
  } else if (kind === "today") {
    // New words take the remaining daily quota before non-due weak words.
    freshWords.forEach((word) => add(word, "fresh"));
    fuzzyWords.forEach((word) => add(word, "fuzzy"));
    mistakeWords.forEach((word) => add(word, "mistake"));
  }

  return { items, groupCounts: counts };
}

export function errorCount(record: ProgressRecord | undefined): number {
  return (record?.forgotCount ?? 0) + (record?.misspellCount ?? 0);
}
