import { ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  GraduationCap,
  Home,
  Library,
  Repeat,
  Settings,
} from "lucide-react";

export type PageKey =
  | "home"
  | "study"
  | "dictionary"
  | "review"
  | "mistakes"
  | "statistics"
  | "settings";

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { key: "home", label: "首页", icon: Home },
  { key: "study", label: "学习", icon: GraduationCap },
  { key: "dictionary", label: "词库", icon: Library },
  { key: "review", label: "复习", icon: Repeat },
  { key: "mistakes", label: "错词", icon: AlertCircle },
  { key: "statistics", label: "统计", icon: BarChart3 },
  { key: "settings", label: "设置", icon: Settings },
];

export function AppShell({
  current,
  onNavigate,
  children,
}: {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <BookOpenCheck size={21} strokeWidth={2.2} />
          </div>
          <div className="brand-copy">
            <strong>真题词汇</strong>
            <span>个人背词</span>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`nav-link${active ? " active" : ""}`}
                onClick={() => onNavigate(item.key)}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <BookOpen size={16} aria-hidden="true" />
          <span>数据全部保存在本机</span>
        </div>
      </aside>

      <main className="main-content">{children}</main>

      <nav className="bottom-nav" aria-label="移动端导航">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={active ? "active" : ""}
              onClick={() => onNavigate(item.key)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
