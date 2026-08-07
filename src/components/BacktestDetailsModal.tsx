import React from "react";
import { X, Download, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { PredictionResult } from "../types";

interface BacktestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: PredictionResult | null;
  currency: string;
}

export const BacktestDetailsModal: React.FC<BacktestDetailsModalProps> = ({
  isOpen,
  onClose,
  prediction,
  currency,
}) => {
  if (!isOpen || !prediction) return null;

  const metrics = prediction.backtestMetrics;
  const backtestRows = prediction.chartData.filter(
    (d) => !d.isForecast && d.backtestPred !== undefined
  );

  const handleDownloadCsv = () => {
    const headers = "Date,ActualClose,BacktestPredicted,Error,Currency\n";
    const body = backtestRows
      .map((r) => {
        const err = Math.abs((r.actualClose || 0) - (r.backtestPred || 0)).toFixed(2);
        return `${r.date},${r.actualClose},${r.backtestPred},${err},${currency}`;
      })
      .join("\n");

    const blob = new Blob([headers + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${prediction.symbol}_backtest_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Historical Walk-Forward Backtest Audit
              </h2>
              <p className="text-xs text-slate-400">
                Step-by-step historical validation for symbol {prediction.symbol}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Summary Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Mean Absolute Error (MAE)
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {currency}{metrics.mae}
              </span>
              <span className="text-[10px] text-slate-500">
                ({metrics.maePercent}% of price)
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Directional Accuracy
              </span>
              <span className="text-xl font-bold font-mono text-indigo-400 mt-1 block">
                {metrics.directionalAccuracy}%
              </span>
              <span className="text-[10px] text-slate-500">
                Trend direction hit rate
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                RMSE
              </span>
              <span className="text-xl font-bold font-mono text-amber-300 mt-1 block">
                {currency}{metrics.rmse}
              </span>
              <span className="text-[10px] text-slate-500">
                Root Mean Sq Error
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Sample Window
              </span>
              <span className="text-xl font-bold font-mono text-slate-200 mt-1 block">
                {metrics.sampleCount} Days
              </span>
              <span className="text-[10px] text-slate-500">
                Out-of-sample steps
              </span>
            </div>
          </div>

          {/* Detailed Walk-Forward Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Historical Out-Of-Sample Predictions
              </h3>
              <button
                onClick={handleDownloadCsv}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export Backtest CSV
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0 font-sans">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Actual Close</th>
                      <th className="py-2.5 px-3">Model Forecast</th>
                      <th className="py-2.5 px-3">Error</th>
                      <th className="py-2.5 px-3 text-right">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {backtestRows.map((row, idx) => {
                      const actual = row.actualClose || 0;
                      const pred = row.backtestPred || 0;
                      const err = Math.abs(actual - pred);
                      const isLowErr = err <= metrics.mae;

                      return (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3 font-sans font-medium text-slate-200">
                            {row.date}
                          </td>
                          <td className="py-2 px-3 font-bold">
                            {currency}{actual.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-indigo-300">
                            {currency}{pred.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {currency}{err.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isLowErr ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> High Fit
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                <XCircle className="w-3 h-3" /> Deviation
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
