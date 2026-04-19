import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function LeavesTable({ account }) {
  const leaves = useQuery(api.queries.listLeaves, {
    account: account || "ALL",
  });

  if (!leaves) return <div className="loading-state">Loading leaves...</div>;

  if (leaves.length === 0) {
    return (
      <div className="table-card">
        <div className="table-header"><h3>Leaves</h3></div>
        <div className="empty-state">
          <div className="icon">☰</div>
          <h4>No Data</h4>
          <p>No leave records found for the current filter.</p>
        </div>
      </div>
    );
  }

  const statusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("approved") && !s.includes("retraction")) return <span className="badge badge-resolved">Approved</span>;
    if (s.includes("pending")) return <span className="badge badge-pending">Pending</span>;
    if (s.includes("retraction")) return <span className="badge badge-high">Retraction</span>;
    return <span className="badge badge-low">{status || "—"}</span>;
  };

  return (
    <div className="table-card">
      <div className="table-header">
        <h3>Leaves — {leaves.length} records</h3>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Account</th>
              <th>Date</th>
              <th>Type</th>
              <th>Day</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((lv) => (
              <tr key={lv._id}>
                <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {lv.employeeName}
                  <div style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>{lv.employeeId}</div>
                </td>
                <td>{lv.account || "—"}</td>
                <td>{lv.leaveDate}</td>
                <td>{lv.leaveType || "—"}</td>
                <td>{lv.dayType || "—"}</td>
                <td>{statusBadge(lv.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
