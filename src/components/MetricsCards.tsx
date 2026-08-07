import React from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Target,
  BarChart2,
  Sparkles,
} from "lucide-react";
import { PredictionResult, SentimentAnalysisData } from "../types";

interface MetricsCardsProps {
  prediction: PredictionResult | null;
  sentimentData: SentimentAnalysisData | null;
  onOpenBacktestModal: () => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  prediction,
  sentimentData,
  onOpenBacktestModal,
}) => {
  if (!prediction) return null;

  const currency = prediction.currency;
  const isGain = prediction.percentChange >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: Last Close Price */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            Last Historical Close
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {prediction.symbol}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-black text-slate-100 font-mono">
            {currency}{prediction.lastClose.toLocaleString()}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Base historical anchor for forecast horizon models
        </p>
      </div>

      {/* CARD 2: Current Day End of Day (EOD) Target */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-lg hover:border-indigo-500/60 transition-all relative overflow-hidden group">
        <div
          className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none ${
            isGain ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
            Current Day EOD Target
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
              isGain
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {isGain ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isGain ? "+" : ""}
            {prediction.percentChange.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-black text-white font-mono">
            {currency}{prediction.nextClose.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-bold ml-1">
            (EOD Target)
          </span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <span>End of Day Forecast</span>
          <span className="font-mono text-indigo-300 font-semibold">Blended Model</span>
        </div>
      </div>

      {/* CARD 3: Volatility Confidence Spread */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Volatility Confidence Band
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            90% Band
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-lg font-bold text-amber-300 font-mono">
            [{currency}{prediction.lowBand.toLocaleString()} - {currency}{prediction.highBand.toLocaleString()}]
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mt-2">
          Statistical variance spread based on historical std deviation
        </p>
      </div>

      {/* CARD 4: Backtest Accuracy & MAE */}
      <div
        onClick={onOpenBacktestModal}
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-indigo-500/50 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 group-hover:text-indigo-300 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Historical Backtest Error
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            MAE: {currency}{prediction.backtestMetrics.mae}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black text-slate-100 font-mono">
            {(100 - prediction.backtestMetrics.maePercent).toFixed(1)}%
          </span>
          <span className="text-xs font-semibold text-emerald-400">
            Model Accuracy
          </span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <span>Directional Hit Rate</span>
          <span className="font-mono text-emerald-400 font-bold">
            {prediction.backtestMetrics.directionalAccuracy}%
          </span>
        </div>
      </div>
    </div>
  );
};
