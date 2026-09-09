const TRANSLATION_STORAGE_KEY = "exam-vocab-example-translations-v1";
const memoryCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();

function loadTranslations(): Record<string, string> {
  if (!("localStorage" in window)) return {};
  try {
    return JSON.parse(
      window.localStorage.getItem(TRANSLATION_STORAGE_KEY) ?? "{}"
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

function persistTranslations(values: Record<string, string>): void {
  if (!("localStorage" in window)) return;
  try {
    window.localStorage.setItem(
      TRANSLATION_STORAGE_KEY,
      JSON.stringify(values)
    );
  } catch {
    // Cache is optional; the sentence can still be read aloud.
  }
}

export function getCachedTranslation(example: string): string | null {
  const normalized = example.trim().toLowerCase();
  if (memoryCache.has(normalized)) return memoryCache.get(normalized) ?? null;
  const stored = loadTranslations();
  const value = stored[normalized];
  if (value) memoryCache.set(normalized, value);
  return value ?? null;
}

export async function translateExample(example: string): Promise<string | null> {
  const cached = getCachedTranslation(example);
  if (cached) return cached;
  const normalized = example.trim().toLowerCase();
  const existing = inFlight.get(normalized);
  if (existing) return existing;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    example
  )}&langpair=en%7Czh-CN`;
  const request = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const payload = (await response.json()) as {
        responseStatus?: number;
        quotaFinished?: boolean;
        responseData?: { translatedText?: string };
      };
      if (
        payload.responseStatus !== 200 ||
        payload.quotaFinished ||
        !payload.responseData?.translatedText
      ) {
        return null;
      }
      const translation = payload.responseData.translatedText.trim();
      const stored = loadTranslations();
      stored[normalized] = translation;
      memoryCache.set(normalized, translation);
      persistTranslations(stored);
      return translation;
    } catch {
      return null;
    }
  })();
  inFlight.set(normalized, request);
  try {
    return await request;
  } finally {
    inFlight.delete(normalized);
  }
}
