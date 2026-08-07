import React, { useState, useEffect } from "react";
import { Bell, ArrowUpRight, ArrowDownRight, Sliders, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, History, Volume2 } from "lucide-react";
import { ToastAlert } from "../types";

interface PriceThresholdCardProps {
  stockSymbol: string;
  companyName: string;
  currency: string;
  currentPrice: number;
  predictedPrice: number | undefined;
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  targetPrice: number;
  onTargetPriceChange: (price: number) => void;
  condition: "exceeds" | "falls_below" | "either";
  onConditionChange: (condition: "exceeds" | "falls_below" | "either") => void;
  onTriggerTestToast: () => void;
  history: ToastAlert[];
  onClearHistory: () => void;
}

export const PriceThresholdCard: React.FC<PriceThresholdCardProps> = ({
  stockSymbol,
  companyName,
  currency,
  currentPrice,
  predictedPrice,
  enabled,
  onToggleEnabled,
  targetPrice,
  onTargetPriceChange,
  condition,
  onConditionChange,
  onTriggerTestToast,
  history,
  onClearHistory,
}) => {
  const [inputVal, setInputVal] = useState<string>(targetPrice.toString());

  // Keep input in sync with external targetPrice updates
  useEffect(() => {
    setInputVal(targetPrice.toString());
  }, [targetPrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      onTargetPriceChange(parsed);
    }
  };

  const applyQuickOffset = (pct: number) => {
    const base = currentPrice || predictedPrice || 100;
    const newPrice = parseFloat((base * (1 + pct / 100)).toFixed(2));
    onTargetPriceChange(newPrice);
    setInputVal(newPrice.toString());
  };

  const resetToCurrentPrice = () => {
    const newPrice = parseFloat((currentPrice || 100).toFixed(2));
    onTargetPriceChange(newPrice);
    setInputVal(newPrice.toString());
  };

  // Check if current prediction breaches threshold
  const isBreached =
    predictedPrice !== undefined &&
    enabled &&
    ((condition === "exceeds" && predictedPrice > targetPrice) ||
      (condition === "falls_below" && predictedPrice < targetPrice) ||
      (condition === "either" && Math.abs(predictedPrice - targetPrice) > 0.01));

  const pctDiffFromTarget =
    predictedPrice && targetPrice > 0
      ? (((predictedPrice - targetPrice) / targetPrice) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>NextClose Prediction Price Monitor</span>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                Real-Time Toast Alert
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Monitors AI forecast for <span className="font-semibold text-slate-200">{stockSymbol}</span> ({companyName}) and triggers a toast message when threshold limits are breached.
            </p>
          </div>
        </div>

        {/* Enable / Disable Toggle Switch */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
          <span className="text-xs font-medium text-slate-300">
            {enabled ? "Monitor Active" : "Monitor Paused"}
          </span>
          <button
            type="button"
            onClick={() => onToggleEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
              enabled ? "bg-emerald-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Target Price Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Target Price Threshold ({currency})</span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="text-slate-400">
                Stock Price: <strong className="text-emerald-400">{currency}{currentPrice.toFixed(2)}</strong>
              </span>
            </div>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm font-bold text-slate-400">
              {currency}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={inputVal}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              placeholder="e.g. 150.00"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            <span className="text-[10px] text-slate-500">Quick set:</span>
            <button
              type="button"
              onClick={resetToCurrentPrice}
              className="text-[10px] font-mono bg-indigo-950 hover:bg-indigo-900 text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-700 transition-colors flex items-center gap-1"
              title="Reset threshold target to current stock price"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset ({currency}{currentPrice.toFixed(2)})
            </button>
            <button
              type="button"
              onClick={() => applyQuickOffset(2)}
              className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 transition-colors"
            >
              +2%
            </button>
            <button
              type="button"
              onClick={() => applyQuickOffset(5)}
              className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 transition-colors"
            >
              +5%
            </button>
            <button
              type="button"
              onClick={() => applyQuickOffset(-2)}
              className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 transition-colors"
            >
              -2%
            </button>
            <button
              type="button"
              onClick={() => applyQuickOffset(-5)}
              className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 transition-colors"
            >
              -5%
            </button>
          </div>
        </div>

        {/* 2. Alert Condition Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Trigger Condition
          </label>
          <select
            value={condition}
            onChange={(e) =>
              onConditionChange(
                e.target.value as "exceeds" | "falls_below" | "either"
              )
            }
            className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
          >
            <option value="exceeds">📈 Exceeds Target Price (&gt; threshold)</option>
            <option value="falls_below">📉 Falls Below Target Price (&lt; threshold)</option>
            <option value="either">⚡ Any Deviation Boundary</option>
          </select>
          <p className="text-[10px] text-slate-400">
            {condition === "exceeds"
              ? "Toast triggers when predicted price goes above target."
              : condition === "falls_below"
              ? "Toast triggers when predicted price drops below target."
              : "Toast triggers whenever predicted price passes the target."}
          </p>
        </div>

        {/* 3. Live Threshold Status & Test Trigger */}
        <div className="space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300">
              Live Monitor Status
            </span>
            <div
              className={`mt-1.5 p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between ${
                !enabled
                  ? "bg-slate-950 border-slate-800 text-slate-400"
                  : isBreached
                  ? condition === "exceeds"
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/60 border-rose-500/40 text-rose-300"
                  : "bg-indigo-950/40 border-indigo-500/30 text-indigo-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {isBreached ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>
                  {!enabled
                    ? "Monitoring disabled"
                    : isBreached
                    ? `ALERT BREACH: ${pctDiffFromTarget}% diff!`
                    : "Within safe threshold bounds"}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold">
                {currency}{targetPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onTriggerTestToast}
            className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Toast Notification</span>
          </button>
        </div>
      </div>

      {/* Alert History Section */}
      {history.length > 0 && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              Recent Triggered Price Alerts ({history.length})
            </h4>
            <button
              onClick={onClearHistory}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear Log
            </button>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs font-mono">
            {history.slice(0, 5).map((h) => (
              <div
                key={h.id}
                className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-slate-300"
              >
                <div className="flex items-center gap-2">
                  {h.type === "exceeded" ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-bold text-white">{h.symbol}</span>
                  <span className="text-slate-400 text-[11px]">{h.title}</span>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-indigo-300 font-bold">
                    {h.currency}{h.predictedPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {h.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
