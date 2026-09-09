import { useEffect, useState } from "react";
import { StoreProvider } from "./store";
import { AppShell, PageKey } from "./components/AppShell";
import { HomePage } from "./pages/Home";
import { StudyPage } from "./pages/Study";
import { DictionaryPage } from "./pages/Dictionary";
import { ReviewPage } from "./pages/Review";
import { MistakesPage } from "./pages/Mistakes";
import { StatisticsPage } from "./pages/Statistics";
import { SettingsPage } from "./pages/Settings";
import type { SessionKind, TrainingMode } from "./types/word";

interface RouteState {
  page: PageKey;
  params: URLSearchParams;
}

function parseHash(): RouteState {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [path = "home", query = ""] = raw.split("?");
  const validPages: PageKey[] = [
    "home",
    "study",
    "dictionary",
    "review",
    "mistakes",
    "statistics",
    "settings",
  ];
  const page = validPages.includes(path as PageKey) ? (path as PageKey) : "home";
  return { page, params: new URLSearchParams(query) };
}

function toSessionKind(value: string | null): SessionKind | null {
  if (
    value === "today" ||
    value === "review" ||
    value === "mistakes" ||
    value === "new"
  ) {
    return value;
  }
  return null;
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() => parseHash());

  useEffect(() => {
    const sync = () => setRoute(parseHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const go = (
    page: PageKey,
    params: Record<string, string> = {}
  ): void => {
    const query = new URLSearchParams(params).toString();
    window.location.hash = `/${page}${query ? `?${query}` : ""}`;
  };

  const kind = toSessionKind(route.params.get("kind"));
  const modeParam = route.params.get("mode");
  const mode: TrainingMode | null =
    modeParam === "spelling"
      ? "spelling"
      : modeParam === "flash"
        ? "flash"
        : null;

  return (
    <StoreProvider>
      <AppShell current={route.page} onNavigate={(page) => go(page)}>
        {route.page === "home" && (
          <HomePage onStart={(sessionKind, trainingMode) => go("study", {
            kind: sessionKind,
            mode: trainingMode,
          })} />
        )}
        {route.page === "study" && <StudyPage initialKind={kind} mode={mode} />}
        {route.page === "dictionary" && <DictionaryPage />}
        {route.page === "review" && <ReviewPage />}
        {route.page === "mistakes" && <MistakesPage />}
        {route.page === "statistics" && <StatisticsPage />}
        {route.page === "settings" && <SettingsPage />}
      </AppShell>
    </StoreProvider>
  );
}
