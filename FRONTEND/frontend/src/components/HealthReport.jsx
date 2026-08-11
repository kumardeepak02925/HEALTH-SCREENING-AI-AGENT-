export default function HealthReport({ report }) {
  if (!report) {
    return (
      <section className="report-card">
        <div className="report-header">
          <h2>Health Report</h2>
        </div>
        <div className="empty-report">
          <p>The report will appear here after the call ends.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="report-card">
      <div className="report-header">
        <h2>Health Report</h2>
      </div>
      <div className="report-content">
        {Object.entries(report).map(([key, value]) => (
          <div key={key} className="report-row">
            <span className="report-key">{key}</span>
            <span className="report-value">
              {Array.isArray(value)
                ? value.join(", ") || "None"
                : value ?? "Not collected"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
