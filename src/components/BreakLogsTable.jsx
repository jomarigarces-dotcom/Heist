import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function BreakLogsTable({ account, date }) {
  const logs = useQuery(api.queries.listBreakLogs, { account, date });

  if (logs === undefined) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        Loading break logs…
      </div>
    );
  }

  return (
    <div className="table-wrapper animate-in">
      <div className="table-header">
        <span className="table-title">☕ Break Logs</span>
        <span className="table-count">{logs.length} records</span>
      </div>
      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">☕</div>
          <div className="empty-state-title">No Break Logs</div>
          <div className="empty-state-sub">Ingest data via AppScript to populate this table.</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Account</th>
                <th>Break Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration (h)</th>
                <th>Overbreak (h)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {log.employeeName}
                  </td>
                  <td className="mono">{log.date}</td>
                  <td>
                    {log.account ? (
                      <span className="tag tag-account">{log.account}</span>
                    ) : "—"}
                  </td>
                  <td>{log.breakType || "—"}</td>
                  <td className="mono">{log.startTime || "—"}</td>
                  <td className={`mono${!log.endTime ? " highlight-bad" : ""}`}>
                    {log.endTime || "OPEN"}
                  </td>
                  <td className={
                    (log.durationHours ?? 0) > 2 &&
                    (log.breakType ?? "").toLowerCase().includes("clinic")
                      ? "highlight-bad mono"
                      : "mono"
                  }>
                    {log.durationHours ?? "—"}
                  </td>
                  <td className={
                    (log.overBreakHours ?? 0) >= 0.8 ? "highlight-warn mono" : "mono"
                  }>
                    {log.overBreakHours ?? "0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
