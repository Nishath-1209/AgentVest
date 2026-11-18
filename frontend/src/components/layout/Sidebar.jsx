import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Newspaper,
  FileText,
  BrainCircuit,
  Bookmark,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/stocks", label: "Stock Analysis", icon: TrendingUp },
  { to: "/news", label: "News Intelligence", icon: Newspaper },
  { to: "/reports", label: "Report Research", icon: FileText },
  { to: "/advisor", label: "AI Advisor", icon: BrainCircuit, badge: "Flagship" },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/history", label: "Research History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, health }) {
  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <NavLink to="/" className="sidebar-logo">
          <div className="brand-icon-box">
            <Activity size={22} className="brand-accent" />
          </div>
          {!collapsed && (
            <div className="brand-text-group">
              <span className="brand-title">
                Agent<span className="brand-accent">Vest</span>
              </span>
              <span className="brand-badge">Multi-Agent AI</span>
            </div>
          )}
        </NavLink>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <ul>
          {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={20} className="nav-icon" />
                {!collapsed && (
                  <>
                    <span className="nav-label">{label}</span>
                    {badge && <span className="nav-badge">{badge}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer with System Health */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="health-card">
            <div className="health-header">
              <Shield size={14} className="health-shield-icon" />
              <span>Backend Core</span>
              <span
                className={`health-dot ${
                  health === "Connected" ? "online" : "offline"
                }`}
              />
            </div>
            <span className="health-status-text">
              {health === "Connected" ? "FastAPI Online" : health}
            </span>
          </div>
        ) : (
          <div
            className={`collapsed-health-dot ${
              health === "Connected" ? "online" : "offline"
            }`}
            title={`Backend: ${health}`}
          />
        )}
      </div>
    </aside>
  );
}
