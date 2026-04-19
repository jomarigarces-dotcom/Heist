import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function TimeLogsTable({ account, date }) {
  const logs = useQuery(api.queries.listTimeLogs, {
    account: account || "ALL",
    date,
  });

  if (!logs) return <div className="loading-state">Loading time logs...</div>;

  if (logs.length === 0) {
    return (
      <div className="table-card">
        <div className="table-header"><h3>Time Logs</h3></div>
        <div className="empty-state">
          <div className="icon">◷</div>
          <h4>No Data</h4>
          <p>No time logs found for the current filter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-header">
        <h3>Time Logs — {logs.length} records</h3>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Account</th>
              <th>Date</th>
              <th>Login</th>
              <th>Logout</th>
              <th>Status</th>
              <th>Late (h)</th>
              <th>UT (h)</th>
              <th>Billable (h)</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {log.employeeName}
                  <div style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>{log.employeeId}</div>
                </td>
                <td>{log.account || "—"}</td>
                <td>{log.date}</td>
                <td>{log.loginTime || "—"}</td>
                <td style={{ color: !log.logoutTime ? "var(--red)" : undefined }}>
                  {log.logoutTime || "MISSING"}
                </td>
                <td>{log.status || "—"}</td>
                <td style={{ color: (log.lateHours ?? 0) >= 0.8 ? "var(--red)" : undefined }}>
                  {log.lateHours ?? 0}
                </td>
                <td style={{ color: (log.undertimeHours ?? 0) >= 4 ? "var(--red)" : undefined }}>
                  {log.undertimeHours ?? 0}
                </td>
                <td>{log.billableHours ?? 0}</td>
                <td style={{ color: (log.errorCount ?? 0) > 0 ? "var(--pink)" : undefined }}>
                  {log.errorCount ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
