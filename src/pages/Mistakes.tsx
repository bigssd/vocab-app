import { useMemo, useState } from "react";
import { ChevronRight, Play } from "lucide-react";
import { WORDS } from "../data/words";
import { useStore } from "../store";
import { WordDetail } from "../components/WordDetail";
import { errorCount } from "../services/studyPlan";
import { formatReviewTime } from "../services/date";
import type { Word } from "../types/word";

export function MistakesPage() {
  const { state } = useStore();
  const [selected, setSelected] = useState<Word | null>(null);

  const mistakeWords = useMemo(() => {
    return WORDS.filter((word) => errorCount(state.progress[String(word.id)]) > 0)
      .sort((a, b) => {
        const left = state.progress[String(a.id)];
        const right = state.progress[String(b.id)];
        return (
          errorCount(right) - errorCount(left) ||
          (right?.lastReviewedAt ?? "").localeCompare(left?.lastReviewedAt ?? "") ||
          a.rank - b.rank
        );
      });
  }, [state.progress]);

  const startMistakes = () => {
    window.location.hash = "#/study?kind=mistakes";
  };

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">错词本</p>
        <h1>我的错词</h1>
        <p className="heading-note">拼写错误与反复忘记的单词会自动进入这里</p>
      </header>

      <section className="mistake-hero panel">
        <div className="mistake-count">
          <strong>{mistakeWords.length}</strong>
          <span>个错词</span>
        </div>
        <div className="mistake-hero-copy">
          <h2>优先处理高频错误词</h2>
          <p>训练时会按错误次数排序，正确后仍按 SRS 安排复习。</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-large"
          onClick={startMistakes}
          disabled={mistakeWords.length === 0}
        >
          <Play size={18} />
          开始错词训练
        </button>
      </section>

      <section className="section-line">
        <h2>错词列表</h2>
        <span>错误次数降序</span>
      </section>

      {mistakeWords.length === 0 ? (
        <div className="empty-state">
          <h2>错词本还是空的</h2>
          <p>拼写错误或选择“忘记”的单词会出现在这里。</p>
        </div>
      ) : (
        <div className="mistake-list">
          {mistakeWords.slice(0, 200).map((word) => {
            const record = state.progress[String(word.id)];
            const count = errorCount(record);
            return (
              <button
                type="button"
                key={word.id}
                className="mistake-row"
                onClick={() => setSelected(word)}
              >
                <span className="mistake-error-count">{count}</span>
                <div className="mistake-word-copy">
                  <strong>{word.word}</strong>
                  <span>词频 #{word.rank} · 最近 {formatReviewTime(record?.lastReviewedAt ?? null)}</span>
                </div>
                <ChevronRight size={17} />
              </button>
            );
          })}
          {mistakeWords.length > 200 && (
            <p className="list-more">列表只展示前 200 个，开始训练时会覆盖全部错词。</p>
          )}
        </div>
      )}

      {selected && (
        <WordDetail
          word={selected}
          progress={state.progress[String(selected.id)]}
          voiceURI={state.settings.voiceURI}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
