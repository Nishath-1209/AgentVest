import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { WatchlistProvider } from "./context/WatchlistContext";

import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import StockAnalysisPage from "./pages/StockAnalysisPage";
import NewsIntelligencePage from "./pages/NewsIntelligencePage";
import ReportsResearchPage from "./pages/ReportsResearchPage";
import AdvisorPage from "./pages/AdvisorPage";
import WatchlistPage from "./pages/WatchlistPage";
import ResearchHistoryPage from "./pages/ResearchHistoryPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <WatchlistProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="stocks" element={<StockAnalysisPage />} />
                <Route path="news" element={<NewsIntelligencePage />} />
                <Route path="reports" element={<ReportsResearchPage />} />
                <Route path="advisor" element={<AdvisorPage />} />
                <Route path="watchlist" element={<WatchlistPage />} />
                <Route path="history" element={<ResearchHistoryPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </WatchlistProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
