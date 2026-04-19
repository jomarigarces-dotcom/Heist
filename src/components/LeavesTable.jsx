import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDate } from "./constants";

export default function LeavesTable({ account }) {
  const leaves = useQuery(api.queries.listLeaves, { account });

  if (leaves === undefined) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        RETRIEVING OFF-DUTY REGISTRY...
      </div>
    );
  }

  return (
    <div className="table-wrapper animate-in">
      <div className="table-header">
        <span className="table-title">DATA-LEAVES // ABSENCE_REGISTRY</span>
        <span className="table-count">{leaves.length} ENTRIES</span>
      </div>
      {leaves.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ opacity: 0.2 }}>[0]</div>
          <div className="empty-state-title">REGISTRY-STREAM-CLEAR</div>
          <div className="empty-state-sub">NO ACTIVE LEAVE RECORDS DETECTED.</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>UNIT_NAME</th>
                <th>PERIOD</th>
                <th>SECTOR</th>
                <th>LV_TYPE</th>
                <th>DAY_TYPE</th>
                <th>CMD_STATUS</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((lv) => {
                const isPending =
                  (lv.status ?? "").toLowerCase().includes("pending") ||
                  (lv.status ?? "").toLowerCase().includes("retraction");
                return (
                  <tr key={lv._id}>
                    <td style={{ color: "#fff", fontWeight: 700, textTransform: 'uppercase' }}>
                      {lv.employeeName}
                    </td>
                    <td className="mono">{lv.leaveDate}</td>
                    <td>
                      {lv.account ? (
                        <span className="tag tag-account">{lv.account.toUpperCase()}</span>
                      ) : "—"}
                    </td>
                    <td>
                      <span className="exception-rule" style={{ color: 'var(--accent-cyan)', border: 'none', background: 'transparent' }}>
                        {lv.leaveType?.toUpperCase() || "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.7rem' }}>{lv.dayType?.toUpperCase() || "—"}</td>
                    <td className={isPending ? "highlight-bad mono" : "highlight-ok mono"} style={{ fontWeight: 700 }}>
                      {lv.status?.toUpperCase() || "—"}
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
