import { useMemo, useState } from "react";
import { CalendarDays, Target } from "lucide-react";
import { WORDS } from "../data/words";
import { useStore } from "../store";
import { ProgressBar } from "../components/ProgressBar";
import {
  aggregateStats,
  coverageFor,
  cumulativeDays,
  streakDays,
  summarizeProgress,
  trendPoints,
} from "../services/stats";
import { formatDateShort, toDayKey } from "../services/date";

export function StatisticsPage() {
  const { state } = useStore();
  const [range, setRange] = useState<7 | 30>(7);
  const todayKey = toDayKey();
  const totals = useMemo(
    () => summarizeProgress(WORDS, state.progress),
    [state.progress]
  );
  const aggregate = aggregateStats(state);
  const coverage = useMemo(
    () => [100, 500, 1000, 2000, 3000, null].map((limit) => coverageFor(WORDS, state.progress, limit)),
    [state.progress]
  );
  const trend = useMemo(
    () => trendPoints(state.daily, todayKey, range),
    [state.daily, todayKey, range]
  );
  const streak = streakDays(state.daily, todayKey);
  const days = cumulativeDays(state.daily);
  const todayLearned = state.daily[todayKey]?.wordsLearned ?? 0;
  const goalDone = todayLearned >= state.settings.dailyGoal;
  const maxLearned = Math.max(1, ...trend.map((point) => point.wordsLearned));
  const recent = trend.slice(-Math.min(7, trend.length)).reverse();

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">学习统计</p>
        <h1>词汇掌握情况</h1>
        <p className="heading-note">所有数据只保存在这台设备</p>
      </header>

      <section className="stat-grid five">
        <div className="stat-card">
          <span>累计学习单词</span>
          <strong>{aggregate.learnedTotal.toLocaleString()}</strong>
        </div>
        <div className="stat-card success">
          <span>已掌握</span>
          <strong>{totals.known.toLocaleString()}</strong>
        </div>
        <div className="stat-card warning">
          <span>学习中</span>
          <strong>{totals.learning.toLocaleString()}</strong>
        </div>
        <div className="stat-card danger">
          <span>错词</span>
          <strong>{totals.mistakes.toLocaleString()}</strong>
        </div>
        <div className="stat-card">
          <span>总复习次数</span>
          <strong>{aggregate.reviewTotal.toLocaleString()}</strong>
        </div>
      </section>

      <section className="streak-row panel">
        <div className="streak-main">
          <div className="streak-icon">
            <CalendarDays size={22} />
          </div>
          <div>
            <span className="eyebrow">连续学习</span>
            <strong>{streak} 天</strong>
          </div>
          <div>
            <span className="eyebrow">累计学习</span>
            <strong>{days} 天</strong>
          </div>
          <div>
            <span className="eyebrow">今日目标</span>
            <strong className={goalDone ? "goal-done" : ""}>
              {goalDone ? "已完成" : `${todayLearned}/${state.settings.dailyGoal}`}
            </strong>
          </div>
        </div>
        <div className="streak-accuracy">
          <Target size={18} />
          <strong>{aggregate.answerAccuracy ?? 0}%</strong>
          <span>总体认识率</span>
        </div>
      </section>

      <section className="trend-panel panel">
        <div className="trend-head">
          <div>
            <h2>学习趋势</h2>
            <span>每天学习的单词数</span>
          </div>
          <div className="segmented small">
            <button
              type="button"
              className={range === 7 ? "active" : ""}
              onClick={() => setRange(7)}
            >
              最近 7 天
            </button>
            <button
              type="button"
              className={range === 30 ? "active" : ""}
              onClick={() => setRange(30)}
            >
              最近 30 天
            </button>
          </div>
        </div>
        <div className="trend-chart">
          {trend.map((point) => (
            <div
              className="trend-column"
              key={point.date}
              title={`${point.date}: 学习 ${point.wordsLearned}, 复习事件 ${point.reviewEvents}`}
            >
              <div className="trend-track">
                <div
                  className={`trend-bar${point.date === todayKey ? " today" : ""}`}
                  style={{
                    height: `${Math.max(4, (point.wordsLearned / maxLearned) * 100)}%`,
                  }}
                />
              </div>
              <span>{formatDateShort(point.date)}</span>
            </div>
          ))}
        </div>
        <div className="recent-table">
          {recent.map((point) => (
            <div key={point.date}>
              <span>{point.date}</span>
              <span>新词 {point.newWords}</span>
              <span>复习事件 {point.reviewEvents}</span>
              <span>
                认识率 {point.accuracy === null ? "-" : `${point.accuracy}%`}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="coverage-section panel">
        <div className="section-line">
          <h2>真题词频覆盖率</h2>
          <span>按“至少学过一次”统计</span>
        </div>
        <div className="coverage-grid">
          {coverage.map((item) => (
            <div key={item.limit ?? "all"} className="coverage-item">
              <div>
                <span>{item.limit === null ? "全部词汇" : `Top ${item.limit}`}</span>
                <strong>{item.percent}%</strong>
              </div>
              <ProgressBar
                value={item.learned}
                total={item.total}
                tone={item.percent >= 80 ? "success" : "accent"}
                label={`Top ${item.limit ?? "全部"}覆盖率`}
              />
              <small>
                {item.learned} / {item.total}
              </small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
