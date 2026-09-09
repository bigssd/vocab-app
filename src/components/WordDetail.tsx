import { useEffect } from "react";
import { Volume2, X } from "lucide-react";
import type { ProgressRecord, Word } from "../types/word";
import { speakWord } from "../services/speech";
import { formatReviewTime } from "../services/date";
import { getWordStatusLabel, lines } from "../services/words";

export function WordDetail({
  word,
  progress,
  voiceURI,
  onClose,
}: {
  word: Word;
  progress: ProgressRecord | undefined;
  voiceURI: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${word.word} 详情`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="detail-head">
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>
        <div className="detail-wordline">
          <h2>{word.word}</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="播放发音"
            onClick={() => speakWord(word.word, voiceURI)}
          >
            <Volume2 size={21} />
          </button>
        </div>
        {word.phonetic && <p className="phonetic">{word.phonetic}</p>}
        <p className="frequency-chip">
          真题词频 #{word.rank} · 出现 {word.frequency} 次
        </p>

        <dl className="detail-grid">
          <div>
            <dt>状态</dt>
            <dd>{getWordStatusLabel(progress?.status ?? "unlearned")}</dd>
          </div>
          <div>
            <dt>下次复习</dt>
            <dd>{formatReviewTime(progress?.nextReviewAt ?? null)}</dd>
          </div>
          <div>
            <dt>学习次数</dt>
            <dd>{progress?.reviewCount ?? 0}</dd>
          </div>
          <div>
            <dt>错误次数</dt>
            <dd>
              {(progress?.forgotCount ?? 0) + (progress?.misspellCount ?? 0)}
            </dd>
          </div>
        </dl>

        {word.dictionaryMeaning && (
          <section className="detail-section">
            <h3>词典释义</h3>
            <div className="meaning-lines">
              {lines(word.dictionaryMeaning).map((line, index) => (
                <p key={`${word.id}-${index}`}>{line}</p>
              ))}
            </div>
          </section>
        )}

        {word.examMeaning && (
          <section className="detail-section exam">
            <h3>考试大纲释义</h3>
            <p>{word.examMeaning.replace(/\n/g, "；")}</p>
          </section>
        )}

        {word.example && (
          <section className="detail-section">
            <h3>真题例句</h3>
            <p className="example-en">{word.example}</p>
          </section>
        )}

        {!word.dictionaryMeaning && !word.example && (
          <p className="empty-copy">这份数据中没有更多可展示的内容。</p>
        )}
      </section>
    </div>
  );
}
