import { useMemo } from "react";
import { ArrowRight, BookOpenCheck, Flame, Play } from "lucide-react";
import { WORDS } from "../data/words";
import { useStore } from "../store";
import { ProgressBar } from "../components/ProgressBar";
import { buildStudyPlan } from "../services/studyPlan";
import {
  countLearnedToday,
  coverageFor,
  cumulativeDays,
  streakDays,
  summarizeProgress,
} from "../services/stats";
import { toDayKey } from "../services/date";
import type { SessionKind, TrainingMode } from "../types/word";

export function HomePage({
  onStart,
}: {
  onStart: (kind: SessionKind, mode: TrainingMode) => void;
}) {
  const { state } = useStore();
  const { progress, settings, daily } = state;
  const goal = settings.dailyGoal;
  const todayKey = toDayKey();
  const todayLearned = countLearnedToday(progress, todayKey);
  const nowIso = new Date().toISOString();

  const plan = useMemo(
    () => buildStudyPlan(WORDS, progress, goal, nowIso, "today"),
    [progress, goal, nowIso]
  );
  const counts = useMemo(() => summarizeProgress(WORDS, progress), [progress]);
  const streak = streakDays(daily, todayKey);
  const learnedDays = cumulativeDays(daily);
  const bands = useMemo(
    () =>
      [100, 500, 1000, 2000, 3000, null].map((limit) =>
        coverageFor(WORDS, progress, limit)
      ),
    [progress]
  );

  const percent = goal === 0 ? 0 : Math.min(100, Math.round((todayLearned / goal) * 100));
  const todayDone = todayLearned >= goal;
  const planTotal = plan.items.length;

  return (
    <div className="page">
      <header className="page-heading home-heading">
        <div>
          <p className="eyebrow">每日学习仪表盘</p>
          <h1>今天准备背什么</h1>
          <p className="heading-note">
            今天已学习 {todayLearned} 个，连续学习 {streak} 天
          </p>
        </div>
        <div className="heading-stats">
          <div>
            <Flame size={18} />
            <strong>{streak}</strong>
            <span>连续天数</span>
          </div>
          <div>
            <BookOpenCheck size={18} />
            <strong>{learnedDays}</strong>
            <span>累计天数</span>
          </div>
        </div>
      </header>

      <section className="today-panel panel">
        <div className="today-main">
          <div className="today-title">
            <span className="label-chip blue">今日学习</span>
            <h2>
              {todayDone ? "今日目标已完成" : `${todayLearned} / ${goal}`}
            </h2>
            <p className="today-percent">{percent}%</p>
          </div>
          <ProgressBar
            value={todayLearned}
            total={goal}
            tone={todayDone ? "success" : "accent"}
            label="今日目标进度"
          />
          <div className="today-breakdown">
            <div>
              <strong>{plan.groupCounts.due}</strong>
              <span>到期复习</span>
            </div>
            <div>
              <strong>{plan.groupCounts.mistake}</strong>
              <span>易错词</span>
            </div>
            <div>
              <strong>{plan.groupCounts.fuzzy}</strong>
              <span>模糊词</span>
            </div>
            <div>
              <strong>{plan.groupCounts.fresh}</strong>
              <span>新词</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={() => onStart("today", settings.mode)}
          >
            <Play size={18} />
            {todayLearned > 0 ? "继续今日学习" : "开始今日学习"}
          </button>
          <p className="queue-note">
            本次 {planTotal} 个 · 以 SRS 到期词优先，不足时按词频补充新词
          </p>
        </div>

        <aside className="coverage-card">
          <div className="coverage-head">
            <h3>真题词频覆盖</h3>
            <span>已学占比</span>
          </div>
          {bands.map((band) => (
            <div className="coverage-row" key={band.limit ?? "all"}>
              <div className="coverage-label">
                <span>
                  {band.limit === null
                    ? "全部词汇"
                    : `Top ${band.limit}`}
                </span>
                <strong>{band.percent}%</strong>
              </div>
              <ProgressBar
                value={band.learned}
                total={band.total}
                tone={band.percent >= 80 ? "success" : "accent"}
                label={`Top ${band.limit ?? "全部"}覆盖率`}
              />
            </div>
          ))}
        </aside>
      </section>

      <section className="metric-section">
        <div className="section-line">
          <h2>词汇进度</h2>
          <span>状态根据你的每次选择更新</span>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <span>总词汇量</span>
            <strong>{counts.total.toLocaleString()}</strong>
          </div>
          <div className="stat-card success">
            <span>已掌握</span>
            <strong>{counts.known.toLocaleString()}</strong>
          </div>
          <div className="stat-card warning">
            <span>学习中</span>
            <strong>{counts.learning.toLocaleString()}</strong>
          </div>
          <div className="stat-card muted">
            <span>未学习</span>
            <strong>{counts.unlearned.toLocaleString()}</strong>
          </div>
          <div className="stat-card danger">
            <span>易错词</span>
            <strong>{counts.mistakes.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <button type="button" className="action-tile" onClick={() => onStart("review", settings.mode)}>
          <span className="action-icon">
            <ArrowRight size={18} />
          </span>
          <div>
            <strong>进入复习</strong>
            <span>到期 SRS 复习</span>
          </div>
        </button>
        <button type="button" className="action-tile" onClick={() => onStart("mistakes", settings.mode)}>
          <span className="action-icon danger">
            <ArrowRight size={18} />
          </span>
          <div>
            <strong>错词训练</strong>
            <span>{counts.mistakes} 个待处理</span>
          </div>
        </button>
        <button type="button" className="action-tile" onClick={() => onStart("new", settings.mode)}>
          <span className="action-icon success">
            <ArrowRight size={18} />
          </span>
          <div>
            <strong>只学新词</strong>
            <span>按真题词频顺序</span>
          </div>
        </button>
      </section>
    </div>
  );
}
