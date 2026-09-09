import type { Word } from "../types/word";

const POS_PREFIX = /^(?:[a-z]+\.|abbr\.|v-?\.|vt?\.|vi\.|aux\.|det\.|conj\.|prep\.|pron\.|adv\.|adj\.|n\.|art\.)\s*/i;

export function lines(value: string | null): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function firstMeaning(word: Word): string {
  const examLine = word.examMeaning ? lines(word.examMeaning)[0] : "";
  if (examLine) return examLine.replace(POS_PREFIX, "").trim();
  const dictionaryLine = word.dictionaryMeaning
    ? lines(word.dictionaryMeaning)[0]
    : "";
  return dictionaryLine.replace(POS_PREFIX, "").trim();
}

export function studyMeaning(word: Word): string {
  const dictionary = word.dictionaryMeaning
    ? lines(word.dictionaryMeaning).join("\n")
    : "";
  if (!word.examMeaning) return dictionary;
  const extra = lines(word.examMeaning).join("\n");
  return extra === dictionary ? dictionary : `${dictionary}\n\n考试大纲释义\n${extra}`;
}

export function wordById(words: Word[], id: number): Word | undefined {
  return words.find((word) => word.id === id);
}

export function getWordStatusLabel(status: string): string {
  if (status === "known") return "认识";
  if (status === "fuzzy") return "模糊";
  if (status === "forgot") return "忘记";
  return "未学习";
}

export function getWordStatusTone(status: string): string {
  if (status === "known") return "success";
  if (status === "fuzzy") return "warning";
  if (status === "forgot") return "danger";
  return "muted";
}
