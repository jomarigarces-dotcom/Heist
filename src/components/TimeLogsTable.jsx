import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function TimeLogsTable({ account, date }) {
  const logs = useQuery(api.queries.listTimeLogs, { account, date });

  if (logs === undefined) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        Loading time logs…
      </div>
    );
  }

  return (
    <div className="table-wrapper animate-in">
      <div className="table-header">
        <span className="table-title">⏰ Time Logs</span>
        <span className="table-count">{logs.length} records</span>
      </div>
      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No Time Logs</div>
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
                <th>Login</th>
                <th>Logout</th>
                <th>Status</th>
                <th>Late (h)</th>
                <th>Undertime (h)</th>
                <th>Billable (h)</th>
                <th>Errors</th>
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
                    ) : (
                      <span style={{ color: "var(--high)", fontStyle: "italic" }}>—</span>
                    )}
                  </td>
                  <td className="mono">{log.loginTime || "—"}</td>
                  <td className={`mono${!log.logoutTime ? " highlight-bad" : ""}`}>
                    {log.logoutTime || "MISSING"}
                  </td>
                  <td>{log.status || "—"}</td>
                  <td className={
                    (log.lateHours ?? 0) >= 4
                      ? "highlight-bad mono"
                      : (log.lateHours ?? 0) >= 0.8
                      ? "highlight-warn mono"
                      : "mono"
                  }>
                    {log.lateHours ?? "0"}
                  </td>
                  <td className={
                    (log.undertimeHours ?? 0) >= 4 ? "highlight-bad mono" : "mono"
                  }>
                    {log.undertimeHours ?? "0"}
                  </td>
                  <td className="mono highlight-ok">{log.billableHours ?? "—"}</td>
                  <td className={
                    (log.errorCount ?? 0) > 0 ? "highlight-bad mono" : "mono"
                  }>
                    {log.errorCount ?? "0"}
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
