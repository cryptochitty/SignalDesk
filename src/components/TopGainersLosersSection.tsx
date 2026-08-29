import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  Flame,
  Layers,
  ChevronRight,
  Filter,
  BarChart2,
  Sparkles,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { MarketMover, TopGainersLosersData } from "../types";

interface TopGainersLosersSectionProps {
  onSelectStock: (symbol: string) => void;
  activeStockSymbol?: string;
}

export const TopGainersLosersSection: React.FC<TopGainersLosersSectionProps> = ({
  onSelectStock,
  activeStockSymbol,
}) => {
  const [data, setData] = useState<TopGainersLosersData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"gainers" | "losers" | "mostActive">("gainers");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/top-gainers-losers");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn("Failed to fetch top gainers/losers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 20000); // 20s live refresh
    return () => clearInterval(timer);
  }, []);

  const categories = ["All", "NSE India", "US Tech", "Crypto", "Commodities"];

  const getActiveList = (): MarketMover[] => {
    if (!data) return [];
    let list: MarketMover[] = [];
    if (activeTab === "gainers") list = data.gainers;
    else if (activeTab === "losers") list = data.losers;
    else list = data.mostActive;

    return list.filter((item) => {
      const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.exchange.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  };

  const currentList = getActiveList();

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className={`absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none transition-colors duration-500 ${
          activeTab === "gainers"
            ? "bg-emerald-500"
            : activeTab === "losers"
            ? "bg-rose-500"
            : "bg-indigo-500"
        }`}
      />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border transition-colors ${
              activeTab === "gainers"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : activeTab === "losers"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            }`}
          >
            {activeTab === "gainers" ? (
              <TrendingUp className="w-5 h-5" />
            ) : activeTab === "losers" ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <Activity className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                TOP GAINERS & LOSERS OF THE DAY
              </h2>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                Live Kite Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time market movers, volume surges, breakout momentum & one-click quant analysis
            </p>
          </div>
        </div>

        {/* Market Breadth Gauge & Live Sync Indicator */}
        <div className="flex flex-wrap items-center gap-3">
          {data && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {data.advanceCount} Adv
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {data.declineCount} Dec
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-300 font-semibold">
                Breadth: {data.marketBreadthPct}%
              </span>
            </div>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Refresh live movers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Mode Tabs (Gainers / Losers / Most Active) & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Main Tab Switches */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("gainers")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "gainers"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Top Gainers</span>
            {data && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono">
                {data.gainers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("losers")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "losers"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Top Losers</span>
            {data && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 font-mono">
                {data.losers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("mostActive")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "mostActive"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Most Active (Vol)</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Market Mover Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {currentList.map((item) => {
          const isGainer = item.changePct > 0;
          const isSelected = activeStockSymbol?.toUpperCase() === item.symbol.toUpperCase();

          return (
            <div
              key={item.symbol}
              className={`bg-slate-950 p-4 rounded-xl border transition-all space-y-3 relative group flex flex-col justify-between ${
                isSelected
                  ? "border-cyan-500/70 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/10"
                  : "border-slate-800/90 hover:border-slate-700"
              }`}
            >
              <div>
                {/* Card Top Row: Symbol, Exchange & Signal Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono tracking-tight group-hover:text-cyan-300 transition-colors">
                      {item.symbol}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {item.exchange}
                    </span>
                    {item.kiteToken && (
                      <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20" title={`Zerodha Kite Token #${item.kiteToken}`}>
                        ⚡ #{item.kiteToken}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      item.intradaySignal === "STRONG BUY"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : item.intradaySignal === "BUY" || item.intradaySignal === "ACCUMULATE"
                        ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                        : item.intradaySignal === "SELL"
                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {item.intradaySignal}
                  </span>
                </div>

                {/* Company Name */}
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {item.name}
                </p>

                {/* Price, Change & Stats Row */}
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">
                      Live Price (LTP)
                    </span>
                    <span className="text-lg font-mono font-bold text-white">
                      {item.currency}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">
                      Day Return
                    </span>
                    <div
                      className={`text-sm font-mono font-bold flex items-center justify-end gap-0.5 ${
                        isGainer ? "text-emerald-400" : item.changePct < 0 ? "text-rose-400" : "text-slate-400"
                      }`}
                    >
                      {isGainer ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : item.changePct < 0 ? (
                        <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : null}
                      <span>
                        {isGainer ? "+" : ""}
                        {(item.changePct ?? 0).toFixed(2)}%
                      </span>
                      <span className="text-[10px] font-normal opacity-80">
                        ({isGainer ? "+" : ""}{(item.change ?? 0).toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Range & Volume Details */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 text-[10px] font-mono">
                  <div>
                    <span className="text-slate-400 block">Day Range:</span>
                    <span className="text-slate-200">
                      {item.currency}{item.low} - {item.currency}{item.high}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Volume:</span>
                    <span className="text-cyan-300 font-semibold">{item.volumeFormatted} shares</span>
                  </div>
                </div>

                {/* Key Catalyst Phrase */}
                <div className="mt-2 text-[10px] text-slate-400 italic line-clamp-1">
                  💡 {item.keyCatalyst}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  Sentiment: <strong className="text-slate-200">{item.sentimentScore}/100</strong>
                </span>

                <button
                  onClick={() => onSelectStock(item.symbol)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                      : "bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white"
                  }`}
                >
                  <span>{isSelected ? "Active in Cockpit" : "Analyze & Predict"}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {currentList.length === 0 && (
        <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-slate-400 space-y-2">
          <p className="text-sm font-semibold">No market movers match the selected filter criteria.</p>
          <button
            onClick={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
            className="text-xs text-cyan-400 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
};
