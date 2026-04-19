import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Sidebar from "./components/Sidebar";
import DashboardMetrics from "./components/DashboardMetrics";
import ActionCenter from "./components/ActionCenter";
import TimeLogsTable from "./components/TimeLogsTable";
import BreakLogsTable from "./components/BreakLogsTable";
import LeavesTable from "./components/LeavesTable";
import "./index.css";

const PAGE_CONFIG = {
  dashboard: { title: "Dashboard", sub: "Workforce analytics overview" },
  action: { title: "Needs Action", sub: "Flagged exceptions requiring review" },
  timelogs: { title: "Time Logs", sub: "Raw attendance records from Zoho" },
  breaklogs: { title: "Break Logs", sub: "Break & clinic records from Zoho" },
  leaves: { title: "Leaves", sub: "Leave applications & statuses" },
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterAccount, setFilterAccount] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("OPEN");
  const [filterDate, setFilterDate] = useState("");
  const [activeRule, setActiveRule] = useState(null);

  const stats = useQuery(api.queries.getStats, { account: filterAccount });
  const accounts = useQuery(api.queries.listAccounts, {});
  const sync = useQuery(api.queries.getSyncStatus, {});

  const page = PAGE_CONFIG[activeTab] || PAGE_CONFIG.dashboard;

  // When switching tabs away from dashboard, clear the rule filter
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== "dashboard" && tab !== "action") {
      setActiveRule(null);
    }
  };

  // When clicking a metric card, switch to action tab & set filter
  const handleRuleClick = (rules) => {
    if (rules) {
      setActiveRule(rules);
      setActiveTab("action");
    } else {
      setActiveRule(null);
    }
  };

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} stats={stats} />

      {/* ── Main Area ── */}
      <div className="main-area">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <div>
              <h1>{page.title}</h1>
              <p>{page.sub}</p>
            </div>
          </div>

          <div className="topbar-right">
            {/* Filters */}
            <div className="topbar-filter">
              <label>Account</label>
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
              >
                <option value="ALL">All Accounts</option>
                {(accounts ?? []).map((acc) => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>

            {activeTab === "action" && (
              <div className="topbar-filter">
                <label>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All</option>
                  <option value="OPEN">Open</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            )}

            {(activeTab === "timelogs" || activeTab === "breaklogs") && (
              <div className="topbar-filter">
                <label>Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                {filterDate && (
                  <button className="btn-clear" onClick={() => setFilterDate("")}>
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Sync Status */}
            <div className="sync-hud">
              <span className={`sync-dot-indicator ${sync?.status?.toLowerCase() || ""}`} />
              <span>
                {sync?.lastSync
                  ? `Synced ${new Date(sync.lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "No sync yet"}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="content">
          {/* Dashboard view: Metrics + Action Center */}
          {activeTab === "dashboard" && (
            <>
              <DashboardMetrics
                stats={stats}
                activeRule={activeRule}
                onRuleClick={handleRuleClick}
              />

              {(stats?.totalTimeLogs ?? 0) === 0 && (
                <div className="banner" style={{ marginBottom: "20px" }}>
                  ℹ No data ingested yet. Run the Heist Extractor to pull Zoho data.
                </div>
              )}
            </>
          )}

          {/* Action Center */}
          {activeTab === "action" && (
            <>
              {activeRule && (
                <div style={{ marginBottom: "12px" }}>
                  <button className="btn btn-sm" onClick={() => setActiveRule(null)}>
                    ✕ Clear Filter
                  </button>
                </div>
              )}
              <ActionCenter
                account={filterAccount}
                status={filterStatus}
                ruleFilter={activeRule}
              />
            </>
          )}

          {/* Data Views */}
          {activeTab === "timelogs" && (
            <TimeLogsTable account={filterAccount} date={filterDate || undefined} />
          )}
          {activeTab === "breaklogs" && (
            <BreakLogsTable account={filterAccount} date={filterDate || undefined} />
          )}
          {activeTab === "leaves" && <LeavesTable account={filterAccount} />}
        </div>
      </div>
    </div>
  );
}
