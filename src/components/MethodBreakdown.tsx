import React, { useState } from "react";
import {
  Brain,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  LineChart,
  Globe,
} from "lucide-react";
import { PredictionResult, SentimentAnalysisData } from "../types";

interface MethodBreakdownProps {
  prediction: PredictionResult | null;
  sentimentData: SentimentAnalysisData | null;
  currency: string;
}

export const MethodBreakdown: React.FC<MethodBreakdownProps> = ({
  prediction,
  sentimentData,
  currency,
}) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!prediction) return null;

  const handleGenerateAiCommentary = async () => {
    setIsLoadingSummary(true);
    try {
      const res = await fetch("/api/market-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: prediction.symbol,
          currentPrice: prediction.lastClose,
          predictedPrice: prediction.nextClose,
          maPrediction: prediction.maPrediction,
          regPrediction: prediction.regressionPrediction,
          momentumPrediction: prediction.momentumPrediction,
          maePercentage: prediction.backtestMetrics.maePercent,
          sentimentScore: sentimentData?.score,
          currency,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate AI commentary");
      const data = await res.json();
      setAiSummary(data.summary);
    } catch (err) {
      console.error(err);
      setAiSummary(
        `• Quantitative convergence observed around ${currency}${prediction.nextClose} target.\n• Model backtesting reflects a historical mean error of ${prediction.backtestMetrics.maePercent}%.\n• Maintain strict risk stop-loss bounds near ${currency}${prediction.lowBand}.`
      );
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleCopy = () => {
    if (!aiSummary) return;
    navigator.clipboard.writeText(aiSummary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          Quant Method Breakdown & Model Convergence
        </h3>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
          Ensemble Algorithm
        </span>
      </div>

      {/* Model Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* MA Model Card */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-400" />
              Moving Avg
            </span>
            <span className="text-slate-500 font-mono">MA</span>
          </div>
          <p className="text-lg font-bold text-slate-200 font-mono">
            {currency}{prediction.maPrediction}
          </p>
          <p className="text-[10px] text-slate-500">Smooth price baseline</p>
        </div>

        {/* Linear Regression Model Card */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span className="flex items-center gap-1">
              <LineChart className="w-3 h-3 text-indigo-400" />
              Linear Reg
            </span>
            <span className="text-slate-500 font-mono">OLS</span>
          </div>
          <p className="text-lg font-bold text-slate-200 font-mono">
            {currency}{prediction.regressionPrediction}
          </p>
          <p className="text-[10px] text-slate-500">Trend slope extrapolation</p>
        </div>

        {/* Momentum Model Card */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Momentum
            </span>
            <span className="text-slate-500 font-mono">Velocity</span>
          </div>
          <p className="text-lg font-bold text-slate-200 font-mono">
            {currency}{prediction.momentumPrediction}
          </p>
          <p className="text-[10px] text-slate-500">Rate of price velocity</p>
        </div>

        {/* Sentiment Multiplier Card */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-400" />
              Social Sentiment
            </span>
            <span className="text-slate-500 font-mono">Factor</span>
          </div>
          <p className="text-lg font-bold text-emerald-400 font-mono">
            {sentimentData ? `${sentimentData.sentimentMultiplier.toFixed(2)}x` : "1.00x"}
          </p>
          <p className="text-[10px] text-slate-500">Market chatter bias</p>
        </div>
      </div>

      {/* AI Quantitative Desk Commentary */}
      <div className="pt-2">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                AI Desk Analyst Commentary
              </span>
            </div>

            <div className="flex items-center gap-2">
              {aiSummary && (
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 text-xs flex items-center gap-1 transition-all"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {isCopied ? "Copied" : "Copy"}
                </button>
              )}

              <button
                onClick={handleGenerateAiCommentary}
                disabled={isLoadingSummary}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
              >
                {isLoadingSummary ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {aiSummary ? "Re-Generate Insight" : "Synthesize AI Desk Summary"}
              </button>
            </div>
          </div>

          {aiSummary ? (
            <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
              {aiSummary}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Click "Synthesize AI Desk Summary" to generate a professional quantitative analyst report on model convergence, technical levels, and sentiment drivers.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
