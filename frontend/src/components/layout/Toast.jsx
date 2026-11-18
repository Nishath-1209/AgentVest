import { useToast } from "../../context/ToastContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast() {
  const { toasts, dismissToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const Icon =
          toast.type === "success"
            ? CheckCircle2
            : toast.type === "error"
            ? AlertCircle
            : Info;

        return (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="alert">
            <Icon size={18} className="toast-icon" />
            <span className="toast-message">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="toast-close"
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
