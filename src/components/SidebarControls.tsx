import React from "react";
import { Sliders, RotateCcw, Shield, Calendar, Activity } from "lucide-react";
import { QuantitativeConfig } from "../types";

interface SidebarControlsProps {
  config: QuantitativeConfig;
  onConfigChange: (newConfig: QuantitativeConfig) => void;
  onResetWeights: () => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  config,
  onConfigChange,
  onResetWeights,
}) => {
  const handleWeightChange = (key: keyof QuantitativeConfig["weights"], value: number) => {
    onConfigChange({
      ...config,
      weights: {
        ...config.weights,
        [key]: value,
      },
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          Quantitative Parameters & Weights
        </h3>

        <button
          onClick={onResetWeights}
          className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
          title="Reset sliders to standard balanced weights"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* 1. Moving Average Window */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            MA Window Size (Days)
          </label>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
            {config.maWindow}d
          </span>
        </div>
        <input
          type="range"
          min={2}
          max={30}
          value={config.maWindow}
          onChange={(e) =>
            onConfigChange({ ...config, maWindow: parseInt(e.target.value, 10) })
          }
          className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>2 days (Fast)</span>
          <span>30 days (Smooth)</span>
        </div>
      </div>

      {/* 2. Forecast Horizon */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Forecast Horizon
          </label>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300">
            +{config.forecastHorizon} Days
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={14}
          value={config.forecastHorizon}
          onChange={(e) =>
            onConfigChange({ ...config, forecastHorizon: parseInt(e.target.value, 10) })
          }
          className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>+1 Day (Next Close)</span>
          <span>+14 Days (2 Weeks)</span>
        </div>
      </div>

      {/* 3. Volatility Confidence Band Level */}
      <div className="space-y-1.5">
        <label className="font-semibold text-xs text-slate-300 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          Volatility Confidence Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[80, 90, 95].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onConfigChange({ ...config, confidenceLevel: level })}
              className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                config.confidenceLevel === level
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              {level}% Band
            </button>
          ))}
        </div>
      </div>

      {/* 4. Backtest Time Window Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-xs text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Backtest Time Window
          </label>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            {config.backtestHorizonMonths === 6 || !config.backtestHorizonMonths
              ? "6 Months Active"
              : config.backtestHorizonMonths === 0
              ? "All History"
              : `${config.backtestHorizonMonths} Mo Window`}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { months: 1, label: "1 Month" },
            { months: 3, label: "3 Months" },
            { months: 6, label: "6 Months" },
            { months: 0, label: "All Data" },
          ].map((opt) => {
            const isActive =
              (config.backtestHorizonMonths ?? 6) === opt.months;
            return (
              <button
                key={opt.months}
                type="button"
                onClick={() =>
                  onConfigChange({ ...config, backtestHorizonMonths: opt.months })
                }
                className={`py-1.5 px-1 text-[11px] font-bold rounded-lg border transition-all text-center ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Model Weights Sliders */}
      <div className="pt-3 border-t border-slate-800 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Ensemble Blender Weights
        </span>

        {/* MA Weight */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-300">
            <span>Moving Average (MA)</span>
            <span className="font-mono text-indigo-400 font-bold">
              {(config.weights.ma * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.weights.ma}
            onChange={(e) => handleWeightChange("ma", parseFloat(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
        </div>

        {/* Regression Weight */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-300">
            <span>Linear Regression Trend</span>
            <span className="font-mono text-indigo-400 font-bold">
              {(config.weights.regression * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.weights.regression}
            onChange={(e) => handleWeightChange("regression", parseFloat(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
        </div>

        {/* Momentum Weight */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-300">
            <span>Momentum Velocity</span>
            <span className="font-mono text-indigo-400 font-bold">
              {(config.weights.momentum * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.weights.momentum}
            onChange={(e) => handleWeightChange("momentum", parseFloat(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
        </div>

        {/* Sentiment Weight */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-300">
            <span>Social Sentiment Bias</span>
            <span className="font-mono text-indigo-400 font-bold">
              {(config.weights.sentiment * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.weights.sentiment}
            onChange={(e) => handleWeightChange("sentiment", parseFloat(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
        </div>
      </div>
    </div>
  );
};
