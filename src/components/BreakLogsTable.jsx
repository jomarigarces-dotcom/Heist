import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Pagination from "./Pagination";

export default function BreakLogsTable({ account, date }) {
  const [page, setPage] = useState(1);
  const data = useQuery(api.queries.listBreakLogs, {
    account: account || "ALL",
    date,
    page,
  });

  if (!data) return <div className="loading-state">Loading break logs...</div>;

  const { rows: logs, totalCount, totalPages, currentPage } = data;

  if (totalCount === 0) {
    return (
      <div className="table-card">
        <div className="table-header"><h3>Break Logs</h3></div>
        <div className="empty-state">
          <div className="icon">◑</div>
          <h4>No Data</h4>
          <p>No break logs found for the current filter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-header">
        <h3>Break Logs — {totalCount.toLocaleString()} records</h3>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Account</th>
              <th>Date</th>
              <th>Type</th>
              <th>Start</th>
              <th>End</th>
              <th>Duration (h)</th>
              <th>Overbreak (h)</th>
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
                <td>{log.breakType || "—"}</td>
                <td>{log.startTime || "—"}</td>
                <td style={{ color: !log.endTime ? "var(--red)" : undefined }}>
                  {log.endTime || "OPEN"}
                </td>
                <td>{log.durationHours ?? 0}</td>
                <td style={{ color: (log.overBreakHours ?? 0) >= 0.8 ? "var(--amber)" : undefined }}>
                  {log.overBreakHours ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />
    </div>
  );
}
