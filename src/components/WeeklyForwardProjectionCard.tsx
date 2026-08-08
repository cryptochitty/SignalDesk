import React from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { WeeklyForwardProjection } from "../types";

interface WeeklyForwardProjectionCardProps {
  projection?: WeeklyForwardProjection;
  symbol: string;
  currency: string;
  currentPrice: number;
}

export const WeeklyForwardProjectionCard: React.FC<WeeklyForwardProjectionCardProps> = ({
  projection,
  symbol,
  currency,
  currentPrice,
}) => {
  if (!projection) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-slate-400">
        1-Week Forward Projection data loading for {symbol}...
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

  const isPositiveWeekly = projection.weeklyChangePct >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Glow Background */}
      <div
        className={`absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none ${
          isPositiveWeekly ? "bg-emerald-500" : "bg-rose-500"
        }`}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1-WEEK FORWARD PROJECTION
              </h3>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                5 TRADING DAYS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ensemble forward pathway for {symbol} driven by OLS regression, MA drift & momentum decay
            </p>
          </div>
        </div>

        {/* Weekly Target & Bias Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
              isPositiveWeekly
                ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
                : "bg-rose-500 text-slate-950 shadow-rose-500/20"
            }`}
          >
            {isPositiveWeekly ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{projection.overallBias}</span>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">1-Wk Confidence</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {projection.weeklyConfidence}%
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
          <span className="text-[10px] text-slate-400 block font-mono">Base Baseline</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-500/30 space-y-1">
          <span className="text-[10px] font-bold text-indigo-400 uppercase block">
            End-of-Week Target
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-mono font-black text-indigo-300">
              {currency}{formatVal(projection.endOfWeekTarget)}
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                isPositiveWeekly ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositiveWeekly ? "+" : ""}
              {formatVal(projection.weeklyChangePct)}%
            </span>
          </div>
          <span className="text-[10px] text-indigo-300/70 block">Target at Day 5</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            1-Wk Expected High
          </span>
          <span className="text-base sm:text-lg font-mono font-bold text-cyan-400">
            {currency}{formatVal(projection.weeklyHigh)}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Upper Dispersion</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            1-Wk Expected Low
          </span>
          <span className="text-base sm:text-lg font-mono font-bold text-rose-400">
            {currency}{formatVal(projection.weeklyLow)}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Lower Band Floor</span>
        </div>
      </div>

      {/* 5-Day Projection Pathway Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            5-Day Forward Price Progression
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            Daily Step Targets & Confidence Bounds
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {projection.dailyProjections.map((day) => {
            const isDayUp = day.dailyChangePct >= 0;
            return (
              <div
                key={day.dayNumber}
                className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 space-y-2.5 transition-all relative overflow-hidden group"
              >
                {/* Header for Day */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Day {day.dayNumber} ({day.dayName})
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{day.date}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      day.trendSignal === "BULLISH"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : day.trendSignal === "BEARISH"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {day.trendSignal}
                  </span>
                </div>

                {/* Forecast Close */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">
                    Forecast Close
                  </span>
                  <span className="text-base font-black font-mono text-white mt-0.5 block">
                    {currency}{formatVal(day.predictedClose)}
                  </span>
                </div>

                {/* Changes */}
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans text-[10px]">Daily:</span>
                    <span
                      className={`font-bold ${
                        isDayUp ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isDayUp ? "+" : ""}
                      {formatVal(day.dailyChangePct)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans text-[10px]">Cumul:</span>
                    <span
                      className={`font-bold ${
                        day.cumulativeChangePct >= 0 ? "text-indigo-300" : "text-rose-300"
                      }`}
                    >
                      {day.cumulativeChangePct >= 0 ? "+" : ""}
                      {formatVal(day.cumulativeChangePct)}%
                    </span>
                  </div>
                </div>

                {/* Expected Range */}
                <div className="pt-1 border-t border-slate-900 text-[10px] font-mono space-y-0.5">
                  <div className="flex justify-between text-slate-400">
                    <span>High:</span>
                    <span className="text-cyan-300 font-bold">{currency}{formatVal(day.expectedHigh)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Low:</span>
                    <span className="text-rose-300 font-bold">{currency}{formatVal(day.expectedLow)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Insight Note */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2 text-xs text-slate-400 leading-relaxed">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-300">1-Week Forward Projection Dynamics: </span>
          The model projects multi-step target closes across the next 5 trading sessions using a weighted blend of linear regression slope extrapolation, moving average drift, and decaying momentum vectors. Band dispersion widens proportional to <code className="font-mono text-indigo-300">√k × volatility</code>.
        </div>
      </div>
    </div>
  );
};
