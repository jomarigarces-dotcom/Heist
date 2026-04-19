import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDate } from "./constants";

export default function LeavesTable({ account }) {
  const leaves = useQuery(api.queries.listLeaves, { account });

  if (leaves === undefined) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        Loading leaves…
      </div>
    );
  }

  return (
    <div className="table-wrapper animate-in">
      <div className="table-header">
        <span className="table-title">🌿 Leaves</span>
        <span className="table-count">{leaves.length} records</span>
      </div>
      {leaves.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌿</div>
          <div className="empty-state-title">No Leave Records</div>
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
                <th>Leave Type</th>
                <th>Day Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((lv) => {
                const isPending =
                  (lv.status ?? "").toLowerCase().includes("pending") ||
                  (lv.status ?? "").toLowerCase().includes("retraction");
                return (
                  <tr key={lv._id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {lv.employeeName}
                    </td>
                    <td className="mono">{lv.leaveDate}</td>
                    <td>
                      {lv.account ? (
                        <span className="tag tag-account">{lv.account}</span>
                      ) : "—"}
                    </td>
                    <td>{lv.leaveType || "—"}</td>
                    <td>{lv.dayType || "—"}</td>
                    <td className={isPending ? "highlight-warn" : "highlight-ok"}>
                      {lv.status || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
