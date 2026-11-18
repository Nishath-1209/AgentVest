import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function MetricCard({
  title,
  value,
  change,
  changePercent,
  trend,
  subtext,
  icon: Icon,
}) {
  const isPositive =
    trend === "up" ||
    (typeof change === "number" && change > 0) ||
    (typeof changePercent === "number" && changePercent > 0);
  const isNegative =
    trend === "down" ||
    (typeof change === "number" && change < 0) ||
    (typeof changePercent === "number" && changePercent < 0);

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span className="metric-card-title">{title}</span>
        {Icon && <Icon size={18} className="metric-card-icon" />}
      </div>
      <div className="metric-card-body">
        <span className="metric-card-value">{value ?? "N/A"}</span>
        {(change != null || changePercent != null) && (
          <div
            className={`metric-card-change ${
              isPositive ? "positive" : isNegative ? "negative" : "neutral"
            }`}
          >
            {isPositive ? (
              <TrendingUp size={14} />
            ) : isNegative ? (
              <TrendingDown size={14} />
            ) : (
              <Minus size={14} />
            )}
            <span>
              {change != null ? (change > 0 ? `+${change}` : change) : ""}
              {change != null && changePercent != null ? " (" : ""}
              {changePercent != null
                ? `${changePercent > 0 ? "+" : ""}${changePercent}%`
                : ""}
              {change != null && changePercent != null ? ")" : ""}
            </span>
          </div>
        )}
      </div>
      {subtext && <div className="metric-card-subtext">{subtext}</div>}
    </div>
  );
}
