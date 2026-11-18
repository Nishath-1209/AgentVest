import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorAlert({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="error-alert" role="alert">
      <div className="error-alert-content">
        <AlertTriangle size={20} className="error-icon" />
        <span className="error-text">{message}</span>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-retry">
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
