import React, { useState } from "react";
import {
  Brain,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  LineChart,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Layers,
  Crosshair,
  AlertTriangle,
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
  const [activeTab, setActiveTab] = useState<"methodology" | "ensemble">("methodology");

  if (!prediction) return null;

  const wm = prediction.weeklyMethod;

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
          supertrend: wm?.supertrend,
          wilderRsi: wm?.wilderRsi14,
          probeLevel: wm?.executionProtocol.probeLevel,
          addLevel: wm?.executionProtocol.addLevel,
          invalidationLevel: wm?.executionProtocol.invalidationLevel,
          currency,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate AI commentary");
      const data = await res.json();
      setAiSummary(data.summary);
    } catch (err) {
      console.warn("Notice: Generating AI commentary via local quant metrics:", err);
      const probeStr = wm ? `\n• Probe Midpoint: ${currency}${wm.executionProtocol.probeLevel} | Add Breakout: ${currency}${wm.executionProtocol.addLevel} | Invalidation: ${currency}${wm.executionProtocol.invalidationLevel}` : "";
      setAiSummary(
        `• Quantitative convergence observed around ${currency}${prediction.nextClose} target.\n• Model backtesting reflects a historical mean error of ${prediction.backtestMetrics.maePercent}%.\n• Supertrend Weekly (ATR 10 / Factor 2.25) is ${wm?.supertrend.direction || "BULLISH"}.${probeStr}\n• Maintain strict risk stop-loss bounds near ${currency}${prediction.lowBand}.`
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
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Quantitative Methodology & Multi-Timeframe Protocol
            </h3>
            <p className="text-xs text-slate-400">
              Weekly Supertrend (10, 2.25) • Wilder RSI 14 • 50/35/15 Composite Scoring • Action Levels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("methodology")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === "methodology"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Core Method Protocol
          </button>
          <button
            onClick={() => setActiveTab("ensemble")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === "ensemble"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Ensemble Regression Models
          </button>
        </div>
      </div>

      {activeTab === "methodology" && (
        <div className="space-y-4">
          {/* Method Card matching user uploaded spec with deep navy background and gold header */}
          <div className="bg-[#0b1329] border border-blue-900/50 rounded-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Top Bar with METHOD Title & Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-blue-900/40">
              <h4 className="text-base sm:text-lg font-bold text-[#e5b842] tracking-wider uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e5b842] animate-pulse"></span>
                METHOD
              </h4>
              {wm && (
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold flex items-center gap-1 ${
                      wm.supertrend.direction === "BULLISH"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {wm.supertrend.direction === "BULLISH" ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    Supertrend: {wm.supertrend.direction} ({currency}{wm.supertrend.value})
                  </span>

                  <span className="text-xs px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-md font-mono">
                    Wilder RSI(14): {wm.wilderRsi14.value}
                  </span>
                </div>
              )}
            </div>

            {/* The 10 Quantitative Method Directives matching exact user image */}
            <div className="space-y-3 font-sans text-sm text-slate-200">
              {/* Item 1 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1.5 shrink-0"></span>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                  <span>Weekly Supertrend uses ATR length 10 and factor 2.25</span>
                  {wm && (
                    <span className="text-xs font-mono text-cyan-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                      ATR(10): {currency}{wm.supertrend.atr10} • Trailing Level: {currency}{wm.supertrend.value}
                    </span>
                  )}
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1.5 shrink-0"></span>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                  <span>Weekly RSI uses Wilder RSI length 14</span>
                  {wm && (
                    <span className="text-xs font-mono text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                      {wm.wilderRsi14.value} ({wm.wilderRsi14.condition})
                    </span>
                  )}
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1.5 shrink-0"></span>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                  <span>The last completed weekly candle drives the score</span>
                  {wm && (
                    <span className="text-xs font-mono text-amber-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                      Candle Score: {wm.completedWeeklyCandle.scoreContribution}/100 ({wm.completedWeeklyCandle.changePct > 0 ? "+" : ""}{wm.completedWeeklyCandle.changePct}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1.5 shrink-0"></span>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                  <span>The live weekly candle supplies recovery evidence</span>
                  {wm && (
                    <span className="text-xs font-mono text-emerald-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                      Live Recovery: {wm.liveWeeklyCandle.recoveryEvidenceScore}/100 ({wm.liveWeeklyCandle.weeklyGainPct > 0 ? "+" : ""}{wm.liveWeeklyCandle.weeklyGainPct}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Item 5 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1.5 shrink-0"></span>
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>Composite score is 50 technical, 35 fundamental and 15 execution</span>
                    {wm && (
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-700">
                        Total Score: {wm.compositeScore.totalScore}/100 • {wm.compositeScore.rating}
                      </span>
                    )}
                  </div>
                  {wm && (
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex border border-blue-900/60 mt-1">
                      <div
                        style={{ width: `${(wm.compositeScore.technicalScore / 50) * 50}%` }}
                        className="bg-indigo-500 h-full"
                        title={`Technical: ${wm.compositeScore.technicalScore}/50`}
                      ></div>
                      <div
                        style={{ width: `${(wm.compositeScore.fundamentalScore / 35) * 35}%` }}
                        className="bg-amber-500 h-full"
                        title={`Fundamental: ${wm.compositeScore.fundamentalScore}/35`}
                      ></div>
                      <div
                        style={{ width: `${(wm.compositeScore.executionScore / 15) * 15}%` }}
                        className="bg-emerald-500 h-full"
                        title={`Execution: ${wm.compositeScore.executionScore}/15`}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Item 6 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1.5 shrink-0"></span>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                  <span>Audited Top 200 PCI scores are reused when available</span>
                  {wm && (
                    <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      {wm.assetAuditStatus.categoryLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Item 7 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1.5 shrink-0"></span>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                  <span>Other coins receive a capped survival proxy and evidence penalty</span>
                  {wm && (
                    <span className="text-xs font-mono text-slate-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                      Survival Proxy: {wm.assetAuditStatus.survivalProxyScore}/100 • Penalty: -{wm.assetAuditStatus.evidencePenalty} pts
                    </span>
                  )}
                </div>
              </div>

              {/* Item 8 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1.5 shrink-0"></span>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                  <span>Probe is the prior week midpoint</span>
                  {wm && (
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-700">
                      Probe Level: {currency}{wm.executionProtocol.probeLevel} ({wm.executionProtocol.distanceToProbePct >= 0 ? "+" : ""}{wm.executionProtocol.distanceToProbePct}% from current)
                    </span>
                  )}
                </div>
              </div>

              {/* Item 9 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1.5 shrink-0"></span>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                  <span>Add is the prior week high</span>
                  {wm && (
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-700">
                      Add Level: {currency}{wm.executionProtocol.addLevel} ({wm.executionProtocol.distanceToAddPct >= 0 ? "+" : ""}{wm.executionProtocol.distanceToAddPct}% from current)
                    </span>
                  )}
                </div>
              </div>

              {/* Item 10 */}
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1.5 shrink-0"></span>
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                  <span>Invalidation is the four week low</span>
                  {wm && (
                    <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/60 px-2.5 py-0.5 rounded border border-rose-700">
                      Invalidation: {currency}{wm.executionProtocol.invalidationLevel} (Safety: {wm.executionProtocol.distanceToInvalidationPct}% buffer)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tactical Action Status Alert Box */}
            {wm && (
              <div className="mt-5 p-3.5 rounded-lg bg-blue-950/70 border border-blue-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30">
                    <Crosshair className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-wide flex items-center gap-2">
                      Execution State: <span className="text-amber-400 font-mono">{wm.executionProtocol.actionStatus}</span>
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {wm.executionProtocol.actionGuidance}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                  <span className="px-2.5 py-1 bg-slate-900/90 rounded border border-blue-800 text-slate-300">
                    Live: <strong className="text-emerald-400">{currency}{wm.executionProtocol.currentPrice}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "ensemble" && (
        <div className="space-y-4">
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
                {typeof sentimentData?.sentimentMultiplier === "number" ? `${sentimentData.sentimentMultiplier.toFixed(2)}x` : "1.00x"}
              </p>
              <p className="text-[10px] text-slate-500">Market chatter bias</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Quantitative Desk Commentary */}
      <div className="pt-2">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                AI Desk Analyst Commentary & Convergence
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
              Click "Synthesize AI Desk Summary" to generate a professional quantitative analyst report incorporating the Weekly Supertrend, Wilder RSI 14, Probe / Add / Invalidation levels, and composite scoring.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

