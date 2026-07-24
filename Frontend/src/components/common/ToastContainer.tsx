import { useEffect, useState } from "react";
import { toast, type ToastMessage } from "../../utils/toast";

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);
    });
    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-[90%] sm:w-full pointer-events-none">
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onClose={() => removeToast(item.id)} />
      ))}
    </div>
  );
}

function ToastItem({ item, onClose }: { item: ToastMessage; onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false);

  const duration = item.duration || 5000;

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getStyle = () => {
    switch (item.type) {
      case "success":
        return {
          icon: "check_circle",
          bgColor: "bg-emerald-500",
          iconBg: "bg-emerald-100 text-emerald-600",
          border: "border-emerald-200",
        };
      case "error":
        return {
          icon: "cancel",
          bgColor: "bg-red-500",
          iconBg: "bg-red-100 text-red-600",
          border: "border-red-200",
        };
      case "warning":
        return {
          icon: "warning",
          bgColor: "bg-amber-500",
          iconBg: "bg-amber-100 text-amber-600",
          border: "border-amber-200",
        };
      case "info":
      default:
        return {
          icon: "info",
          bgColor: "bg-blue-500",
          iconBg: "bg-blue-100 text-blue-600",
          border: "border-blue-200",
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`pointer-events-auto bg-white rounded-2xl border ${style.border} shadow-2xl p-4 transition-all duration-300 relative overflow-hidden flex items-start gap-3 transform ${
        isClosing ? "translate-x-full opacity-0" : "translate-x-0 opacity-100 animate-in slide-in-from-right-full"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
        <span className="material-symbols-outlined text-2xl font-bold">{style.icon}</span>
      </div>

      <div className="flex-1 min-w-0 pr-6">
        {item.title && <h4 className="text-sm font-bold text-gray-900 mb-0.5">{item.title}</h4>}
        <p className="text-xs text-gray-600 leading-relaxed break-words">{item.message}</p>
      </div>

      <button
        onClick={handleClose}
        type="button"
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>

      {/* Progress Bar Timer */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
        <div
          className={`h-full ${style.bgColor}`}
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
