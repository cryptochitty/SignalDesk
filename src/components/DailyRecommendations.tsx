import React, { useState, useEffect } from "react";
import {
  Flame,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  RefreshCw,
  Sparkles,
  Calendar,
  Zap,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { DailyRecommendation } from "../types";
import { DEFAULT_DAILY_RECOMMENDATIONS } from "../utils/dailyRecommendationsData";

interface DailyRecommendationsProps {
  onSelectStock: (symbol: string) => void;
}

export const DailyRecommendations: React.FC<DailyRecommendationsProps> = ({
  onSelectStock,
}) => {
  const [recommendations, setRecommendations] = useState<DailyRecommendation[]>(
    DEFAULT_DAILY_RECOMMENDATIONS
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedRecModal, setSelectedRecModal] = useState<DailyRecommendation | null>(null);

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const fetchDailyRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/daily-recommendations");
      if (res.ok) {
        const data = await res.json();
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        }
      }
    } catch (err) {
      console.warn("Using default daily recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyRecommendations();
  }, []);

  const categories = ["All", "NSE India", "US Tech", "Crypto"];

  const filteredRecs = recommendations.filter((item) => {
    if (activeCategory === "All") return true;
    return item.category.toLowerCase().includes(activeCategory.toLowerCase());
  });

  const getSignalBadge = (signal: string) => {
    switch (signal) {
      case "STRONG BUY":
        return (
          <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            STRONG BUY
          </span>
        );
      case "BUY":
        return (
          <span className="bg-emerald-500/15 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            BUY
          </span>
        );
      case "ACCUMULATE":
        return (
          <span className="bg-cyan-500/20 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            ACCUMULATE
          </span>
        );
      default:
        return (
          <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
            {signal}
          </span>
        );
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "Low":
        return <span className="text-emerald-400 font-semibold">Low Risk</span>;
      case "Medium":
        return <span className="text-amber-400 font-semibold">Medium Risk</span>;
      case "High":
        return <span className="text-rose-400 font-semibold">High Risk</span>;
      default:
        return <span>{risk}</span>;
    }
  };

  return (
    <section className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-5 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4 fill-amber-400/20" />
            </span>
            <h3 className="text-base font-bold text-white tracking-wide">
              Recommendations of the Day
            </h3>
            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1.5 font-mono font-medium">
              <Calendar className="w-3 h-3 text-indigo-400" />
              {currentDateStr}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Algorithmic & AI-curated stock picks based on momentum vectors, sentiment index, and quantitative convergence.
          </p>
        </div>

        {/* Controls: Category Filter & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDailyRecommendations}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
            title="Refresh Daily Recommendations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            <span className="hidden sm:inline">Refresh Picks</span>
          </button>
        </div>
      </div>

      {/* Grid of Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecs.map((rec) => (
          <div
            key={rec.id || rec.symbol}
            className="bg-slate-950/80 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition-all p-4 flex flex-col justify-between gap-3 group relative hover:shadow-lg hover:shadow-indigo-500/5"
          >
            {/* Top Row: Symbol & Signal */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-white group-hover:text-indigo-300 transition-colors">
                    {rec.symbol}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                    {rec.category}
                  </span>
                </div>
                <div className="text-xs text-slate-400 line-clamp-1">{rec.companyName}</div>
              </div>
              {getSignalBadge(rec.signal)}
            </div>

            {/* Price Targets Row */}
            <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Current</span>
                <span className="font-semibold text-slate-200">
                  {rec.currency}{rec.currentPrice}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Target</span>
                <span className="font-bold text-emerald-400">
                  {rec.currency}{rec.targetPrice}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Expected</span>
                <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  +{rec.expectedReturnPct}%
                </span>
              </div>
            </div>

            {/* Rationale Snippet */}
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed italic bg-slate-900/30 p-2 rounded border border-slate-800/40">
              "{rec.rationale}"
            </p>

            {/* Bottom Info & Action */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>{rec.timeframe}</span>
                <span>•</span>
                {getRiskBadge(rec.riskLevel)}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedRecModal(rec)}
                  className="px-2 py-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  Details
                </button>
                <button
                  onClick={() => onSelectStock(rec.symbol)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>Analyze</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedRecModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white font-mono">{selectedRecModal.symbol}</h4>
                  {getSignalBadge(selectedRecModal.signal)}
                </div>
                <p className="text-xs text-slate-400">{selectedRecModal.companyName} • {selectedRecModal.category}</p>
              </div>
              <button
                onClick={() => setSelectedRecModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">Current</span>
                <span className="text-sm font-bold text-slate-200">{selectedRecModal.currency}{selectedRecModal.currentPrice}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Target</span>
                <span className="text-sm font-bold text-emerald-400">{selectedRecModal.currency}{selectedRecModal.targetPrice}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Stop Loss</span>
                <span className="text-sm font-bold text-rose-400">{selectedRecModal.currency}{selectedRecModal.stopLoss}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Return</span>
                <span className="text-sm font-bold text-emerald-400">+{selectedRecModal.expectedReturnPct}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Quantitative Rationale
              </h5>
              <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                {selectedRecModal.rationale}
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Key Catalysts
              </h5>
              <div className="space-y-1.5">
                {selectedRecModal.keyCatalysts.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{cat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-mono">
                Timeframe: <span className="text-slate-200">{selectedRecModal.timeframe}</span>
              </div>
              <button
                onClick={() => {
                  const sym = selectedRecModal.symbol;
                  setSelectedRecModal(null);
                  onSelectStock(sym);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md"
              >
                <span>Run Full Forecast for {selectedRecModal.symbol}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
