import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RULE_LABELS, SEVERITY_ICONS, formatDate } from "./constants";

export default function ActionCenter({ account, status }) {
  const exceptions = useQuery(api.queries.listExceptions, { account, status });
  const resolveException = useMutation(api.queries.resolveException);

  const handleAction = async (id, action) => {
    await resolveException({ exceptionId: id, action, resolvedBy: "QC Team" });
  };

  if (exceptions === undefined) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        Running analyzer…
      </div>
    );
  }

  if (exceptions.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div className="empty-state-icon">✅</div>
        <div className="empty-state-title">No Exceptions Found</div>
        <div className="empty-state-sub">
          {account && account !== "ALL"
            ? `Account "${account}" is clean.`
            : "All accounts are clean. Ingest data from AppScript to run analysis."}
        </div>
      </div>
    );
  }

  // Group by account
  const grouped = {};
  for (const ex of exceptions) {
    const key = ex.account || "Unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ex);
  }

  return (
    <div className="exceptions-list animate-in">
      {Object.entries(grouped).map(([grpAccount, items]) => (
        <div key={grpAccount}>
          <div className="group-header" style={{ marginTop: "4px" }}>
            <span className="group-header-name">{grpAccount}</span>
            <span className="group-header-count">{items.length} flag{items.length !== 1 ? "s" : ""}</span>
          </div>
          {items.map((ex) => {
            const isResolved =
              ex.status === "RESOLVED" || ex.status === "ACKNOWLEDGED";
            const label = RULE_LABELS[ex.ruleCode] ?? ex.ruleCode;
            return (
              <div
                key={ex._id}
                className={`exception-card${isResolved ? " resolved" : ""}`}
                style={{ marginBottom: "8px" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start", flexShrink: 0 }}>
                  <span className={`severity-pill ${isResolved ? ex.status : ex.severity}`}>
                    {isResolved
                      ? ex.status === "RESOLVED" ? "✓ Resolved" : "~ Acknowledged"
                      : `${SEVERITY_ICONS[ex.severity]} ${ex.severity}`}
                  </span>
                </div>

                <div className="exception-body">
                  <div className="exception-employee">{ex.employeeName}</div>
                  <div className="exception-meta">
                    <span className="exception-meta-item">
                      📅 {formatDate(ex.date)}
                    </span>
                    <span className="exception-rule">{label}</span>
                  </div>
                  <div className="exception-description">{ex.description}</div>
                  {ex.rawValue && (
                    <div className="exception-raw">Value: {ex.rawValue}</div>
                  )}
                </div>

                {!isResolved && (
                  <div className="exception-actions">
                    <button
                      id={`resolve-${ex._id}`}
                      className="btn btn-resolve btn-sm"
                      onClick={() => handleAction(ex._id, "RESOLVED")}
                    >
                      ✓ Resolve
                    </button>
                    <button
                      id={`ack-${ex._id}`}
                      className="btn btn-ack btn-sm"
                      onClick={() => handleAction(ex._id, "ACKNOWLEDGED")}
                    >
                      ~ Acknowledge
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
