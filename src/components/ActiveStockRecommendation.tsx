import React, { useState } from "react";
import {
  Flame,
  TrendingUp,
  Target,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  Copy,
  Check,
  Award,
  Clock,
  Layers,
  HelpCircle,
} from "lucide-react";
import { StockRecommendationDetails, generateStockRecommendation } from "../utils/stockRecommendationEngine";

interface ActiveStockRecommendationProps {
  symbol: string;
  companyName: string;
  currency: string;
  currentPrice: number;
  sentimentScore?: number;
  quantTargetPrice?: number;
}

export const ActiveStockRecommendation: React.FC<ActiveStockRecommendationProps> = ({
  symbol,
  companyName,
  currency,
  currentPrice,
  sentimentScore = 65,
  quantTargetPrice,
}) => {
  const [copied, setCopied] = useState(false);

  const recommendation: StockRecommendationDetails = generateStockRecommendation(
    symbol,
    companyName,
    currency,
    currentPrice,
    sentimentScore,
    quantTargetPrice
  );

  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case "STRONG BUY":
        return (
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 animate-pulse">
            <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>STRONG BUY RECOMMENDATION</span>
          </div>
        );
      case "BUY":
        return (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>BUY RECOMMENDATION</span>
          </div>
        );
      case "ACCUMULATE":
        return (
          <div className="bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>ACCUMULATE ON DIPS</span>
          </div>
        );
      case "HOLD":
        return (
          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>HOLD & MONITOR</span>
          </div>
        );
      default:
        return (
          <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>WATCH / DEFENSIVE</span>
          </div>
        );
    }
  };

  const handleCopyPlan = () => {
    const text = `🎯 Tailored Recommendation for ${recommendation.companyName} (${recommendation.symbol}):
Signal: ${recommendation.signal}
Current Price: ${recommendation.currency}${recommendation.currentPrice}
Entry Zone: ${recommendation.entryZone}
Target Price: ${recommendation.currency}${recommendation.targetPrice} (+${recommendation.expectedReturnPct}%)
Stop Loss: ${recommendation.currency}${recommendation.stopLoss}
Risk/Reward: ${recommendation.riskRewardRatio}
Timeframe: ${recommendation.timeframe}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 rounded-2xl border border-indigo-500/30 p-5 shadow-2xl space-y-5 relative overflow-hidden">
      {/* Decorative Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Award className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Actionable Stock Recommendation for {recommendation.symbol}
            </h3>
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
              Tailored Quant Plan
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time buy/hold targets, optimal entry zone, and risk management parameters for <span className="text-indigo-300 font-semibold">{recommendation.companyName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {getSignalBadge(recommendation.signal)}
          <button
            onClick={handleCopyPlan}
            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Copy Trading Plan"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Copy Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Key Recommendation Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Entry Zone */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Optimal Entry Zone
          </span>
          <span className="text-sm font-mono font-bold text-slate-100 block">
            {recommendation.entryZone}
          </span>
          <span className="text-[10px] text-slate-500 block">Current: {currency}{recommendation.currentPrice}</span>
        </div>

        {/* Target Price */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 space-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 text-emerald-500/20">
            <Target className="w-8 h-8" />
          </div>
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
            End of Day (EOD) Target Price
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-mono font-bold text-emerald-400">
              {currency}{recommendation.targetPrice}
            </span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              +{recommendation.expectedReturnPct}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            Timeframe: {recommendation.timeframe} (End of Day Target)
          </span>
        </div>

        {/* Stop Loss */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-rose-500/30 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Strict Stop-Loss
          </span>
          <span className="text-base font-mono font-bold text-rose-400 block">
            {currency}{recommendation.stopLoss}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Risk Limit: -{(( (recommendation.currentPrice - recommendation.stopLoss) / recommendation.currentPrice) * 100).toFixed(2)}%
          </span>
        </div>

        {/* Risk / Reward & Position Sizing */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Risk / Reward Ratio
          </span>
          <span className="text-base font-mono font-bold text-indigo-300 block">
            {recommendation.riskRewardRatio}
          </span>
          <span className="text-[10px] text-indigo-400 font-semibold block">
            Sizing: {recommendation.positionSizing}
          </span>
        </div>
      </div>

      {/* Rationale & Support/Resistance Technical Levels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rationale & Catalysts (2 cols) */}
        <div className="lg:col-span-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Quantitative Thesis & Catalyst Analysis
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {recommendation.rationale}
          </p>

          <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Key Catalysts Supporting {recommendation.symbol}:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {recommendation.keyCatalysts.map((cat, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Support & Resistance Levels (1 col) */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Technical Key Levels
            </h4>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-semibold">Resistance 2 (R2)</span>
              <span className="font-bold text-slate-200">{currency}{recommendation.resistance2}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-emerald-300 font-semibold">Resistance 1 (R1)</span>
              <span className="font-bold text-slate-200">{currency}{recommendation.resistance1}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-indigo-500/30 bg-indigo-950/20">
              <span className="text-indigo-300 font-semibold">Current Price</span>
              <span className="font-bold text-indigo-300">{currency}{recommendation.currentPrice}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-semibold">Support 1 (S1)</span>
              <span className="font-bold text-slate-200">{currency}{recommendation.support1}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-rose-400 font-semibold">Support 2 (S2)</span>
              <span className="font-bold text-slate-200">{currency}{recommendation.support2}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
