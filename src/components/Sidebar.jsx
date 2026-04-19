export default function Sidebar({ activeTab, setActiveTab, stats }) {
  const sections = [
    {
      label: "Main",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "◫" },
        { id: "action", label: "Needs Action", icon: "⚑", badge: stats?.totalOpen },
      ],
    },
    {
      label: "Data",
      items: [
        { id: "timelogs", label: "Time Logs", icon: "◷" },
        { id: "breaklogs", label: "Break Logs", icon: "◑" },
        { id: "leaves", label: "Leaves", icon: "☰" },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>WF Heist</h2>
        <span>Workforce Analytics</span>
      </div>

      {sections.map((section) => (
        <div className="sidebar-section" key={section.label}>
          <div className="sidebar-section-label">{section.label}</div>
          {section.items.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
              {item.badge > 0 && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}
