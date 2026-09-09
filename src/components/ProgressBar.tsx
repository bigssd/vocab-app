interface ProgressBarProps {
  value: number;
  total: number;
  tone?: "accent" | "success" | "warning" | "danger";
  label?: string;
}

export function ProgressBar({
  value,
  total,
  tone = "accent",
  label,
}: ProgressBarProps) {
  const percent = total <= 0 ? 0 : Math.min(100, Math.max(0, (value / total) * 100));
  return (
    <div
      className={`progress-track tone-${tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
