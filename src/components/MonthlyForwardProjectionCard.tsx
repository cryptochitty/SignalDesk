import React from "react";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Layers,
  BarChart3,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  Compass,
  Zap,
} from "lucide-react";
import { MonthlyForwardProjection } from "../types";

interface MonthlyForwardProjectionCardProps {
  projection?: MonthlyForwardProjection;
  symbol: string;
  currency: string;
  currentPrice: number;
}

export const MonthlyForwardProjectionCard: React.FC<MonthlyForwardProjectionCardProps> = ({
  projection,
  symbol,
  currency,
  currentPrice,
}) => {
  if (!projection) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-slate-400">
        1-Month Forward Horizon projection loading for {symbol}...
      </div>
    );
  }

  const formatVal = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return "0.00";
    if (Math.abs(val) >= 1000) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toFixed(2);
  };

  const isPositiveMonthly = projection.monthlyChangePct >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background Glow */}
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none ${
          isPositiveMonthly ? "bg-cyan-500" : "bg-rose-500"
        }`}
      />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border bg-cyan-500/10 border-cyan-500/20 text-cyan-400">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1-MONTH MACRO FORWARD PROJECTION
              </h3>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20">
                4-WEEK HORIZON
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-week macro drift, quantitative momentum trajectory & support/resistance boundaries for <strong className="text-slate-200">{symbol}</strong>
            </p>
          </div>
        </div>

        {/* Monthly Target & Bias Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
              isPositiveMonthly
                ? "bg-cyan-500 text-slate-950 shadow-cyan-500/20"
                : "bg-rose-500 text-slate-950 shadow-rose-500/20"
            }`}
          >
            {isPositiveMonthly ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{projection.monthlyBias}</span>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">30-Day Confidence</span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {projection.monthlyConfidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            Current Price
          </span>
          <span className="text-base sm:text-lg font-mono font-bold text-white">
            {currency}{formatVal(projection.startPrice)}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Current Baseline</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/30 space-y-1 bg-cyan-950/10">
          <span className="text-[10px] font-bold text-cyan-400 uppercase block">
            End-of-Month Target
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-mono font-black text-cyan-300">
              {currency}{formatVal(projection.endOfMonthTarget)}
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                isPositiveMonthly ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositiveMonthly ? "+" : ""}
              {formatVal(projection.monthlyChangePct)}%
            </span>
          </div>
          <span className="text-[10px] text-cyan-300/70 block">Target at Week 4</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            1-Month Range High
          </span>
          <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">
            {currency}{formatVal(projection.monthlyHigh)}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Macro Ceiling</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            1-Month Support Floor
          </span>
          <span className="text-base sm:text-lg font-mono font-bold text-rose-400">
            {currency}{formatVal(projection.supportLevel)}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Structural Defense</span>
        </div>
      </div>

      {/* 4-Week Macro Pathway Progression */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            4-Week Forward Milestone Pathway
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            Target Horizon: 30 Calendar Days
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {projection.weeklyBreakdowns.map((wk) => {
            const isWeekPos = wk.weeklyChangePct >= 0;
            return (
              <div
                key={wk.weekNumber}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 hover:border-cyan-500/40 transition-all space-y-2.5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      Week {wk.weekNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        wk.trendSignal.includes("BULLISH")
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                          : wk.trendSignal === "BEARISH"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {wk.trendSignal}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {wk.startDate} - {wk.endDate}
                  </span>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Expected Close</span>
                      <span className="text-base font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {currency}{formatVal(wk.predictedClose)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase block">Change</span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          isWeekPos ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isWeekPos ? "+" : ""}
                        {formatVal(wk.weeklyChangePct)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Range:</span>
                    <span className="text-slate-300">
                      {currency}{formatVal(wk.expectedLow)} - {currency}{formatVal(wk.expectedHigh)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-400 italic line-clamp-2 block">
                    🎯 {wk.keyCatalyst}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Macro Driver & Quantitative Thesis */}
      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
          <Compass className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              30-Day Macro Driver & Horizon Thesis
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {projection.macroDriver}
          </p>
        </div>
      </div>
    </div>
  );
};
