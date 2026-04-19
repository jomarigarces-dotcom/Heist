import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function BreakLogsTable({ account, date }) {
  const logs = useQuery(api.queries.listBreakLogs, { account, date });

  if (logs === undefined) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        SCANNING BREAK CYCLES...
      </div>
    );
  }

  return (
    <div className="table-wrapper animate-in">
      <div className="table-header">
        <span className="table-title">DATA-BREAK // INTERVAL_LOGS</span>
        <span className="table-count">{logs.length} ENTRIES</span>
      </div>
      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ opacity: 0.2 }}>[0]</div>
          <div className="empty-state-title">INTERVAL-STREAM-STATIC</div>
          <div className="empty-state-sub">NO BREAK RECORDS DETECTED IN ACTIVE BUFFER.</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>UNIT_NAME</th>
                <th>PERIOD</th>
                <th>SECTOR</th>
                <th>TYPE</th>
                <th>START</th>
                <th>END</th>
                <th>DURATION</th>
                <th>OVERBRK</th>
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
                    ) : "—"}
                  </td>
                  <td>
                    <span className="exception-rule" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-indigo)', borderColor: 'var(--accent-indigo)' }}>
                      {log.breakType?.toUpperCase() || "LOG-FAIL"}
                    </span>
                  </td>
                  <td className="mono" style={{ color: 'var(--accent-cyan)' }}>{log.startTime || "—"}</td>
                  <td className={`mono${!log.endTime ? " highlight-bad" : ""}`}>
                    {log.endTime || "OPEN_BRK"}
                  </td>
                  <td className={
                    (log.durationHours ?? 0) > 2 &&
                    (log.breakType ?? "").toLowerCase().includes("clinic")
                      ? "highlight-bad mono"
                      : "mono"
                  }>
                    {log.durationHours ?? "0"} h
                  </td>
                  <td className={
                    (log.overBreakHours ?? 0) >= 0.8 ? "highlight-bad mono" : "mono"
                  }>
                    {log.overBreakHours ?? "0"} h
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
