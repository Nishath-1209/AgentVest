export default function LoadingSkeleton({ lines = 3, height = "20px", type = "card" }) {
  if (type === "chart") {
    return (
      <div className="skeleton-container skeleton-chart">
        <div className="skeleton-pulse skeleton-chart-header" />
        <div className="skeleton-pulse skeleton-chart-body" />
      </div>
    );
  }

  if (type === "metrics") {
    return (
      <div className="skeleton-metrics-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-pulse skeleton-metric-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-container">
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-pulse"
          style={{
            height,
            marginBottom: idx === lines - 1 ? 0 : "12px",
            width: idx === 0 ? "80%" : idx === lines - 1 ? "60%" : "100%",
          }}
        />
      ))}
    </div>
  );
}
