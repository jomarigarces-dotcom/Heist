import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import ActionCenter from "./components/ActionCenter";
import TimeLogsTable from "./components/TimeLogsTable";
import BreakLogsTable from "./components/BreakLogsTable";
import LeavesTable from "./components/LeavesTable";
import "./index.css";

const NAV_ITEMS = [
  { id: "action", label: "ACTION-CENTER", icon: "ALRT", section: "AUDIT" },
  { id: "timelogs", label: "DATA-TIME", icon: "TLOG", section: "RAW DATA" },
  { id: "breaklogs", label: "DATA-BREAK", icon: "BLOG", section: "RAW DATA" },
  { id: "leaves", label: "DATA-LEAVES", icon: "LEVE", section: "RAW DATA" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("action");
  const [filterAccount, setFilterAccount] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("OPEN");
  const [filterDate, setFilterDate] = useState("");

  const stats = useQuery(api.queries.getStats, {});
  const accounts = useQuery(api.queries.listAccounts, {});
  const exceptions = useQuery(api.queries.listExceptions, {
    account: "ALL",
    status: "OPEN",
  });
  const openHighCount = exceptions?.filter((e) => e.severity === "HIGH").length ?? 0;

  const pageTitle = {
    action: { label: "Action Center", sub: "Flagged exceptions requiring QC review" },
    timelogs: { label: "Time Logs", sub: "Raw attendance records from Zoho" },
    breaklogs: { label: "Break Logs", sub: "Break & clinic records from Zoho" },
    leaves: { label: "Leaves", sub: "Leave applications & statuses" },
  }[activeTab];

  return (
    <div className="app-layout">
      {/* ── Project Tactical: Radar Background ── */}
      <div className="radar-background">
        <div className="sonar-ring" />
        <div className="sonar-ring" />
        <div className="sonar-ring" />
        <div className="radar-grid" />
      </div>

      {/* ── Top Navigation ── */}
      <nav className="top-nav">
        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={{ fontSize: '0.6rem', opacity: 0.5, marginRight: '4px' }}>[{item.icon}]</span>
              {item.label}
              {item.id === "action" && openHighCount > 0 && (
                <span className="nav-badge">{openHighCount}</span>
              )}
            </button>
          ))}
        </div>
        
        <div className="live-status">
          <span className="live-dot" />
          RADAR ACTIVE // {new Date().toLocaleTimeString()}
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="main-wrapper">
        <div className="content-container">
          
          {/* Header Box */}
          <header className="header-box">
            <div className="header-text">
              <h1>HEIST COMMAND // {pageTitle.label.toUpperCase()}</h1>
              <p>{pageTitle.sub.toUpperCase()}</p>
            </div>
          </header>

          {/* Filters */}
          <div className="filters-bar">
            <span className="filter-label">Account:</span>
            <select
              className="filter-select"
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
            >
              <option value="ALL">All Accounts</option>
              {(accounts ?? []).map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>

            {activeTab === "action" && (
              <>
                <span className="filter-label">Status:</span>
                <select
                  className="filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="OPEN">Open Only</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </>
            )}

            {(activeTab === "timelogs" || activeTab === "breaklogs") && (
              <>
                <span className="filter-label">Date:</span>
                <input
                  type="date"
                  className="filter-input"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                {filterDate && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setFilterDate("")}
                  >
                    ✕ Clear
                  </button>
                )}
              </>
            )}
          </div>

          {/* Stats (only on action center) */}
          {activeTab === "action" && (
            <div className="stats-grid">
              <div className="stat-card high">
                <div className="stat-value">{stats?.highSeverity ?? "—"}</div>
                <div className="stat-label">HIGH-SEVERITY-ANOMALIES</div>
                <div className="stat-sub">CRITICAL VIOLATIONS DETECTED</div>
              </div>
              <div className="stat-card medium">
                <div className="stat-value">{stats?.mediumSeverity ?? "—"}</div>
                <div className="stat-label">MODERATE-ANOMALIES</div>
                <div className="stat-sub">VERIFICATION REQUIRED</div>
              </div>
              <div className="stat-card neutral">
                <div className="stat-value">{stats?.totalExceptions ?? "—"}</div>
                <div className="stat-label">ACTIVE-TASKS</div>
                <div className="stat-sub">UNRESOLVED QUEUE</div>
              </div>
              <div className="stat-card resolved">
                <div className="stat-value">{stats?.resolved ?? "—"}</div>
                <div className="stat-label">UNIT-STABLE</div>
                <div className="stat-sub">CLEARED BY CONTROL</div>
              </div>
            </div>
          )}

          {/* Page Content */}
          <main>
            {activeTab === "action" && (stats?.totalTimeLogs ?? 0) === 0 && (
              <div className="banner" style={{ marginBottom: '20px' }}>
                ℹ️ No data ingested yet. Run the Heist Extractor to POST Zoho data.
              </div>
            )}

            {activeTab === "action" && (
              <ActionCenter account={filterAccount} status={filterStatus} />
            )}
            {activeTab === "timelogs" && (
              <TimeLogsTable account={filterAccount} date={filterDate || undefined} />
            )}
            {activeTab === "breaklogs" && (
              <BreakLogsTable account={filterAccount} date={filterDate || undefined} />
            )}
            {activeTab === "leaves" && <LeavesTable account={filterAccount} />}
          </main>
        </div>
      </div>
    </div>
  );
}
