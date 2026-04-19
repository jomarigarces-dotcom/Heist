const METRIC_CONFIG = {
  attendance: {
    label: "Attendance",
    cards: [
      { key: "lateCount", label: "Late Arrivals", sub: "≥ 0.8h late", color: "red", rules: ["STEP_3_2", "STEP_3_3"] },
      { key: "undertimeCount", label: "Undertime", sub: "≥ 4h short", color: "red", rules: ["STEP_3_4"] },
      { key: "missingLogout", label: "No Logout", sub: "Missing log-out", color: "amber", rules: ["STEP_3_1_MISSING_LOGOUT"] },
      { key: "scheduleNot40", label: "<40h Schedule", sub: "Weekly ≠ 40h", color: "amber", rules: ["STEP_3_9"] },
      { key: "errorCount", label: "Zoho Errors", sub: "Flagged by system", color: "pink", rules: ["STEP_3_1_ERROR_COUNT"] },
    ],
  },
  breaks: {
    label: "Breaks",
    cards: [
      { key: "overbreakCount", label: "Overbreaks", sub: "≥ 0.8h excess", color: "amber", rules: ["STEP_4_3"] },
      { key: "openBreaks", label: "Open Breaks", sub: "No end time", color: "red", rules: ["STEP_4_1"] },
      { key: "clinicOvertime", label: "Clinic > 2h", sub: "Excess clinic", color: "amber", rules: ["STEP_4_2"] },
      { key: "clinicLunchOverlap", label: "Clinic/Lunch Overlap", sub: "Deduction needed", color: "red", rules: ["STEP_4_5"] },
    ],
  },
  inquiries: {
    label: "Inquiries",
    cards: [
      { key: "pendingOT", label: "Pending OT", sub: "Needs approval", color: "cyan", rules: ["STEP_2_1_PENDING_OT"] },
      { key: "pendingLeave", label: "Pending Leave", sub: "Needs approval", color: "cyan", rules: ["STEP_2_1_PENDING_LEAVE"] },
      { key: "halfDayLeave", label: "Half-Day Leave", sub: "Check deductions", color: "green", rules: ["STEP_3_5"] },
      { key: "leaveButPresent", label: "Leave but Present", sub: "Login detected", color: "red", rules: ["STEP_3_6"] },
    ],
  },
};

export default function DashboardMetrics({ stats, activeRule, onRuleClick }) {
  if (!stats) return <div className="loading-state">Loading metrics...</div>;

  return (
    <div>
      {Object.entries(METRIC_CONFIG).map(([sectionKey, section]) => (
        <div className="metrics-section" key={sectionKey}>
          <div className="metrics-section-title">{section.label}</div>
          <div className="metrics-row">
            {section.cards.map((card) => {
              const value = stats[card.key] ?? 0;
              const isActive = activeRule && card.rules.some(r =>
                activeRule.some(ar => ar === r)
              );

              return (
                <div
                  key={card.key}
                  className={`metric-card ${card.color} ${isActive ? "active" : ""}`}
                  onClick={() => onRuleClick(isActive ? null : card.rules)}
                >
                  <div className="metric-value">{value}</div>
                  <div className="metric-label">{card.label}</div>
                  <div className="metric-sub">{card.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
