import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { WORDS } from "../data/words";
import { useStore } from "../store";
import { WordDetail } from "../components/WordDetail";
import { getWordStatusLabel, getWordStatusTone, wordById } from "../services/words";
import type { Word, WordStatus } from "../types/word";

const PAGE_SIZE = 50;
const BAND_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "Top 100", value: "100" },
  { label: "Top 500", value: "500" },
  { label: "Top 1000", value: "1000" },
  { label: "Top 2000", value: "2000" },
  { label: "Top 3000", value: "3000" },
];

const STATUS_OPTIONS: { label: string; value: WordStatus | "all" }[] = [
  { label: "全部状态", value: "all" },
  { label: "未学习", value: "unlearned" },
  { label: "认识", value: "known" },
  { label: "模糊", value: "fuzzy" },
  { label: "忘记", value: "forgot" },
];

type SortKey = "rank-asc" | "rank-desc" | "freq-desc" | "alpha";

export function DictionaryPage() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [status, setStatus] = useState<WordStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("rank-asc");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const limit = band === "all" ? WORDS.length : Number(band);
    let filtered = WORDS.slice(0, limit);
    if (needle) {
      filtered = filtered.filter((word) => word.word.includes(needle));
    }
    if (status !== "all") {
      filtered = filtered.filter(
        (word) => (state.progress[String(word.id)]?.status ?? "unlearned") === status
      );
    }
    return [...filtered].sort((a, b) => {
      if (sortKey === "rank-asc") return a.rank - b.rank;
      if (sortKey === "rank-desc") return b.rank - a.rank;
      if (sortKey === "freq-desc") {
        return b.frequency - a.frequency || a.rank - b.rank;
      }
      return a.word.localeCompare(b.word);
    });
  }, [query, band, status, sortKey, state.progress]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = results.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const selected = selectedId === null ? null : wordById(WORDS, selectedId);

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">真题词库</p>
        <h1>词库浏览</h1>
        <p className="heading-note">{results.length.toLocaleString()} 个匹配结果</p>
      </header>

      <div className="dictionary-toolbar panel">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="搜索单词"
            aria-label="搜索单词"
          />
        </label>
        <select
          value={band}
          onChange={(event) => {
            setBand(event.target.value);
            setPage(0);
          }}
          aria-label="词频范围筛选"
        >
          {BAND_OPTIONS.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as WordStatus | "all");
            setPage(0);
          }}
          aria-label="学习状态筛选"
        >
          {STATUS_OPTIONS.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(event) => {
            setSortKey(event.target.value as SortKey);
            setPage(0);
          }}
          aria-label="排序方式"
        >
          <option value="rank-asc">词频排名 ↑</option>
          <option value="rank-desc">词频排名 ↓</option>
          <option value="freq-desc">出现次数 ↓</option>
          <option value="alpha">单词 A-Z</option>
        </select>
      </div>

      <section className="word-table-wrap">
        <div className="word-table-head" aria-hidden="true">
          <span>排名</span>
          <span>单词</span>
          <span>词频</span>
          <span>状态</span>
        </div>
        <div className="word-rows">
          {pageRows.map((word) => {
            const wordStatus = state.progress[String(word.id)]?.status ?? "unlearned";
            return (
              <button
                type="button"
                className="word-row"
                key={word.id}
                onClick={() => setSelectedId(word.id)}
              >
                <span className="rank-cell">#{word.rank}</span>
                <span className="word-cell">
                  <strong>{word.word}</strong>
                  {word.phonetic && <small>{word.phonetic}</small>}
                </span>
                <span className="frequency-cell">{word.frequency}</span>
                <span className={`status-cell tone-${getWordStatusTone(wordStatus)}`}>
                  {getWordStatusLabel(wordStatus)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="pagination">
        <button
          type="button"
          className="btn btn-secondary icon-text"
          disabled={safePage === 0}
          onClick={() => setPage((current) => Math.max(0, current - 1))}
        >
          <ChevronLeft size={17} />
          上一页
        </button>
        <span>
          {safePage + 1} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-secondary icon-text"
          disabled={safePage + 1 >= totalPages}
          onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
        >
          下一页
          <ChevronRight size={17} />
        </button>
      </div>

      {selected && (
        <WordDetail
          word={selected}
          progress={state.progress[String(selected.id)]}
          voiceURI={state.settings.voiceURI}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
