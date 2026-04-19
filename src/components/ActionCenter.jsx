import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function ActionCenter({ account, status, ruleFilter }) {
  const exceptions = useQuery(api.queries.listExceptions, {
    account: account || "ALL",
    status: status || "OPEN",
  });
  const resolve = useMutation(api.queries.resolveException);

  if (!exceptions) return <div className="loading-state">Loading actions...</div>;

  // Apply rule filter if a metric card was clicked
  let filtered = exceptions;
  if (ruleFilter && ruleFilter.length > 0) {
    filtered = exceptions.filter((e) =>
      ruleFilter.some((r) => e.ruleCode.startsWith(r))
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="table-card">
        <div className="table-header">
          <h3>Needs Action</h3>
        </div>
        <div className="empty-state">
          <div className="icon">✓</div>
          <h4>All Clear</h4>
          <p>
            {ruleFilter
              ? "No violations found for the selected metric."
              : "No open exceptions for this filter."}
          </p>
        </div>
      </div>
    );
  }

  // Group by account for the "Overview" count
  const byAccount = {};
  for (const e of filtered) {
    const acc = e.account || "Unassigned";
    if (!byAccount[acc]) byAccount[acc] = { total: 0, high: 0 };
    byAccount[acc].total++;
    if (e.severity === "HIGH") byAccount[acc].high++;
  }

  const severityBadge = (severity) => {
    const cls = severity === "HIGH" ? "badge-high" : severity === "MEDIUM" ? "badge-medium" : "badge-low";
    return <span className={`badge ${cls}`}>{severity}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Overview by Account */}
      <div className="overview-card">
        <h3>Overview by Account</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "right" }}>High</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byAccount)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([acc, counts]) => (
                  <tr key={acc}>
                    <td style={{ color: "var(--accent)", fontWeight: 500 }}>{acc}</td>
                    <td style={{ textAlign: "right" }}>{counts.total}</td>
                    <td style={{ textAlign: "right", color: counts.high > 0 ? "var(--red)" : "var(--text-dim)" }}>
                      {counts.high}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>Needs Action — {filtered.length} item{filtered.length !== 1 ? "s" : ""}</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Account</th>
                <th>Date</th>
                <th>Rule</th>
                <th>Severity</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e._id}>
                  <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                    {e.employeeName}
                    <div style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>{e.employeeId}</div>
                  </td>
                  <td>{e.account || "—"}</td>
                  <td>{e.date}</td>
                  <td style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-dim)" }}>
                    {e.ruleCode}
                  </td>
                  <td>{severityBadge(e.severity)}</td>
                  <td style={{ maxWidth: "280px", whiteSpace: "normal", color: "var(--text-secondary)" }}>
                    {e.description}
                    {e.rawValue && (
                      <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "2px" }}>
                        Value: {e.rawValue}
                      </span>
                    )}
                  </td>
                  <td>
                    {e.status === "OPEN" && (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => resolve({ exceptionId: e._id, action: "ACKNOWLEDGED" })}
                        >
                          Ack
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => resolve({ exceptionId: e._id, action: "RESOLVED" })}
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                    {e.status !== "OPEN" && (
                      <span className={`badge badge-${e.status.toLowerCase()}`}>{e.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
