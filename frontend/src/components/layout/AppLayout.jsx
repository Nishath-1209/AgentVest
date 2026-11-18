import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Toast from "./Toast";
import { api } from "../../services/api";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("agentvest_sidebar_collapsed") === "true";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [health, setHealth] = useState("Checking...");
  const location = useLocation();

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem("agentvest_sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  // Health check polling
  useEffect(() => {
    const controller = new AbortController();
    api
      .checkHealth(controller.signal)
      .then((data) => {
        setHealth(data?.status === "ok" ? "Connected" : "Unexpected response");
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setHealth("Offline");
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Persistent Sidebar */}
      <div className={`sidebar-wrapper ${mobileNavOpen ? "mobile-open" : ""}`}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          health={health}
        />
      </div>

      {/* Main Content Area */}
      <div className="main-viewport">
        <Topbar onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)} />
        <main className="content-container">
          <Outlet />
        </main>
        <footer className="app-footer">
          <div className="footer-content">
            <span>
              AgentVest v1.0.0 · Multi-Agent Investment Research Platform
            </span>
            <span>
              Academic Demonstration & Research Use Only · Not Financial Advice
            </span>
          </div>
        </footer>
      </div>

      {/* Global Toast Outlet */}
      <Toast />
    </div>
  );
}
