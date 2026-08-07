import React from "react";
import { Bell, ArrowUpRight, ArrowDownRight, X, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { ToastAlert } from "../types";

interface PriceAlertToastContainerProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export const PriceAlertToastContainer: React.FC<PriceAlertToastContainerProps> = ({
  toasts,
  onDismiss,
  onClearAll,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 space-y-3 pointer-events-none">
      {toasts.map((toast) => {
        const isExceeded = toast.type === "exceeded";
        const isDropped = toast.type === "dropped";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all transform animate-in slide-in-from-bottom-5 duration-300 ${
              isExceeded
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50"
                : isDropped
                ? "bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50"
                : "bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-indigo-950/50"
            }`}
          >
            {/* Icon Badge */}
            <div
              className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
                isExceeded
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ring-2 ring-emerald-500/10"
                  : isDropped
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 ring-2 ring-rose-500/10"
                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              }`}
            >
              {isExceeded ? (
                <ArrowUpRight className="w-6 h-6 animate-bounce" />
              ) : isDropped ? (
                <ArrowDownRight className="w-6 h-6 animate-bounce" />
              ) : (
                <Bell className="w-6 h-6" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/10 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {toast.symbol} ALERT
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {toast.timestamp}
                </span>
              </div>

              <h4 className="text-sm font-bold mt-1 text-white leading-tight">
                {toast.title}
              </h4>

              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {toast.message}
              </p>

              {/* Price comparison detail tag */}
              <div className="mt-2 flex items-center gap-3 text-xs font-mono pt-2 border-t border-white/10">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">Predicted Next Close:</span>
                  <span className="font-bold text-white bg-slate-950/60 px-2 py-0.5 rounded border border-white/10">
                    {toast.currency}{toast.predictedPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">Target Threshold:</span>
                  <span className="font-medium text-slate-300">
                    {toast.currency}{toast.targetThreshold.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {toasts.length > 1 && (
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={onClearAll}
            className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900/90 border border-slate-700 px-3 py-1 rounded-lg shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            Clear All Notifications ({toasts.length})
          </button>
        </div>
      )}
    </div>
  );
};
