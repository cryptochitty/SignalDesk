import React, { useState, useEffect } from "react";
import {
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  History,
  Volume2,
  Activity,
  Target,
  TrendingUp,
  TrendingDown,
  Percent,
  Smartphone,
  Share2,
  MessageSquare,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ToastAlert } from "../types";
import { MobileShareModal } from "./MobileShareModal";

interface PriceThresholdCardProps {
  stockSymbol: string;
  companyName: string;
  currency: string;
  currentPrice: number;
  predictedPrice: number | undefined;
  chartData?: Array<{
    date: string;
    actualClose?: number;
    forecastPrice?: number;
    ma?: number;
  }>;
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
  chartData,
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
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);

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

  const resetToPredictedPrice = () => {
    if (predictedPrice) {
      const newPrice = parseFloat(predictedPrice.toFixed(2));
      onTargetPriceChange(newPrice);
      setInputVal(newPrice.toString());
    }
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

  // Current price proximity to target price
  const priceDiffFromTarget = targetPrice > 0 ? currentPrice - targetPrice : 0;
  const pctProximity =
    targetPrice > 0 ? ((currentPrice - targetPrice) / targetPrice) * 100 : 0;
  const absPctDistance = Math.abs(pctProximity);

  // Proximity status categorization
  const isTriggerImminent = absPctDistance <= 1.0;
  const isTriggerClose = absPctDistance <= 3.0;

  const pctDiffFromTarget =
    predictedPrice && targetPrice > 0
      ? (((predictedPrice - targetPrice) / targetPrice) * 100).toFixed(2)
      : "0.00";

  // Prepare mini-chart dataset: recent 15-20 data points from chartData or fallback synthetic trend
  const miniChartData = React.useMemo(() => {
    if (chartData && chartData.length > 0) {
      const recent = chartData.slice(-18);
      return recent.map((d) => ({
        date: d.date,
        price: d.actualClose ?? d.forecastPrice ?? currentPrice,
        forecast: d.forecastPrice,
        target: targetPrice,
      }));
    }

    // Synthetic fallback if no chartData
    const points = [];
    const base = currentPrice || 100;
    for (let i = 12; i >= 0; i--) {
      const variance = (Math.sin(i * 0.8) * 0.02 - (i / 12) * 0.015) * base;
      const p = parseFloat((base - variance).toFixed(2));
      points.push({
        date: `T-${i}`,
        price: p,
        forecast: i === 0 ? predictedPrice : undefined,
        target: targetPrice,
      });
    }
    return points;
  }, [chartData, currentPrice, predictedPrice, targetPrice]);

  const allChartPrices = miniChartData.map((d) => d.price).concat([targetPrice]);
  if (predictedPrice) allChartPrices.push(predictedPrice);
  const minChartY = Math.floor(Math.min(...allChartPrices) * 0.985);
  const maxChartY = Math.ceil(Math.max(...allChartPrices) * 1.015);

  return (
    <div id="price-threshold-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
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

      {/* Mini-Chart: Price Path Relative to Target Price & Proximity Radar */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-500/20 text-indigo-400">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200">
                Historical Price Path vs Target Threshold
              </span>
              <span className="text-[11px] text-slate-400 ml-2">
                (Target Line: <strong className="font-mono text-amber-400">{currency}{targetPrice.toFixed(2)}</strong>)
              </span>
            </div>
          </div>

          {/* Proximity Pill */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                isTriggerImminent
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                  : isTriggerClose
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>
                Proximity:{" "}
                <strong className="font-mono">
                  {priceDiffFromTarget >= 0 ? "+" : ""}
                  {currency}
                  {Math.abs(priceDiffFromTarget).toFixed(2)} ({pctProximity >= 0 ? "+" : ""}
                  {pctProximity.toFixed(2)}%)
                </strong>
              </span>
              {isTriggerImminent && (
                <span className="ml-1 bg-rose-500 text-slate-950 font-extrabold text-[9px] px-1 py-0.2 rounded uppercase">
                  Imminent
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Recharts Mini-Chart Container */}
        <div className="w-full h-36 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={miniChartData} margin={{ top: 8, right: 12, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="pricePathGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                stroke="#475569"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
              />
              <YAxis
                domain={[minChartY, maxChartY]}
                stroke="#475569"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                tickFormatter={(v) => `${currency}${v}`}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
                orientation="right"
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const pt = payload[0]?.payload;
                  const price = pt?.price;
                  const target = targetPrice;
                  const diff = price !== undefined ? price - target : 0;
                  const diffPct = target > 0 ? (diff / target) * 100 : 0;

                  return (
                    <div className="bg-slate-950 border border-slate-700 p-2 rounded-lg shadow-xl text-xs space-y-1 min-w-[160px]">
                      <p className="font-semibold text-slate-300 border-b border-slate-800 pb-0.5">{label}</p>
                      <div className="flex justify-between items-center text-slate-200">
                        <span>Price:</span>
                        <span className="font-mono font-bold text-indigo-400">{currency}{price?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-amber-300">
                        <span>Target Threshold:</span>
                        <span className="font-mono font-bold">{currency}{target.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[11px]">
                        <span className="text-slate-400">Distance to Target:</span>
                        <span className={`font-mono font-bold ${diff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {diff >= 0 ? "+" : ""}{currency}{diff.toFixed(2)} ({diffPct >= 0 ? "+" : ""}{diffPct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  );
                }}
              />

              {/* Threshold Target Reference Line */}
              <ReferenceLine
                y={targetPrice}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `Target: ${currency}${targetPrice.toFixed(2)}`,
                  position: "insideTopLeft",
                  fill: "#FBBF24",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />

              {/* Historical Price Area */}
              <Area
                type="monotone"
                dataKey="price"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#pricePathGradient)"
                name="Price Path"
                dot={{ r: 2, fill: "#818CF8" }}
                activeDot={{ r: 5, fill: "#C7D2FE" }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Distance summary strip */}
        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/60">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
            Current Stock Price: <strong className="text-slate-200">{currency}{currentPrice.toFixed(2)}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-amber-400 inline-block"></span>
            Threshold Target: <strong className="text-amber-400">{currency}{targetPrice.toFixed(2)}</strong>
          </span>
          {predictedPrice && (
            <span className="flex items-center gap-1">
              AI Forecast: <strong className="text-indigo-300 font-mono">{currency}{predictedPrice.toFixed(2)}</strong>
            </span>
          )}
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
            {predictedPrice && (
              <button
                type="button"
                onClick={resetToPredictedPrice}
                className="text-[10px] font-mono bg-emerald-950 hover:bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/80 transition-colors flex items-center gap-1 font-bold"
                title="Set threshold target directly to AI Predicted Price"
              >
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                AI Pred ({currency}{predictedPrice.toFixed(2)})
              </button>
            )}
            <button
              type="button"
              onClick={resetToCurrentPrice}
              className="text-[10px] font-mono bg-indigo-950 hover:bg-indigo-900 text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-700 transition-colors flex items-center gap-1"
              title="Reset threshold target to current stock price"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              LTP ({currency}{currentPrice.toFixed(2)})
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileModalOpen(true)}
              className="w-1/2 py-1.5 px-3 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-emerald-950/40"
              title="Send Alert & Prediction to WhatsApp / SMS"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Send to Mobile</span>
            </button>

            <button
              type="button"
              onClick={onTriggerTestToast}
              className="w-1/2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Toast</span>
            </button>
          </div>
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

      {/* Mobile Share Modal (WhatsApp / SMS) */}
      <MobileShareModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        symbol={stockSymbol}
        companyName={companyName}
        currency={currency}
        currentPrice={currentPrice}
        targetPrice={targetPrice}
        predictionPrice={predictedPrice}
        confidencePct={88}
        signal={condition === "falls_below" ? "SELL" : "BUY"}
        exchange={currency === "$" ? "Crypto DEX (Hyperliquid)" : "NSE"}
        timeframe="Live Alert Threshold"
        catalystSummary={`Price monitor threshold: ${currency}${targetPrice.toFixed(2)} (${condition === "exceeds" ? "Upside Breakout" : "Downside Defense"}) • Forecast: ${currency}${predictedPrice?.toFixed(2) || currentPrice.toFixed(2)}`}
      />
    </div>
  );
};

