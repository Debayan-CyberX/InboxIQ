import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
interface StatusCardProps {
  title: string;
  value: number | string;
  change?: { value: number; trend: "up" | "down" | "neutral" };
  icon: LucideIcon;
  variant: "hot" | "warm" | "default" | "risk";
  subtitle?: string;
}
const colors = {
  hot: "#edb29b",
  warm: "#e6cb98",
  default: "#bda5fb",
  risk: "#e6a1b9",
};
export default function StatusCard({
  title,
  value,
  change,
  icon: Icon,
  variant,
  subtitle,
}: StatusCardProps) {
  return (
    <article className="iq-metric">
      <div className="flex items-center justify-between gap-3">
        <span className="iq-metric-label">{title}</span>
        <Icon size={16} strokeWidth={1.6} style={{ color: colors[variant] }} />
      </div>
      <div className="iq-metric-value">{value}</div>
      <div className="flex items-center justify-between gap-2">
        <p className="iq-metric-foot">{subtitle}</p>
        {change && change.trend !== "neutral" && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {change.trend === "up" ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}{" "}
            {change.value}%
          </span>
        )}
      </div>
    </article>
  );
}
