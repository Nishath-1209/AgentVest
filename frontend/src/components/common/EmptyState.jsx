import { Search, FolderSearch, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyState({
  icon: Icon = FolderSearch,
  title = "No Data Found",
  description = "Get started by searching a stock ticker or running an analysis.",
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={36} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-action">
          <span>{actionLabel}</span>
          <ArrowRight size={16} />
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button type="button" onClick={onAction} className="btn-action">
          <span>{actionLabel}</span>
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
