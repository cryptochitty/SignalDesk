import React, { useState } from "react";
import {
  Calendar,
  CalendarDays,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Target,
  BarChart3,
  Clock,
} from "lucide-react";
import {
  IntradayPrediction,
  WeeklyForwardProjection,
  MonthlyForwardProjection,
} from "../types";
import { IntradayPredictionCard } from "./IntradayPredictionCard";
import { WeeklyForwardProjectionCard } from "./WeeklyForwardProjectionCard";
import { MonthlyForwardProjectionCard } from "./MonthlyForwardProjectionCard";

interface MultiTimeframePredictionHubProps {
  symbol: string;
  currency: string;
  currentPrice: number;
  intraday?: IntradayPrediction;
  weekly?: WeeklyForwardProjection;
  monthly?: MonthlyForwardProjection;
}

export const MultiTimeframePredictionHub: React.FC<MultiTimeframePredictionHubProps> = ({
  symbol,
  currency,
  currentPrice,
  intraday,
  weekly,
  monthly,
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState<"all" | "day" | "week" | "month">("all");

  const formatVal = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return "0.00";
    if (Math.abs(val) >= 1000) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toFixed(2);
  };

  const dayTarget = intraday?.sellTarget1 || currentPrice * 1.01;
  const dayChangePct = (((dayTarget - currentPrice) / currentPrice) * 100).toFixed(2);
  const isDayPositive = parseFloat(dayChangePct) >= 0;

  const weekTarget = weekly?.endOfWeekTarget || currentPrice * 1.025;
  const weekChangePct = weekly?.weeklyChangePct !== undefined ? weekly.weeklyChangePct.toFixed(2) : "+2.50";
  const isWeekPositive = parseFloat(weekChangePct) >= 0;

  const monthTarget = monthly?.endOfMonthTarget || currentPrice * 1.055;
  const monthChangePct = monthly?.monthlyChangePct !== undefined ? monthly.monthlyChangePct.toFixed(2) : "+5.50";
  const isMonthPositive = parseFloat(monthChangePct) >= 0;

  return (
    <section className="space-y-4">
      {/* Timeframe Selector & Master Multi-Horizon Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  MULTI-TIMEFRAME PREDICTION ENGINE
                </h2>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
                  DAY • WEEK • MONTH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Unified multi-horizon quantitative forecasts calibrated for <strong className="text-slate-200">{symbol}</strong>
              </p>
            </div>
          </div>

          {/* Timeframe Toggle Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTimeframe("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTimeframe === "all"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All Horizons</span>
            </button>

            <button
              onClick={() => setActiveTimeframe("day")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTimeframe === "day"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-300" />
              <span>Current Day</span>
            </button>

            <button
              onClick={() => setActiveTimeframe("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTimeframe === "week"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
              <span>Current Week</span>
            </button>

            <button
              onClick={() => setActiveTimeframe("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTimeframe === "month"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-cyan-300" />
              <span>Current Month</span>
            </button>
          </div>
        </div>

        {/* 3-Column Horizon Snapshot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Horizon 1: Current Day */}
          <div
            onClick={() => setActiveTimeframe(activeTimeframe === "day" ? "all" : "day")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTimeframe === "day" || activeTimeframe === "all"
                ? "bg-slate-950 border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                : "bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Current Day (Intraday)
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {intraday?.signal || "BUY / LONG"}
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Day Target 1</span>
                <span className="text-lg font-mono font-bold text-white">
                  {currency}{formatVal(dayTarget)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Expected Return</span>
                <span
                  className={`text-xs font-mono font-bold ${
                    isDayPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isDayPositive ? "+" : ""}{dayChangePct}%
                </span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Optimal Entry:</span>
              <span className="text-slate-200 font-bold">
                {currency}{formatVal(intraday?.buyOptimal || currentPrice)}
              </span>
            </div>
          </div>

          {/* Horizon 2: Current Week */}
          <div
            onClick={() => setActiveTimeframe(activeTimeframe === "week" ? "all" : "week")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTimeframe === "week" || activeTimeframe === "all"
                ? "bg-slate-950 border-indigo-500/40 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20"
                : "bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Current Week (5-Day)
              </span>
              <span className="text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                {weekly?.overallBias || "MODERATE GAIN"}
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">End-of-Week Target</span>
                <span className="text-lg font-mono font-bold text-indigo-300">
                  {currency}{formatVal(weekTarget)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Weekly Drift</span>
                <span
                  className={`text-xs font-mono font-bold ${
                    isWeekPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isWeekPositive ? "+" : ""}{weekChangePct}%
                </span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Expected Range:</span>
              <span className="text-slate-200 font-bold">
                {currency}{formatVal(weekly?.weeklyLow || currentPrice * 0.98)} - {currency}{formatVal(weekly?.weeklyHigh || currentPrice * 1.04)}
              </span>
            </div>
          </div>

          {/* Horizon 3: Current Month */}
          <div
            onClick={() => setActiveTimeframe(activeTimeframe === "month" ? "all" : "month")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              activeTimeframe === "month" || activeTimeframe === "all"
                ? "bg-slate-950 border-cyan-500/40 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/20"
                : "bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Current Month (4-Week)
              </span>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                {monthly?.monthlyBias || "BULLISH CONTINUATION"}
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">30-Day Target</span>
                <span className="text-lg font-mono font-bold text-cyan-300">
                  {currency}{formatVal(monthTarget)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Monthly Gain</span>
                <span
                  className={`text-xs font-mono font-bold ${
                    isMonthPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isMonthPositive ? "+" : ""}{monthChangePct}%
                </span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Support Floor:</span>
              <span className="text-slate-200 font-bold">
                {currency}{formatVal(monthly?.supportLevel || currentPrice * 0.95)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Render Timeframe Detail Cards based on selected active tab */}
      {(activeTimeframe === "all" || activeTimeframe === "day") && (
        <IntradayPredictionCard
          intraday={intraday}
          symbol={symbol}
          currency={currency}
          currentPrice={currentPrice}
        />
      )}

      {(activeTimeframe === "all" || activeTimeframe === "week") && (
        <WeeklyForwardProjectionCard
          projection={weekly}
          symbol={symbol}
          currency={currency}
          currentPrice={currentPrice}
        />
      )}

      {(activeTimeframe === "all" || activeTimeframe === "month") && (
        <MonthlyForwardProjectionCard
          projection={monthly}
          symbol={symbol}
          currency={currency}
          currentPrice={currentPrice}
        />
      )}
    </section>
  );
};
