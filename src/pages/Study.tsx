import { useEffect, useMemo, useState } from "react";
import { BookOpen, PenLine, Play } from "lucide-react";
import { WORDS } from "../data/words";
import { useStore } from "../store";
import { buildStudyPlan } from "../services/studyPlan";
import { StudySession } from "../components/StudySession";
import type {
  SessionKind,
  TrainingMode,
  Word,
} from "../types/word";

const KIND_OPTIONS: { key: SessionKind; label: string; note: string }[] = [
  { key: "today", label: "今日学习", note: "到期复习 + 易错词 + 新词" },
  { key: "review", label: "到期复习", note: "只复习 SRS 到期单词" },
  { key: "mistakes", label: "错词训练", note: "优先处理错误次数多的词" },
  { key: "new", label: "新词学习", note: "从最高真题词频开始" },
];

const KIND_TITLES: Record<SessionKind, string> = {
  today: "今日学习",
  review: "到期复习",
  mistakes: "错词训练",
  new: "新词学习",
};

function limitFor(kind: SessionKind, dailyGoal: number): number {
  return kind === "today" || kind === "new" ? dailyGoal : 500;
}

export function StudyPage({
  initialKind,
  mode,
}: {
  initialKind: SessionKind | null;
  mode: TrainingMode | null;
}) {
  const { state } = useStore();
  const [kind, setKind] = useState<SessionKind>(initialKind ?? "today");
  const [trainingMode, setTrainingMode] = useState<TrainingMode>(
    mode ?? state.settings.mode
  );
  const [sessionWords, setSessionWords] = useState<Word[] | null>(null);

  useEffect(() => {
    if (initialKind) setKind(initialKind);
  }, [initialKind]);

  useEffect(() => {
    if (mode) setTrainingMode(mode);
  }, [mode]);

  const nowIso = new Date().toISOString();
  const plan = useMemo(
    () =>
      buildStudyPlan(
        WORDS,
        state.progress,
        limitFor(kind, state.settings.dailyGoal),
        nowIso,
        kind
      ),
    [kind, state.progress, state.settings.dailyGoal, nowIso]
  );
  const wordMap = useMemo(
    () => new Map(WORDS.map((word) => [word.id, word])),
    []
  );

  const start = () => {
    const selected = plan.items
      .map((item) => wordMap.get(item.wordId))
      .filter((word): word is Word => Boolean(word));
    setSessionWords(selected);
  };

  if (sessionWords) {
    return (
      <StudySession
        words={sessionWords}
        mode={trainingMode}
        title={KIND_TITLES[kind]}
        onExit={() => setSessionWords(null)}
        onRetry={() => setSessionWords([...sessionWords])}
      />
    );
  }

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">学习训练</p>
        <h1>选择今天的学习方式</h1>
        <p className="heading-note">
          已生成 {plan.items.length} 个候选单词
        </p>
      </header>

      <section className="choice-grid">
        {KIND_OPTIONS.map((option) => {
          const active = kind === option.key;
          const Icon = option.key === "mistakes" ? BookOpen : BookOpen;
          return (
            <button
              type="button"
              key={option.key}
              className={`choice-card${active ? " active" : ""}`}
              onClick={() => setKind(option.key)}
            >
              <span className="choice-icon">
                <Icon size={19} />
              </span>
              <strong>{option.label}</strong>
              <small>{option.note}</small>
            </button>
          );
        })}
      </section>

      <section className="mode-panel panel">
        <div className="mode-copy">
          <span className="label-chip">训练模式</span>
          <h2>英文回忆还是中文拼写</h2>
          <p>两种模式都会记录认识、模糊、忘记和 SRS 复习时间。</p>
        </div>
        <div className="segmented">
          <button
            type="button"
            className={trainingMode === "flash" ? "active" : ""}
            onClick={() => setTrainingMode("flash")}
          >
            <PenLine size={17} />
            看英文忆中文
          </button>
          <button
            type="button"
            className={trainingMode === "spelling" ? "active" : ""}
            onClick={() => setTrainingMode("spelling")}
          >
            <BookOpen size={17} />
            看中文写英文
          </button>
        </div>
      </section>

      <div className="plan-summary panel">
        <div className="plan-summary-copy">
          <span>队列构成</span>
          <strong>{plan.groupCounts.due} 个到期复习</strong>
          <strong>{plan.groupCounts.mistake} 个易错词</strong>
          <strong>{plan.groupCounts.fuzzy} 个模糊词</strong>
          <strong>{plan.groupCounts.fresh} 个新词</strong>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-large"
          onClick={start}
          disabled={plan.items.length === 0}
        >
          <Play size={18} />
          开始{plan.items.length === 0 ? "（当前无内容）" : ""}
        </button>
      </div>
    </div>
  );
}
