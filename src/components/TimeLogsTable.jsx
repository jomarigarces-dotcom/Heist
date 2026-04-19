import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function TimeLogsTable({ account, date }) {
  const logs = useQuery(api.queries.listTimeLogs, { account, date });

  if (logs === undefined) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        DECRYPTING LOGS...
      </div>
    );
  }

  return (
    <div className="table-wrapper animate-in">
      <div className="table-header">
        <span className="table-title">DATA-TIME // ATTENDANCE_RECORDS</span>
        <span className="table-count">{logs.length} ENTRIES</span>
      </div>
      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ opacity: 0.2 }}>[!]</div>
          <div className="empty-state-title">DATA-STREAM-EMPTY</div>
          <div className="empty-state-sub">NO LOGS FOUND FOR SELECTED TARGETS.</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>UNIT_NAME</th>
                <th>PERIOD</th>
                <th>SECTOR</th>
                <th>IN</th>
                <th>OUT</th>
                <th>STATE</th>
                <th>LATE</th>
                <th>UNDR</th>
                <th>BILL</th>
                <th>ERR</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ color: "#fff", fontWeight: 700, textTransform: 'uppercase' }}>
                    {log.employeeName}
                  </td>
                  <td className="mono">{log.date}</td>
                  <td>
                    {log.account ? (
                      <span className="tag tag-account">{log.account.toUpperCase()}</span>
                    ) : (
                      <span className="highlight-bad">MISSING</span>
                    )}
                  </td>
                  <td className="mono" style={{ color: 'var(--accent-cyan)' }}>{log.loginTime || "—"}</td>
                  <td className={`mono${!log.logoutTime ? " highlight-bad" : ""}`}>
                    {log.logoutTime || "OPEN"}
                  </td>
                  <td style={{ fontSize: '0.7rem' }}>{log.status?.toUpperCase() || "—"}</td>
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
