import type { Accent } from "../types/word";

export type { Accent };

export interface SpeechConfig {
  voiceURI: string | null;
  accent: Accent;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
}

export const DEFAULT_SPEECH_CONFIG: SpeechConfig = {
  voiceURI: null,
  accent: "auto",
  speechRate: 0.82,
  speechPitch: 0.9,
  speechVolume: 1,
};

type VoiceListener = (voices: SpeechSynthesisVoice[]) => void;

const HIGH_QUALITY_VOICES = [
  "samantha",
  "ava",
  "karen",
  "daniel",
  "alex",
  "google us english",
  "google uk english female",
  "google uk english male",
  "microsoft aria",
  "microsoft jenny",
  "microsoft guy",
  "microsoft libby",
  "microsoft sonia",
  "natural",
];

const SECOND_TIER_VOICES = [
  "serena",
  "fiona",
  "moira",
  "victoria",
  "susan",
  "catherine",
  "tessa",
  "aaron",
  "fred",
  "melissa",
  "microsoft zira",
  "microsoft david",
  "microsoft mark",
  "allison",
  "ana",
  "christopher",
  "eric",
];

const LOW_QUALITY_VOICES = [
  "compact",
  "robot",
  "echo",
  "test voice",
  "demo voice",
  "female voice 1",
  "male voice 1",
];

const listeners = new Set<VoiceListener>();
const pendingWaits = new Set<(voices: SpeechSynthesisVoice[]) => void>();
let loadActive = false;
let loadTimer: number | null = null;
let voiceListenerAttached = false;

function hasAnyKeyword(name: string, keywords: string[]): boolean {
  const normalized = name.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function scoreVoice(
  voice: SpeechSynthesisVoice,
  accent: Accent = "auto"
): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;

  if (!lang.startsWith("en")) return -1000;
  score += 20;

  if (accent === "auto") {
    if (lang === "en-us" || lang.startsWith("en-us")) score += 12;
    if (lang === "en-gb" || lang.startsWith("en-gb")) score += 10;
    if (lang.startsWith("en-au") || lang.startsWith("en-ca")) score += 6;
  } else if (accent === "us") {
    score += lang.startsWith("en-us") ? 50 : -200;
  } else {
    score += lang.startsWith("en-gb") ? 50 : -200;
  }

  if (hasAnyKeyword(name, HIGH_QUALITY_VOICES)) score += 36;
  if (hasAnyKeyword(name, SECOND_TIER_VOICES)) score += 28;
  if (hasAnyKeyword(name, ["natural", "enhanced"])) score += 10;
  if (voice.localService) score += 6;
  if (hasAnyKeyword(name, LOW_QUALITY_VOICES)) score -= 30;

  return score;
}

function allVoices(): SpeechSynthesisVoice[] {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  return allVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"))
    .sort((left, right) => scoreVoice(right) - scoreVoice(left));
}

export function getRecommendedVoice(
  config: Partial<SpeechConfig> = {}
): SpeechSynthesisVoice | undefined {
  const accent = config.accent ?? "auto";
  const english = allVoices().filter((voice) =>
    voice.lang.toLowerCase().startsWith("en")
  );
  const accentVoices = english.filter((voice) => {
    const lang = voice.lang.toLowerCase();
    if (accent === "us") return lang.startsWith("en-us");
    if (accent === "uk") return lang.startsWith("en-gb");
    return true;
  });
  const ranked = (accentVoices.length > 0 ? accentVoices : english).sort(
    (left, right) =>
      scoreVoice(right, accentVoices.length > 0 ? accent : "auto") -
      scoreVoice(left, accentVoices.length > 0 ? accent : "auto")
  );
  return ranked[0];
}

function publishVoices(): void {
  const voices = getEnglishVoices();
  listeners.forEach((listener) => listener(voices));
  pendingWaits.forEach((resolve) => resolve(voices));
  pendingWaits.clear();
}

function finishVoiceLoad(): void {
  loadActive = false;
  if (loadTimer !== null) {
    window.clearTimeout(loadTimer);
    loadTimer = null;
  }
  publishVoices();
}

function handleVoicesChanged(): void {
  if (allVoices().length > 0) {
    finishVoiceLoad();
  } else if (!loadActive) {
    startVoiceLoad();
  }
}

export function startVoiceLoad(): void {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  if (!voiceListenerAttached) {
    synth.addEventListener("voiceschanged", handleVoicesChanged);
    voiceListenerAttached = true;
  }
  if (loadActive) return;
  if (allVoices().length > 0) {
    publishVoices();
    return;
  }
  loadActive = true;
  loadTimer = window.setTimeout(finishVoiceLoad, 5000);
}

export function subscribeToVoices(listener: VoiceListener): () => void {
  listeners.add(listener);
  listener(getEnglishVoices());
  startVoiceLoad();
  return () => listeners.delete(listener);
}

export async function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  const voices = allVoices();
  if (voices.length > 0) return voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  if (!loadActive) startVoiceLoad();
  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    pendingWaits.add(resolve);
  });
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  config: SpeechConfig
): SpeechSynthesisVoice | undefined {
  const accent = config.accent ?? "auto";
  const compatible = (voice: SpeechSynthesisVoice) => {
    const lang = voice.lang.toLowerCase();
    if (accent === "us") return lang.startsWith("en-us");
    if (accent === "uk") return lang.startsWith("en-gb");
    return true;
  };

  if (config.voiceURI) {
    const manual = voices.find((voice) => voice.voiceURI === config.voiceURI);
    if (manual) return manual;
  }
  const candidates = voices.filter(compatible);
  const pool = candidates.length > 0 ? candidates : voices;
  return pool.sort(
    (left, right) => scoreVoice(right, accent) - scoreVoice(left, accent)
  )[0];
}

let requestSequence = 0;

export function stopSpeech(): void {
  requestSequence += 1;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export async function speakWord(
  text: string,
  config: SpeechConfig = DEFAULT_SPEECH_CONFIG
): Promise<boolean> {
  if (!("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  const requestId = ++requestSequence;

  synth.cancel();
  if (synth.paused) synth.resume();

  const voices = await waitForVoices();
  if (requestId !== requestSequence) return false;

  const voice = pickVoice(voices, config);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? "en-US";
  utterance.rate = config.speechRate;
  utterance.pitch = config.speechPitch;
  utterance.volume = config.speechVolume;
  if (voice) utterance.voice = voice;

  utterance.onend = () => {
    utterance.onend = null;
    utterance.onerror = null;
  };
  utterance.onerror = () => {
    utterance.onend = null;
    utterance.onerror = null;
  };

  try {
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
