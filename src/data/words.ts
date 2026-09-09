import type { Word, WordFile } from "../types/word";
import wordFile from "./words.json";

const file = wordFile as unknown as WordFile;
export const WORDS: Word[] = file.words;
export const WORDS_COUNT = file.meta.count;
