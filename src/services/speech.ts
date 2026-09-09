export function speakWord(
  text: string,
  preferredVoiceURI: string | null
): boolean {
  if (!("speechSynthesis" in window)) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((item) => item.voiceURI === preferredVoiceURI) ||
    voices.find((item) => item.lang.toLowerCase().startsWith("en")) ||
    voices.find((item) => item.name.toLowerCase().includes("samantha"));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}
