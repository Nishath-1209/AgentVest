export default function StatusBadge({ status, label, size = "md" }) {
  const norm = String(status || "").toLowerCase().replace(/[\s-]/g, "_");

  let type = "neutral";
  if (
    norm === "ok" ||
    norm === "bullish" ||
    norm === "positive" ||
    norm === "positive_alignment" ||
    norm === "connected" ||
    norm === "ready"
  ) {
    type = "positive";
  } else if (
    norm === "error" ||
    norm === "bearish" ||
    norm === "negative" ||
    norm === "negative_alignment" ||
    norm === "offline"
  ) {
    type = "negative";
  } else if (
    norm === "mixed" ||
    norm === "mixed_signals" ||
    norm === "neutral" ||
    norm === "warning" ||
    norm === "beta"
  ) {
    type = "warning";
  }

  const displayText =
    label ||
    String(status || "Unknown")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`status-badge status-badge-${type} status-badge-${size}`}>
      <span className="status-badge-dot" />
      <span>{displayText}</span>
    </span>
  );
}
