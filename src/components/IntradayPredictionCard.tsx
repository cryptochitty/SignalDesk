import React, { useState } from "react";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  ArrowUpRight,
  Clock,
  BarChart2,
  Sliders,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { IntradayPrediction } from "../types";

interface IntradayPredictionCardProps {
  intraday?: IntradayPrediction;
  symbol: string;
  currency: string;
  currentPrice: number;
}

export const IntradayPredictionCard: React.FC<IntradayPredictionCardProps> = ({
  intraday,
  symbol,
  currency,
  currentPrice,
}) => {
  const [activeTab, setActiveTab] = useState<"ranges" | "pivots" | "hourly">("ranges");

  if (!intraday) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-slate-400">
        No intraday prediction data available for {symbol}.
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

  const isBullish = intraday.signal.includes("BUY");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div
        className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-10 pointer-events-none ${
          isBullish ? "bg-emerald-500" : "bg-rose-500"
        }`}
      />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isBullish
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                INTRADAY BUYING & SELLING TARGETS
              </h3>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {symbol}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Same-day trading bounds, entry range, exit targets & floor pivot points
            </p>
          </div>
        </div>

        {/* Action Signal & R:R Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
              isBullish
                ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
                : "bg-rose-500 text-slate-950 shadow-rose-500/20"
            }`}
          >
            {isBullish ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{intraday.signal}</span>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">R:R Ratio</span>
            <span className="text-xs font-mono font-bold text-indigo-400">
              {intraday.riskRewardRatio}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("ranges")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ranges"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Buy / Sell Ranges</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pivots")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "pivots"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Floor Pivot Levels</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hourly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "hourly"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hourly Session Curve</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Confidence:</span>
          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {intraday.confidenceScore}%
          </span>
        </div>
      </div>

      {/* TAB 1: BUYING & SELLING RANGES */}
      {activeTab === "ranges" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* BUYING RANGE CARD */}
          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase text-emerald-400 tracking-wide flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                Intraday Buying Zone
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                ENTRY RANGE
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Buy Range Bounds
                </span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                  {currency}{formatVal(intraday.buyRangeLow)} - {currency}{formatVal(intraday.buyRangeHigh)}
                </span>
              </div>

              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-300 uppercase block">
                    Optimal Limit Entry
                  </span>
                  <span className="text-sm font-mono font-black text-emerald-400">
                    {currency}{formatVal(intraday.buyOptimal)}
                  </span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-80" />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Place limit buy orders within this zone on morning pullbacks or VWAP retests.
            </p>
          </div>

          {/* SELLING TARGETS CARD */}
          <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase text-indigo-400 tracking-wide flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-400" />
                Intraday Exit Targets
              </span>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/20">
                PROFIT TARGETS
              </span>
            </div>

            <div className="space-y-2 font-mono">
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-sans">Target 1 (Scalp)</span>
                <span className="text-xs font-bold text-indigo-300">
                  {currency}{formatVal(intraday.sellTarget1)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-indigo-950/40 rounded-xl border border-indigo-500/30">
                <span className="text-xs text-indigo-200 font-sans font-bold">Target 2 (Main Goal)</span>
                <span className="text-sm font-black text-indigo-300">
                  {currency}{formatVal(intraday.sellTarget2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-sans">Target 3 (Resistance 2)</span>
                <span className="text-xs font-bold text-purple-300">
                  {currency}{formatVal(intraday.sellTarget3)}
                </span>
              </div>
            </div>
          </div>

          {/* STOP LOSS & RISK CARD */}
          <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase text-rose-400 tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Risk & Stop Loss
              </span>
              <span className="text-[10px] font-mono bg-rose-500/10 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/20">
                PROTECTION
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Intraday Stop Loss
                </span>
                <span className="text-xl font-black font-mono text-rose-400 mt-0.5 block">
                  {currency}{formatVal(intraday.stopLoss)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block font-sans">
                    Exp. High
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {currency}{formatVal(intraday.expectedHigh)}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block font-sans">
                    Exp. Low
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {currency}{formatVal(intraday.expectedLow)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Strict stop-loss bounds to maintain capital preservation.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: FLOOR PIVOT LEVELS */}
      {activeTab === "pivots" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-center">
            <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-400 uppercase block font-sans">Support 2 (S2)</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block">{currency}{formatVal(intraday.support2)}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-400 uppercase block font-sans">Support 1 (S1)</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block">{currency}{formatVal(intraday.support1)}</span>
            </div>
            <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-500/40">
              <span className="text-[10px] font-bold text-indigo-300 uppercase block font-sans">Pivot Point (PP)</span>
              <span className="text-base font-black text-indigo-200 mt-1 block">{currency}{formatVal(intraday.pivotPoint)}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block font-sans">Resistance 1 (R1)</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block">{currency}{formatVal(intraday.resistance1)}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/20">
              <span className="text-[10px] font-bold text-cyan-400 uppercase block font-sans">Resistance 2 (R2)</span>
              <span className="text-sm font-bold text-slate-200 mt-1 block">{currency}{formatVal(intraday.resistance2)}</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Expected VWAP Benchmark:</span>
            <span className="font-mono font-bold text-indigo-300">{currency}{formatVal(intraday.expectedVwap)}</span>
          </div>
        </div>
      )}

      {/* TAB 3: HOURLY SESSION TRAJECTORY */}
      {activeTab === "hourly" && (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-sans">
                  <th className="p-2.5">Trading Session Time</th>
                  <th className="p-2.5">Forecast Price</th>
                  <th className="p-2.5">Proj. VWAP</th>
                  <th className="p-2.5">Intraday Low Band</th>
                  <th className="p-2.5 text-right">Intraday High Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {intraday.intradayHourlyCurve.map((pt) => (
                  <tr key={pt.time} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-2.5 font-bold text-slate-200 font-sans flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{pt.time}</span>
                    </td>
                    <td className="p-2.5 text-emerald-400 font-bold">
                      {currency}{formatVal(pt.predictedPrice)}
                    </td>
                    <td className="p-2.5 text-indigo-300">
                      {currency}{formatVal(pt.vwap)}
                    </td>
                    <td className="p-2.5 text-rose-300">
                      {currency}{formatVal(pt.lowBand)}
                    </td>
                    <td className="p-2.5 text-right text-cyan-300">
                      {currency}{formatVal(pt.highBand)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
