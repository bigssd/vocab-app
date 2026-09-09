let voicesLoaded: Promise<SpeechSynthesisVoice[]> | null = null;

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!("speechSynthesis" in window)) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);

  if (voicesLoaded) return voicesLoaded;
  voicesLoaded = new Promise((resolve) => {
    const finish = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) {
        cleanup();
        resolve(voices);
      }
    };
    const cleanup = () => {
      synth.removeEventListener("voiceschanged", finish);
      window.clearTimeout(timer);
    };
    const timer = window.setTimeout(() => {
      cleanup();
      resolve(synth.getVoices());
    }, 3000);
    synth.addEventListener("voiceschanged", finish);
    finish();
  });
  return voicesLoaded;
}

function pickEnglishVoice(
  voices: SpeechSynthesisVoice[],
  preferredVoiceURI: string | null
): SpeechSynthesisVoice | undefined {
  if (preferredVoiceURI) {
    const preferred = voices.find(
      (voice) => voice.voiceURI === preferredVoiceURI
    );
    if (preferred) return preferred;
  }
  const english = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en")
  );
  return (
    english.find((voice) => voice.lang.toLowerCase() === "en-us") ||
    english.find((voice) => voice.lang.toLowerCase().startsWith("en-us")) ||
    english[0]
  );
}

export async function speakWord(
  text: string,
  preferredVoiceURI: string | null
): Promise<boolean> {
  if (!("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  const voices = await waitForVoices();
  const voice = pickEnglishVoice(voices, preferredVoiceURI);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? "en-US";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  if (voice) utterance.voice = voice;
  synth.cancel();
  if (synth.paused) synth.resume();
  synth.speak(utterance);
  return true;
}
