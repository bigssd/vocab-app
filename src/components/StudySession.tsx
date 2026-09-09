import { useEffect, useState } from "react";
import { ArrowLeft, Check, Volume2 } from "lucide-react";
import type { Rating, TrainingMode, Word } from "../types/word";
import { useStore } from "../store";
import { speakWord } from "../services/speech";
import { checkSpelling, SpellingGrade } from "../services/spelling";
import { firstMeaning, lines } from "../services/words";
import { ProgressBar } from "./ProgressBar";
import { ExampleBlock } from "./ExampleBlock";

interface SessionResult {
  known: number;
  fuzzy: number;
  forgot: number;
  misspell: number;
}

const emptyResult: SessionResult = { known: 0, fuzzy: 0, forgot: 0, misspell: 0 };

export function StudySession({
  words,
  mode,
  title,
  onExit,
  onRetry,
}: {
  words: Word[];
  mode: TrainingMode;
  title: string;
  onExit: () => void;
  onRetry?: () => void;
}) {
  const { state, rateWord, gradeSpelling } = useStore();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [spellingInput, setSpellingInput] = useState("");
  const [feedback, setFeedback] = useState<SpellingGrade | null>(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<SessionResult>(emptyResult);

  const word = words[index];

  const advance = () => {
    if (index + 1 >= words.length) {
      setFinished(true);
    } else {
      setIndex((current) => current + 1);
    }
  };

  useEffect(() => {
    setRevealed(false);
    setSpellingInput("");
    setFeedback(null);
  }, [index, words.length]);

  const rate = (rating: Rating) => {
    if (!word || finished) return;
    rateWord(word.id, rating);
    setResult((current) => ({ ...current, [rating]: current[rating] + 1 }));
    advance();
  };

  const submitSpelling = () => {
    if (!word || feedback) return;
    const grade = checkSpelling(spellingInput, word.word);
    setFeedback(grade);
    setRevealed(true);
    gradeSpelling(word.id, grade.correct);
    setResult((current) => ({
      ...current,
      known: current.known + (grade.correct ? 1 : 0),
      misspell: current.misspell + (grade.correct ? 0 : 1),
    }));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!word || finished) return;
      const key = event.key.toLowerCase();
      if (key === "r") {
        speakWord(word.word, state.settings);
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (mode === "flash" && !revealed) setRevealed(true);
        return;
      }
      if (mode === "flash" && revealed) {
        if (key === "1") rate("forgot");
        if (key === "2") rate("fuzzy");
        if (key === "3") rate("known");
        if (event.key === "Enter") advance();
        return;
      }
      if (mode === "spelling") {
        if (event.key === "Enter" && !feedback) {
          event.preventDefault();
          submitSpelling();
        } else if (event.key === "Enter" && feedback) {
          event.preventDefault();
          advance();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [word, finished, revealed, feedback, mode, spellingInput, index, words.length, state.settings, rateWord, gradeSpelling]);

  if (words.length === 0) {
    return (
      <div className="empty-state">
        <Check size={28} aria-hidden="true" />
        <h2>现在没有待学内容</h2>
        <p>可以先去词库浏览，或把今天的新词加入学习队列。</p>
        <button type="button" className="btn btn-secondary" onClick={onExit}>
          返回
        </button>
      </div>
    );
  }

  if (finished) {
    const attempted =
      result.known + result.fuzzy + result.forgot + result.misspell;
    const accuracy = attempted === 0 ? 0 : Math.round((result.known / attempted) * 100);
    return (
      <div className="session-summary panel">
        <div className="summary-mark">
          <Check size={30} />
        </div>
        <h2>本次学习完成</h2>
        <p className="summary-copy">
          共完成 {words.length} 个单词，认识 {result.known}，模糊{" "}
          {result.fuzzy}，忘记 {result.forgot}
          {result.misspell > 0 ? `，拼写错误 ${result.misspell}` : ""}。
        </p>
        <div className="summary-grid">
          <div>
            <strong>{words.length}</strong>
            <span>本次单词</span>
          </div>
          <div>
            <strong>{accuracy}%</strong>
            <span>记忆准确率</span>
          </div>
          <div>
            <strong>{result.known}</strong>
            <span>认识</span>
          </div>
          <div>
            <strong>{result.misspell + result.forgot}</strong>
            <span>待复习</span>
          </div>
        </div>
        <div className="summary-actions">
          {onRetry && (
            <button type="button" className="btn btn-secondary" onClick={onRetry}>
              再练一遍
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onExit}>
            完成
          </button>
        </div>
      </div>
    );
  }

  const progressValue = Math.min(words.length, index + (revealed ? 1 : 0));

  return (
    <div className="session-layout">
      <header className="session-heading">
        <button
          type="button"
          className="btn btn-ghost icon-text"
          onClick={onExit}
        >
          <ArrowLeft size={17} />
          退出
        </button>
        <div className="session-progress">
          <span>
            {title} · {Math.min(index + 1, words.length)} / {words.length}
          </span>
          <ProgressBar
            value={progressValue}
            total={words.length}
            label="本次学习进度"
          />
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="播放发音"
          title="发音"
          onClick={() => speakWord(word.word, state.settings)}
        >
          <Volume2 size={20} />
        </button>
      </header>

      <div className={`study-card${revealed ? " revealed" : ""}`}>
        {mode === "flash" ? (
          <div className="study-content">
            {!revealed ? (
              <>
                <p className="eyebrow">词频 #{word.rank} · 出现 {word.frequency} 次</p>
                <h1 className="study-word">{word.word}</h1>
                {word.phonetic && <p className="study-phonetic">{word.phonetic}</p>}
                <button
                  type="button"
                  className="btn btn-primary reveal-button"
                  onClick={() => setRevealed(true)}
                >
                  显示释义
                </button>
              </>
            ) : (
              <>
                <div className="answer-head">
                  <div>
                    <p className="eyebrow">词频 #{word.rank} · 出现 {word.frequency} 次</p>
                    <h2 className="study-word small">{word.word}</h2>
                    {word.phonetic && <p className="study-phonetic">{word.phonetic}</p>}
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="再听一遍"
                    onClick={() => speakWord(word.word, state.settings)}
                  >
                    <Volume2 size={21} />
                  </button>
                </div>

                {word.dictionaryMeaning && (
                  <div className="meaning-block">
                    {lines(word.dictionaryMeaning).map((line, lineIndex) => (
                      <p key={`dict-${word.id}-${lineIndex}`}>{line}</p>
                    ))}
                  </div>
                )}

                {word.examMeaning && (
                  <div className="meaning-block exam">
                    <span className="label-chip">考试大纲</span>
                    {lines(word.examMeaning).map((line, lineIndex) => (
                      <p key={`exam-${word.id}-${lineIndex}`}>{line}</p>
                    ))}
                  </div>
                )}

                {word.example && (
                  <ExampleBlock
                    example={word.example}
                    settings={state.settings}
                  />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="study-content spelling-mode">
            {!revealed ? (
              <>
                <p className="eyebrow">看释义写英文 · 词频 #{word.rank}</p>
                <h2 className="spelling-prompt">{firstMeaning(word)}</h2>
                <input
                  className="spelling-input"
                  value={spellingInput}
                  onChange={(event) => setSpellingInput(event.target.value)}
                  placeholder="输入英文单词"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="拼写输入框"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitSpelling}
                  disabled={spellingInput.trim().length === 0}
                >
                  检查答案
                </button>
              </>
            ) : (
              <div className="spelling-result">
                <p className={`spelling-state ${feedback?.detail ?? ""}`}>
                  {feedback?.message}
                </p>
                <div className="answer-head center">
                  <div>
                    <h2 className="study-word small">{word.word}</h2>
                    {word.phonetic && <p className="study-phonetic">{word.phonetic}</p>}
                  </div>
                </div>
                {feedback?.detail === "wrong" && (
                  <div className="compare-box">
                    <p>
                      <span>你的答案</span>
                      {spellingInput.trim() || "（空白）"}
                    </p>
                    <p>
                      <span>正确答案</span>
                      {word.word}
                    </p>
                  </div>
                )}
                {word.dictionaryMeaning && (
                  <div className="meaning-block compact">
                    {lines(word.dictionaryMeaning)
                      .slice(0, 2)
                      .map((line, lineIndex) => (
                        <p key={`mini-${word.id}-${lineIndex}`}>{line}</p>
                      ))}
                  </div>
                )}
                <button type="button" className="btn btn-primary" onClick={advance}>
                  下一词
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {mode === "flash" && revealed && (
        <div className="rating-row">
          <button
            type="button"
            className="rate-btn forgot"
            onClick={() => rate("forgot")}
          >
            忘记
          </button>
          <button
            type="button"
            className="rate-btn fuzzy"
            onClick={() => rate("fuzzy")}
          >
            模糊
          </button>
          <button
            type="button"
            className="rate-btn known"
            onClick={() => rate("known")}
          >
            认识
          </button>
        </div>
      )}
    </div>
  );
}
