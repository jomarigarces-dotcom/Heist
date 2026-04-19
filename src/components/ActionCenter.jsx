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
        ANALYZING SECTOR DATA...
      </div>
    );
  }

  if (exceptions.length === 0) {
    return (
      <div className="empty-state animate-in">
        <div className="empty-state-icon" style={{ opacity: 0.2 }}>[0]</div>
        <div className="empty-state-title">ALL SYSTEMS STABLE</div>
        <div className="empty-state-sub">
          {account && account !== "ALL"
            ? `Sector "${account}" reports no anomalies.`
            : "No workforce anomalies detected in current cycle."}
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
          <div className="group-header">
            <span className="group-header-name">SECTOR // {grpAccount.toUpperCase()}</span>
            <span className="group-header-count">{items.length} ANOMALIES</span>
          </div>
          {items.map((ex) => {
            const isResolved =
              ex.status === "RESOLVED" || ex.status === "ACKNOWLEDGED";
            const label = RULE_LABELS[ex.ruleCode] ?? ex.ruleCode;
            
            return (
              <div
                key={ex._id}
                className={`exception-card ${ex.severity}${isResolved ? " resolved" : ""}`}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start", flexShrink: 0 }}>
                  <span className={`severity-pill ${isResolved ? ex.status : ex.severity}`}>
                    {isResolved
                      ? ex.status === "RESOLVED" ? "SYS_OK" : "SYS_ACK"
                      : `[!] ${ex.severity}`}
                  </span>
                </div>

                <div className="exception-body">
                  <div className="exception-employee">{ex.employeeName}</div>
                  <div className="exception-meta">
                    <span className="exception-meta-item mono">
                      PERIOD: {ex.date}
                    </span>
                    <span className="exception-rule">{label}</span>
                  </div>
                  <div className="exception-description">{ex.description}</div>
                  {ex.rawValue && (
                    <div className="exception-raw">HEX_VAL: {ex.rawValue}</div>
                  )}
                </div>

                {!isResolved && (
                  <div className="exception-actions">
                    <button
                      id={`resolve-${ex._id}`}
                      className="btn btn-resolve btn-sm"
                      onClick={() => handleAction(ex._id, "RESOLVED")}
                    >
                      FIX_SYS
                    </button>
                    <button
                      id={`ack-${ex._id}`}
                      className="btn btn-ack btn-sm"
                      onClick={() => handleAction(ex._id, "ACKNOWLEDGED")}
                    >
                      ACK_ALRT
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
