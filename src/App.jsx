import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import ActionCenter from "./components/ActionCenter";
import TimeLogsTable from "./components/TimeLogsTable";
import BreakLogsTable from "./components/BreakLogsTable";
import LeavesTable from "./components/LeavesTable";
import "./index.css";

const NAV_ITEMS = [
  { id: "action", label: "Action Center", icon: "🚨", section: "AUDIT" },
  { id: "timelogs", label: "Time Logs", icon: "⏰", section: "RAW DATA" },
  { id: "breaklogs", label: "Break Logs", icon: "☕", section: "RAW DATA" },
  { id: "leaves", label: "Leaves", icon: "🌿", section: "RAW DATA" },
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
      {/* ── Top Navigation ── */}
      <nav className="top-nav">
        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.id === "action" && openHighCount > 0 && (
                <span className="nav-badge">{openHighCount}</span>
              )}
            </button>
          ))}
        </div>
        
        <div className="live-status">
          <span className="live-dot" />
          Real-time Sync Active
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="main-wrapper">
        <div className="content-container">
          
          {/* Header Box */}
          <header className="header-box">
            <div className="header-text">
              <h1>HEIST // {pageTitle.label}</h1>
              <p>{pageTitle.sub}</p>
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
                <div className="stat-label">🔴 High Severity</div>
                <div className="stat-sub">Critical violations</div>
              </div>
              <div className="stat-card medium">
                <div className="stat-value">{stats?.mediumSeverity ?? "—"}</div>
                <div className="stat-label">🟡 Medium Severity</div>
                <div className="stat-sub">Needs verification</div>
              </div>
              <div className="stat-card neutral">
                <div className="stat-value">{stats?.totalExceptions ?? "—"}</div>
                <div className="stat-label">📋 Total Open</div>
                <div className="stat-sub">Unresolved exceptions</div>
              </div>
              <div className="stat-card resolved">
                <div className="stat-value">{stats?.resolved ?? "—"}</div>
                <div className="stat-label">✓ Resolved</div>
                <div className="stat-sub">Cleared by QC</div>
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
