import { useEffect, useState } from "react";
import { Languages, RotateCw, Volume2 } from "lucide-react";
import type { Settings } from "../types/word";
import { speakWord } from "../services/speech";
import {
  getCachedTranslation,
  translateExample,
} from "../services/translation";

export function ExampleBlock({
  example,
  settings,
}: {
  example: string;
  settings: Settings;
}) {
  const [translation, setTranslation] = useState<string | null>(() =>
    getCachedTranslation(example)
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error">(
    getCachedTranslation(example) ? "idle" : "loading"
  );

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedTranslation(example);
    if (cached) {
      setTranslation(cached);
      setStatus("idle");
      return;
    }
    setTranslation(null);
    setStatus("loading");
    translateExample(example).then((value) => {
      if (cancelled) return;
      setTranslation(value);
      setStatus(value ? "idle" : "error");
    });
    return () => {
      cancelled = true;
    };
  }, [example]);

  return (
    <section className="example-block">
      <div className="example-block-head">
        <span className="label-chip">真题例句</span>
        <button
          type="button"
          className="icon-btn compact"
          aria-label="朗读例句"
          title="朗读例句"
          onClick={() => speakWord(example, settings)}
        >
          <Volume2 size={18} />
        </button>
      </div>
      <p className="example-en">{example}</p>
      {translation ? (
        <p className="example-zh">{translation}</p>
      ) : status === "loading" ? (
        <p className="translation-state">
          <Languages size={14} aria-hidden="true" />
          正在获取中文翻译
        </p>
      ) : (
        <button
          type="button"
          className="translation-retry"
          onClick={() => {
            setTranslation(null);
            setStatus("loading");
            translateExample(example).then((value) => {
              setTranslation(value);
              setStatus(value ? "idle" : "error");
            });
          }}
        >
          <RotateCw size={14} aria-hidden="true" />
          翻译失败，点此重试
        </button>
      )}
    </section>
  );
}
