import { useMemo, useState } from "react";
import { ChevronRight, Play } from "lucide-react";
import { WORDS } from "../data/words";
import { useStore } from "../store";
import { ProgressBar } from "../components/ProgressBar";
import { WordDetail } from "../components/WordDetail";
import { dueNow } from "../services/srs";
import { formatReviewTime } from "../services/date";
import { getWordStatusLabel, wordById } from "../services/words";
import { countLearnedToday } from "../services/stats";
import { toDayKey } from "../services/date";
import type { Word } from "../types/word";

export function ReviewPage() {
  const { state } = useStore();
  const [selected, setSelected] = useState<Word | null>(null);
  const nowIso = new Date().toISOString();
  const todayKey = toDayKey();
  const todayLearned = countLearnedToday(state.progress, todayKey);

  const dueWords = useMemo(() => {
    return WORDS.filter((word) => {
      const record = state.progress[String(word.id)];
      return dueNow(record, nowIso);
    }).sort((a, b) => {
      const left = state.progress[String(a.id)]?.nextReviewAt ?? "";
      const right = state.progress[String(b.id)]?.nextReviewAt ?? "";
      return left.localeCompare(right) || a.rank - b.rank;
    });
  }, [state.progress, nowIso]);

  const next = state.settings.dailyGoal;
  const visible = dueWords.slice(0, 12);

  const startReview = () => {
    window.location.hash = "#/study?kind=review";
  };

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">SRS 复习</p>
        <h1>到期复习</h1>
        <p className="heading-note">
          今日目标 {state.settings.dailyGoal} 个，今天已学 {todayLearned} 个
        </p>
      </header>

      <section className="review-hero panel">
        <div className="review-hero-copy">
          <span className="label-chip blue">现在到期</span>
          <strong>{dueWords.length}</strong>
          <p>按照遗忘时间排序，优先复习最需要处理的单词。</p>
        </div>
        <div className="review-hero-actions">
          <ProgressBar
            value={Math.min(dueWords.length, next)}
            total={next}
            label="今日复习进度"
          />
          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={startReview}
            disabled={dueWords.length === 0}
          >
            <Play size={18} />
            开始复习
          </button>
        </div>
      </section>

      <section className="section-line">
        <h2>到期单词</h2>
        <span>共 {dueWords.length} 个</span>
      </section>

      {dueWords.length === 0 ? (
        <div className="empty-state">
          <h2>复习队列已清空</h2>
          <p>今天没有到期的 SRS 复习项。</p>
        </div>
      ) : (
        <div className="review-list">
          {visible.map((word) => {
            const record = state.progress[String(word.id)];
            return (
              <button
                type="button"
                key={word.id}
                className="review-row"
                onClick={() => setSelected(word)}
              >
                <span className="review-rank">#{word.rank}</span>
                <div className="review-word-copy">
                  <strong>{word.word}</strong>
                  <span>{getWordStatusLabel(record?.status ?? "unlearned")}</span>
                </div>
                <div className="review-when">
                  <span>{formatReviewTime(record?.nextReviewAt ?? null)}</span>
                </div>
                <ChevronRight size={17} />
              </button>
            );
          })}
          {dueWords.length > visible.length && (
            <p className="list-more">还有 {dueWords.length - visible.length} 个到期单词，开始复习后会按顺序出现。</p>
          )}
        </div>
      )}

      {selected && (
        <WordDetail
          word={selected}
          progress={state.progress[String(selected.id)]}
          voiceURI={state.settings.voiceURI}
          speechRate={state.settings.speechRate}
          speechPitch={state.settings.speechPitch}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
