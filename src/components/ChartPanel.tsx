import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Eye,
  EyeOff,
  Layers,
  FileSpreadsheet,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { PredictionResult } from "../types";

interface ChartPanelProps {
  prediction: PredictionResult | null;
  currency: string;
  onExportExcel?: () => void;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({ prediction, currency, onExportExcel }) => {
  const [showBacktestFit, setShowBacktestFit] = useState(true);
  const [showVolatilityBand, setShowVolatilityBand] = useState(true);
  const [showMaLine, setShowMaLine] = useState(true);
  const [showPriceDivergence, setShowPriceDivergence] = useState(true);

  if (!prediction || !prediction.chartData || prediction.chartData.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No stock price dataset loaded.
      </div>
    );
  }

  // Compute min and max for Y-Axis domain padding
  const allPrices: number[] = [];
  prediction.chartData.forEach((d) => {
    if (d.actualClose) allPrices.push(d.actualClose);
    if (d.forecastPrice) allPrices.push(d.forecastPrice);
    if (d.lowBand) allPrices.push(d.lowBand);
    if (d.highBand) allPrices.push(d.highBand);
  });

  const minPrice = Math.floor(Math.min(...allPrices) * 0.98);
  const maxPrice = Math.ceil(Math.max(...allPrices) * 1.02);

  // Calculate divergence threshold based on standard deviation or fixed percentage
  const divergencePoints = prediction.chartData
    .filter((d) => d.actualClose !== undefined && d.ma !== undefined && d.ma > 0)
    .map((d) => {
      const actual = d.actualClose!;
      const ma = d.ma!;
      const diff = actual - ma;
      const pct = (diff / ma) * 100;
      return { actual, ma, diff, pct };
    });

  const avgAbsDivergence =
    divergencePoints.length > 0
      ? divergencePoints.reduce((acc, p) => acc + Math.abs(p.pct), 0) / divergencePoints.length
      : 1.5;
  const divergenceThresholdPct = Math.max(1.5, parseFloat((avgAbsDivergence * 1.3).toFixed(1)));

  // Latest divergence metrics
  const lastPointWithMa = [...prediction.chartData]
    .reverse()
    .find((d) => d.actualClose !== undefined && d.ma !== undefined && d.ma > 0);

  const currentDivergencePct =
    lastPointWithMa && lastPointWithMa.actualClose && lastPointWithMa.ma
      ? ((lastPointWithMa.actualClose - lastPointWithMa.ma) / lastPointWithMa.ma) * 100
      : 0;

  const currentDivergenceStatus =
    currentDivergencePct >= divergenceThresholdPct
      ? "OVERBOUGHT_PREMIUM"
      : currentDivergencePct <= -divergenceThresholdPct
      ? "OVERSOLD_DISCOUNT"
      : "NORMAL";

  // Process data for Recharts area & divergence layers
  const formattedData = prediction.chartData.map((d) => {
    const hasMaAndClose = d.actualClose !== undefined && d.ma !== undefined && d.ma > 0;
    const diff = hasMaAndClose ? d.actualClose! - d.ma! : 0;
    const divPct = hasMaAndClose ? (diff / d.ma!) * 100 : 0;
    const isSignificant = Math.abs(divPct) >= divergenceThresholdPct;

    const lowerBound = hasMaAndClose ? Math.min(d.actualClose!, d.ma!) : undefined;
    const upperBound = hasMaAndClose ? Math.max(d.actualClose!, d.ma!) : undefined;

    return {
      ...d,
      divergencePct: hasMaAndClose ? parseFloat(divPct.toFixed(2)) : undefined,
      isSignificantDivergence: isSignificant,
      divergenceType: isSignificant
        ? divPct > 0
          ? "OVERBOUGHT"
          : "OVERSOLD"
        : "NORMAL",
      // Ribbon span between actualClose and MA
      divergenceRibbon:
        showPriceDivergence && lowerBound !== undefined && upperBound !== undefined
          ? [lowerBound, upperBound]
          : undefined,
      // Highlight markers on significant reversals
      overboughtReversal:
        showPriceDivergence && isSignificant && divPct > 0 ? d.actualClose : undefined,
      oversoldReversal:
        showPriceDivergence && isSignificant && divPct < 0 ? d.actualClose : undefined,
      // Band range array for Area chart
      volatilityRange:
        showVolatilityBand && d.lowBand !== undefined && d.highBand !== undefined
          ? [d.lowBand, d.highBand]
          : undefined,
    };
  });

  const totalDivergenceReversals = formattedData.filter((d) => d.isSignificantDivergence).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Historical Prices vs Quantitative Forecast Model
          </h2>
          <p className="text-xs text-slate-400">
            Solid line represents historical closes. Dashed line indicates walk-forward backtest fit. Amber line projects future horizon.
          </p>
        </div>

        {/* Toggle Layer Visibility Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowPriceDivergence(!showPriceDivergence)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[11px] font-medium ${
              showPriceDivergence
                ? "bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-950"
                : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
            title="Highlight areas where price deviates sharply from MA path (Mean Reversion)"
          >
            <Activity className="w-3 h-3 text-purple-400" />
            <span>Price Divergence</span>
            {showPriceDivergence ? <Eye className="w-2.5 h-2.5 opacity-75" /> : <EyeOff className="w-2.5 h-2.5 opacity-75" />}
          </button>

          <button
            onClick={() => setShowVolatilityBand(!showVolatilityBand)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[11px] font-medium ${
              showVolatilityBand
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
          >
            {showVolatilityBand ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Volatility Band
          </button>

          <button
            onClick={() => setShowBacktestFit(!showBacktestFit)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[11px] font-medium ${
              showBacktestFit
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
          >
            {showBacktestFit ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Backtest Fit
          </button>

          <button
            onClick={() => setShowMaLine(!showMaLine)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[11px] font-medium ${
              showMaLine
                ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
          >
            {showMaLine ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Moving Average
          </button>

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-bold transition-all shadow-sm"
              title="Export Dataset to Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Price Divergence Indicator Bar when active */}
      {showPriceDivergence && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-950/20 border border-purple-800/30 rounded-lg p-2.5 px-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-purple-500/20 text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-purple-200 mr-2">Price vs AI Moving Average Divergence:</span>
              <span
                className={`font-mono font-bold ${
                  currentDivergencePct > 0 ? "text-rose-400" : currentDivergencePct < 0 ? "text-emerald-400" : "text-slate-300"
                }`}
              >
                {currentDivergencePct > 0 ? "+" : ""}
                {(currentDivergencePct ?? 0).toFixed(2)}%
              </span>
              <span className="text-slate-400 ml-2">
                (Deviation Threshold: ±{(divergenceThresholdPct ?? 1.5).toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentDivergenceStatus === "OVERBOUGHT_PREMIUM" && (
              <span className="flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[11px] font-semibold">
                <TrendingDown className="w-3 h-3 text-rose-400" />
                Overextended Premium (Mean Reversion Pullback Risk)
              </span>
            )}
            {currentDivergenceStatus === "OVERSOLD_DISCOUNT" && (
              <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[11px] font-semibold">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Oversold Discount (Potential Reversal Bounce Zone)
              </span>
            )}
            {currentDivergenceStatus === "NORMAL" && (
              <span className="flex items-center gap-1 bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px]">
                <Activity className="w-3 h-3 text-blue-400" />
                Synchronized (Tracking Moving Average Path)
              </span>
            )}
            <span className="text-[11px] text-slate-400 border-l border-purple-800/40 pl-2">
              {totalDivergenceReversals} Reversal Zones Identified
            </span>
          </div>
        </div>
      )}

      {/* Main Interactive Recharts Canvas */}
      <div className="w-full h-[380px] sm:h-[420px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <defs>
              {/* Translucent gradient for volatility confidence band */}
              <linearGradient id="volatilityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F5A524" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F5A524" stopOpacity={0.02} />
              </linearGradient>

              {/* Purple/Violet gradient for price-MA divergence ribbon */}
              <linearGradient id="divergenceRibbonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#A855F7" stopOpacity={0.08} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#64748B"
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              tickLine={{ stroke: "#334155" }}
            />

            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="#64748B"
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              tickFormatter={(val) => `${currency}${val}`}
              tickLine={{ stroke: "#334155" }}
              width={65}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const dataPoint = payload[0]?.payload;

                return (
                  <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-2xl text-xs space-y-1.5 min-w-[220px]">
                    <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
                      <span>{label}</span>
                      {dataPoint?.isForecast && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.2 rounded border border-amber-500/30">
                          PROJECTION
                        </span>
                      )}
                    </p>

                    {dataPoint?.actualClose !== undefined && (
                      <div className="flex justify-between items-center text-slate-200">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-200" />
                          Actual Close:
                        </span>
                        <span className="font-mono font-bold">
                          {currency}{dataPoint.actualClose}
                        </span>
                      </div>
                    )}

                    {dataPoint?.forecastPrice !== undefined && (
                      <div className="flex justify-between items-center text-amber-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          Forecast Price:
                        </span>
                        <span className="font-mono font-bold">
                          {currency}{dataPoint.forecastPrice}
                        </span>
                      </div>
                    )}

                    {showBacktestFit && dataPoint?.backtestPred !== undefined && (
                      <div className="flex justify-between items-center text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          Backtest Fit:
                        </span>
                        <span className="font-mono font-bold">
                          {currency}{dataPoint.backtestPred}
                        </span>
                      </div>
                    )}

                    {showMaLine && dataPoint?.ma !== undefined && (
                      <div className="flex justify-between items-center text-blue-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          Moving Avg:
                        </span>
                        <span className="font-mono font-bold">
                          {currency}{dataPoint.ma}
                        </span>
                      </div>
                    )}

                    {showPriceDivergence && dataPoint?.divergencePct !== undefined && (
                      <div className="pt-1.5 border-t border-purple-900/50 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-purple-300">
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-purple-400" />
                            MA Divergence:
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              dataPoint.divergencePct > 0
                                ? "text-rose-400"
                                : dataPoint.divergencePct < 0
                                ? "text-emerald-400"
                                : "text-purple-300"
                            }`}
                          >
                            {dataPoint.divergencePct > 0 ? "+" : ""}
                            {dataPoint.divergencePct}%
                          </span>
                        </div>
                        {dataPoint.isSignificantDivergence && (
                          <div
                            className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium ${
                              dataPoint.divergencePct > 0
                                ? "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                                : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                            }`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {dataPoint.divergencePct > 0
                              ? "Overextended (Pullback Warning)"
                              : "Oversold (Reversal Bounce Opportunity)"}
                          </div>
                        )}
                      </div>
                    )}

                    {showVolatilityBand &&
                      dataPoint?.lowBand !== undefined &&
                      dataPoint?.highBand !== undefined && (
                        <div className="pt-1 border-t border-slate-800 text-[10px] text-amber-300/80 flex justify-between font-mono">
                          <span>Confidence Band:</span>
                          <span>
                            {currency}{dataPoint.lowBand} - {currency}{dataPoint.highBand}
                          </span>
                        </div>
                      )}
                  </div>
                );
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "10px", fontSize: "11px", color: "#94A3B8" }}
            />

            {/* Volatility Band Area */}
            {showVolatilityBand && (
              <Area
                type="monotone"
                dataKey="volatilityRange"
                stroke="none"
                fill="url(#volatilityGradient)"
                name="Confidence Band"
                isAnimationActive={false}
              />
            )}

            {/* Price Divergence Ribbon Area between Price and MA */}
            {showPriceDivergence && (
              <Area
                type="monotone"
                dataKey="divergenceRibbon"
                stroke="none"
                fill="url(#divergenceRibbonGradient)"
                name="Price Divergence Gap"
                isAnimationActive={false}
              />
            )}

            {/* Moving Average Line */}
            {showMaLine && (
              <Line
                type="monotone"
                dataKey="ma"
                stroke="#3B82F6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="Moving Avg"
              />
            )}

            {/* Historical Backtest Prediction Line */}
            {showBacktestFit && (
              <Line
                type="monotone"
                dataKey="backtestPred"
                stroke="#10B981"
                strokeWidth={1.8}
                strokeDasharray="3 3"
                dot={false}
                name="Backtest Model Fit"
              />
            )}

            {/* Actual Historical Prices Line */}
            <Line
              type="monotone"
              dataKey="actualClose"
              stroke="#F1F5F9"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#F1F5F9", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#38BDF8" }}
              name="Actual Close"
            />

            {/* Overbought Reversal Warning Scatter/Points */}
            {showPriceDivergence && (
              <Line
                type="monotone"
                dataKey="overboughtReversal"
                stroke="none"
                dot={{ r: 5, fill: "#F43F5E", stroke: "#881337", strokeWidth: 1.5 }}
                activeDot={{ r: 7, fill: "#FB7185" }}
                name="Overbought Divergence"
                isAnimationActive={false}
              />
            )}

            {/* Oversold Reversal Bounce Scatter/Points */}
            {showPriceDivergence && (
              <Line
                type="monotone"
                dataKey="oversoldReversal"
                stroke="none"
                dot={{ r: 5, fill: "#10B981", stroke: "#064E3B", strokeWidth: 1.5 }}
                activeDot={{ r: 7, fill: "#34D399" }}
                name="Oversold Divergence"
                isAnimationActive={false}
              />
            )}

            {/* Forecast Projection Line */}
            <Line
              type="monotone"
              dataKey="forecastPrice"
              stroke="#F5A524"
              strokeWidth={3}
              dot={{ r: 4, fill: "#F5A524", stroke: "#78350F", strokeWidth: 1.5 }}
              name="Forecast Horizon"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

