import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Download, Trash2, Upload, Volume2 } from "lucide-react";
import { useStore } from "../store";
import {
  parseImport,
  serializeExport,
} from "../services/storage";
import { speakWord } from "../services/speech";
import { toDayKey } from "../services/date";
import { WORDS_COUNT } from "../data/words";

const GOAL_OPTIONS = [10, 20, 30, 50, 100];

export function SettingsPage() {
  const {
    state,
    patchSettings,
    replaceData,
    clearLearningData,
  } = useStore();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      const englishVoices = window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.toLowerCase().startsWith("en"));
      setVoices(englishVoices);
    };
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  const download = () => {
    const today = toDayKey();
    const blob = new Blob(
      [serializeExport(state, new Date().toISOString())],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vocabulary-progress-${today}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = parseImport(String(reader.result));
        const confirmed = window.confirm(
          "导入会覆盖当前学习进度、错词、统计和 SRS 计划，是否继续？"
        );
        if (confirmed) {
          replaceData(next);
          window.alert("学习数据已导入。");
        }
      } catch (error) {
        window.alert("文件无法识别，请选择本应用导出的 JSON 备份。");
        console.error(error);
      }
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };

  const clearAll = () => {
    const first = window.confirm("确定清空全部学习数据吗？此操作无法撤销。");
    if (!first) return;
    const second = window.confirm("再次确认：删除所有学习状态和统计记录？");
    if (second) clearLearningData();
  };

  const customGoal =
    !GOAL_OPTIONS.includes(state.settings.dailyGoal) ||
    state.settings.dailyGoal > 100;

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">设置</p>
        <h1>个人偏好</h1>
        <p className="heading-note">词库共 {WORDS_COUNT} 个单词</p>
      </header>

      <section className="settings-section">
        <div className="section-line">
          <h2>每日目标</h2>
          <span>{state.settings.dailyGoal} 个 / 天</span>
        </div>
        <div className="setting-control">
          <div className="goal-options">
            {GOAL_OPTIONS.map((goal) => (
              <button
                type="button"
                key={goal}
                className={state.settings.dailyGoal === goal ? "active" : ""}
                onClick={() => patchSettings({ dailyGoal: goal })}
              >
                {goal}
              </button>
            ))}
            <button
              type="button"
              className={customGoal ? "active" : ""}
              onClick={() => patchSettings({ dailyGoal: 80 })}
            >
              自定义
            </button>
          </div>
          {customGoal && (
            <label className="number-field">
              <span>每天单词数</span>
              <input
                type="number"
                min={1}
                max={500}
                value={state.settings.dailyGoal}
                onChange={(event) =>
                  patchSettings({
                    dailyGoal: Math.min(
                      500,
                      Math.max(1, Number(event.target.value) || 1)
                    ),
                  })
                }
              />
            </label>
          )}
        </div>
      </section>

      <section className="settings-section">
        <div className="section-line">
          <h2>默认训练模式</h2>
          <span>学习页可随时切换</span>
        </div>
        <div className="segmented wide">
          <button
            type="button"
            className={state.settings.mode === "flash" ? "active" : ""}
            onClick={() => patchSettings({ mode: "flash" })}
          >
            看英文忆中文
          </button>
          <button
            type="button"
            className={state.settings.mode === "spelling" ? "active" : ""}
            onClick={() => patchSettings({ mode: "spelling" })}
          >
            看中文写英文
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="section-line">
          <h2>发音</h2>
          <span>使用浏览器自带语音</span>
        </div>
        <div className="voice-control">
          <label className="select-field">
            <span>英语发音</span>
            <select
              value={state.settings.voiceURI ?? ""}
              onChange={(event) =>
                patchSettings({
                  voiceURI: event.target.value || null,
                })
              }
            >
              <option value="">自动选择英语语音</option>
              {voices.map((voice) => (
                <option value={voice.voiceURI} key={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-secondary icon-text"
            onClick={() =>
              speakWord("vocabulary", {
                voiceURI: state.settings.voiceURI,
                rate: state.settings.speechRate,
                pitch: state.settings.speechPitch,
              })
            }
          >
            <Volume2 size={17} />
            试听
          </button>
        </div>
        <div className="slider-fields">
          <label className="slider-field">
            <span>语速</span>
            <input
              type="range"
              min="0.5"
              max="1.1"
              step="0.05"
              value={state.settings.speechRate}
              onChange={(event) =>
                patchSettings({ speechRate: Number(event.target.value) })
              }
            />
            <strong>{state.settings.speechRate.toFixed(2)}x</strong>
          </label>
          <label className="slider-field">
            <span>音调</span>
            <input
              type="range"
              min="0.6"
              max="1.2"
              step="0.05"
              value={state.settings.speechPitch}
              onChange={(event) =>
                patchSettings({ speechPitch: Number(event.target.value) })
              }
            />
            <strong>{state.settings.speechPitch.toFixed(2)}</strong>
          </label>
        </div>
      </section>

      <section className="settings-section">
        <div className="section-line">
          <h2>数据备份</h2>
          <span>全部保存在浏览器本地</span>
        </div>
        <div className="data-actions">
          <button type="button" className="btn btn-secondary icon-text" onClick={download}>
            <Download size={17} />
            导出学习数据
          </button>
          <button
            type="button"
            className="btn btn-secondary icon-text"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={17} />
            导入学习数据
          </button>
          <button type="button" className="btn btn-danger icon-text" onClick={clearAll}>
            <Trash2 size={17} />
            清空学习数据
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onImportFile}
        />
        <p className="settings-note">
          换设备或清理浏览器前，请先导出 JSON 备份。
        </p>
      </section>
    </div>
  );
}
