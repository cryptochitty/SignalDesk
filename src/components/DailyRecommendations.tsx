import React, { useState, useEffect, useMemo } from "react";
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
  SlidersHorizontal,
  Search,
  Target,
  Award,
  DollarSign,
  Copy,
  Check,
  Smartphone,
  Layers,
  ArrowDownUp,
  ExternalLink,
  ChevronDown,
  Info,
} from "lucide-react";
import { DailyRecommendation } from "../types";
import { DEFAULT_DAILY_RECOMMENDATIONS } from "../utils/dailyRecommendationsData";
import { generateStockRecommendation, StockRecommendationDetails } from "../utils/stockRecommendationEngine";
import { MobileShareModal } from "./MobileShareModal";

interface DailyRecommendationsProps {
  onSelectStock: (symbol: string) => void;
  activeSymbol?: string;
  activeCompanyName?: string;
  activeCurrency?: string;
  activeCurrentPrice?: number;
  activeSentimentScore?: number;
  activeQuantTargetPrice?: number;
}

type SortOption = "rank" | "return_desc" | "return_asc" | "risk_asc" | "signal";
type MainTab = "ranked_picks" | "active_deepdive" | "portfolio_signals";

export const DailyRecommendations: React.FC<DailyRecommendationsProps> = ({
  onSelectStock,
  activeSymbol = "TATAMOTORS",
  activeCompanyName = "Tata Motors Ltd",
  activeCurrency = "₹",
  activeCurrentPrice = 965.50,
  activeSentimentScore = 65,
  activeQuantTargetPrice,
}) => {
  const [recommendations, setRecommendations] = useState<DailyRecommendation[]>(
    DEFAULT_DAILY_RECOMMENDATIONS
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("rank");
  const [selectedRecModal, setSelectedRecModal] = useState<DailyRecommendation | null>(null);
  const [currentTab, setCurrentTab] = useState<MainTab>("ranked_picks");

  // Active stock trade setup state
  const [copied, setCopied] = useState(false);
  const [positionQty, setPositionQty] = useState<number>(100);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);

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

  // Active stock recommendation calculations
  const activeStockDetails: StockRecommendationDetails = useMemo(() => {
    return generateStockRecommendation(
      activeSymbol,
      activeCompanyName,
      activeCurrency,
      activeCurrentPrice,
      activeSentimentScore,
      activeQuantTargetPrice
    );
  }, [activeSymbol, activeCompanyName, activeCurrency, activeCurrentPrice, activeSentimentScore, activeQuantTargetPrice]);

  const activePrice = activeStockDetails.currentPrice > 0 ? activeStockDetails.currentPrice : 100;
  const activeTarget1 = activeStockDetails.targetPrice;
  const activeTarget2 = parseFloat((activePrice * (1 + (activeStockDetails.expectedReturnPct * 1.6) / 100)).toFixed(2));
  const activeStopLoss = activeStockDetails.stopLoss;

  const t1GainPct = (((activeTarget1 - activePrice) / activePrice) * 100).toFixed(2);
  const t2GainPct = (((activeTarget2 - activePrice) / activePrice) * 100).toFixed(2);
  const slLossPct = (((activePrice - activeStopLoss) / activePrice) * 100).toFixed(2);

  const totalInvestment = (activePrice * positionQty).toFixed(2);
  const profitAtT1 = ((activeTarget1 - activePrice) * positionQty).toFixed(2);
  const profitAtT2 = ((activeTarget2 - activePrice) * positionQty).toFixed(2);
  const lossAtSL = ((activePrice - activeStopLoss) * positionQty).toFixed(2);

  // Filter and sort recommendations strictly in order
  const orderedRecommendations = useMemo(() => {
    let list = [...recommendations];

    // Filter by category
    if (activeCategory !== "All") {
      list = list.filter((item) =>
        item.category.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.symbol.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Sort in structured sequence
    list.sort((a, b) => {
      if (sortBy === "return_desc") {
        return b.expectedReturnPct - a.expectedReturnPct;
      }
      if (sortBy === "return_asc") {
        return a.expectedReturnPct - b.expectedReturnPct;
      }
      if (sortBy === "risk_asc") {
        const riskWeight: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
        return (riskWeight[a.riskLevel] || 2) - (riskWeight[b.riskLevel] || 2);
      }
      if (sortBy === "signal") {
        const signalWeight: Record<string, number> = {
          "STRONG BUY": 4,
          BUY: 3,
          ACCUMULATE: 2,
          HOLD: 1,
          WATCH: 0,
        };
        return (signalWeight[b.signal] || 0) - (signalWeight[a.signal] || 0);
      }
      // Default: Conviction Rank (initial order)
      return 0;
    });

    return list;
  }, [recommendations, activeCategory, searchQuery, sortBy]);

  // Verified portfolio holdings signal list
  const portfolioHoldingSignals = [
    {
      symbol: "CANHLIFE",
      name: "Canara HSBC Life",
      ltp: 154.19,
      action: "ACCUMULATE DIP",
      target: 168.00,
      stopLoss: 148.00,
      expectedReturn: "+8.95%",
      urgency: "MEDIUM",
      risk: "Low",
      reason: "Bancassurance expansion and robust VNB margin growth.",
    },
    {
      symbol: "MEESHO",
      name: "Meesho Inc (Pre-IPO)",
      ltp: 208.63,
      action: "ACCUMULATE DIP",
      target: 228.00,
      stopLoss: 198.00,
      expectedReturn: "+9.28%",
      urgency: "HIGH",
      risk: "Medium",
      reason: "Pre-DRHP institutional base building above ₹202.50 support.",
    },
    {
      symbol: "PINELABS",
      name: "Pine Labs (Pre-IPO)",
      ltp: 165.10,
      action: "HOLD & MONITOR",
      target: 185.00,
      stopLoss: 156.00,
      expectedReturn: "+12.05%",
      urgency: "OPPORTUNITY",
      risk: "Medium",
      reason: "POS merchant volume resurgence and Singapore-to-India domicile shift.",
    },
    {
      symbol: "PWL",
      name: "Premier Polyfilm Ltd",
      ltp: 119.46,
      action: "TRAIL STOP LOSS",
      target: 135.00,
      stopLoss: 115.00,
      expectedReturn: "+13.01%",
      urgency: "HIGH",
      risk: "High",
      reason: "Downside support test at ₹118.00 floor; guard against slippage.",
    },
    {
      symbol: "SILVERCASE",
      name: "Zerodha Silver Case ETF",
      ltp: 24.49,
      action: "TRIM ON BOUNCE",
      target: 26.50,
      stopLoss: 23.50,
      expectedReturn: "+8.21%",
      urgency: "HIGH",
      risk: "Medium",
      reason: "Reduce 55.7% portfolio concentration on test of ₹25.20 resistance.",
    },
    {
      symbol: "SILVERBEES",
      name: "Nippon India Silver ETF",
      ltp: 230.42,
      action: "HOLD CORE HEDGE",
      target: 248.00,
      stopLoss: 222.00,
      expectedReturn: "+7.63%",
      urgency: "PASSIVE",
      risk: "Low",
      reason: "Physical precious metals hedge tracking global spot silver rally.",
    },
  ];

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
      case "ACCUMULATE DIP":
        return (
          <span className="bg-cyan-500/20 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            ACCUMULATE
          </span>
        );
      case "HOLD":
      case "HOLD & MONITOR":
      case "HOLD CORE HEDGE":
        return (
          <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            HOLD
          </span>
        );
      case "TRIM ON BOUNCE":
      case "TRAIL STOP LOSS":
        return (
          <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            REBALANCE
          </span>
        );
      default:
        return (
          <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-700">
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

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <span className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-500/30 to-yellow-600/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
            🥇 #1 TOP CONVICTION
          </span>
        );
      case 1:
        return (
          <span className="px-2 py-0.5 rounded bg-gradient-to-r from-slate-400/30 to-slate-500/30 text-slate-200 border border-slate-400/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
            🥈 #2 HIGH ALPHA
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-700/30 to-amber-800/30 text-amber-400 border border-amber-700/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
            🥉 #3 MOMENTUM VALUE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider">
            #{index + 1} QUANT PICK
          </span>
        );
    }
  };

  const handleCopyActivePlan = () => {
    const text = `🎯 Trade Setup for ${activeStockDetails.companyName} (${activeStockDetails.symbol}):
Signal: ${activeStockDetails.signal}
Current Price (LTP): ${activeCurrency}${activePrice}
Entry Zone: ${activeStockDetails.entryZone}
Target 1 (Base): ${activeCurrency}${activeTarget1} (+${t1GainPct}%)
Target 2 (Extended): ${activeCurrency}${activeTarget2} (+${t2GainPct}%)
Stop Loss: ${activeCurrency}${activeStopLoss} (-${slLossPct}%)
Risk/Reward Ratio: ${activeStockDetails.riskRewardRatio}
Position Size: ${positionQty} units
- Estimated Capital: ${activeCurrency}${totalInvestment}
- Projected Gain @ T1: +${activeCurrency}${profitAtT1}
- Projected Gain @ T2: +${activeCurrency}${profitAtT2}
- Maximum Risk @ SL: -${activeCurrency}${lossAtSL}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="stock-recommendations-hub"
      className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden backdrop-blur-md"
    >
      {/* Decorative Gradient Glows */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Award className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
              AI Stock Recommendations & Action Desk
            </h2>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-mono font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {currentDateStr}
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Consolidated algorithmic trade setups, ordered daily conviction picks, and holding optimization signals.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start lg:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setCurrentTab("ranked_picks")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === "ranked_picks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Ranked Picks ({orderedRecommendations.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab("active_deepdive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === "active_deepdive"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Trade: {activeSymbol}</span>
          </button>

          <button
            onClick={() => setCurrentTab("portfolio_signals")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === "portfolio_signals"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Holdings Actions (7)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RANKED DAILY RECOMMENDATIONS (ORDERED & FILTERABLE)                */}
      {/* ========================================================================= */}
      {currentTab === "ranked_picks" && (
        <div className="space-y-4">
          {/* Filter, Search & Sorting Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/90">
            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input & Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter ticker / name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs pl-8 pr-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Structured Sorting Selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                <ArrowDownUp className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort recommendations"
                  className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="rank" className="bg-slate-900 text-slate-200">
                    Conviction Rank (#1 → #6)
                  </option>
                  <option value="return_desc" className="bg-slate-900 text-slate-200">
                    Highest Expected Return (%)
                  </option>
                  <option value="risk_asc" className="bg-slate-900 text-slate-200">
                    Lowest Risk First
                  </option>
                  <option value="signal" className="bg-slate-900 text-slate-200">
                    Signal Strength
                  </option>
                </select>
              </div>

              <button
                onClick={fetchDailyRecommendations}
                disabled={loading}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all disabled:opacity-50"
                title="Refresh Quantitative Recommendations"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Ordered Grid of Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orderedRecommendations.map((rec, index) => {
              const isCurrentActive = rec.symbol.toUpperCase() === activeSymbol.toUpperCase();

              return (
                <div
                  key={rec.id || rec.symbol}
                  className={`bg-slate-950/90 rounded-xl border transition-all p-4 flex flex-col justify-between gap-3.5 group relative hover:shadow-xl ${
                    isCurrentActive
                      ? "border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/40"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Top Bar: Rank Tag & Signal Badge */}
                  <div className="flex items-center justify-between gap-2">
                    {getRankBadge(index)}
                    {getSignalBadge(rec.signal)}
                  </div>

                  {/* Stock Symbol, Company Name & Category */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold font-mono text-white group-hover:text-indigo-300 transition-colors">
                        {rec.symbol}
                      </span>
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800">
                        {rec.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{rec.companyName}</div>
                  </div>

                  {/* Precise Price Target Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">LTP</span>
                      <span className="font-bold text-slate-200">
                        {rec.currency}{rec.currentPrice.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Target</span>
                      <span className="font-bold text-emerald-400">
                        {rec.currency}{rec.targetPrice.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Upside</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +{rec.expectedReturnPct}%
                      </span>
                    </div>
                  </div>

                  {/* Thesis Rationale */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-800/50">
                    "{rec.rationale}"
                  </p>

                  {/* Catalysts Chips */}
                  {rec.keyCatalysts && rec.keyCatalysts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rec.keyCatalysts.slice(0, 2).map((cat, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[10px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20 font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer & Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
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
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                      >
                        <span>Analyze</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACTIVE SELECTED STOCK TRADE SETUP & POSITION SIZER                 */}
      {/* ========================================================================= */}
      {currentTab === "active_deepdive" && (
        <div className="space-y-4">
          {/* Active Stock Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 p-4 rounded-xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono text-white">{activeStockDetails.symbol}</span>
                <span className="text-xs text-slate-400 font-medium">{activeStockDetails.companyName}</span>
                {getSignalBadge(activeStockDetails.signal)}
              </div>
              <p className="text-xs text-slate-400">
                Optimal Entry Zone: <strong className="text-indigo-300 font-mono">{activeStockDetails.entryZone}</strong> • Risk/Reward: <strong className="text-emerald-400 font-mono">1:{activeStockDetails.riskRewardRatio}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setIsMobileModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-700/60 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp / Mobile</span>
              </button>

              <button
                onClick={handleCopyActivePlan}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-750 transition-all text-xs font-semibold flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Plan Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Trade Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3 Core Pillars: LTP, Target Price, Stop Loss */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Pillar 1: Current Price */}
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-1 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  Current Price (LTP)
                </span>
                <span className="text-[10px] font-mono bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  Live
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white pt-1">
                {activeCurrency}{activePrice.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Entry Zone:</span>
                <span className="text-slate-200 font-mono font-semibold">{activeStockDetails.entryZone}</span>
              </div>
            </div>

            {/* Pillar 2: Target Prices */}
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-1 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  Target Price (T1)
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  +{t1GainPct}% Upside
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 pt-1">
                {activeCurrency}{activeTarget1.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Extended Target 2:</span>
                <span className="text-emerald-300 font-mono font-semibold">
                  {activeCurrency}{activeTarget2.toLocaleString()} (+{t2GainPct}%)
                </span>
              </div>
            </div>

            {/* Pillar 3: Stop Loss */}
            <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/30 space-y-1 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Stop Loss (SL)
                </span>
                <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                  -{slLossPct}% Max Risk
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-rose-400 pt-1">
                {activeCurrency}{activeStopLoss.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Trailing Stop Floor:</span>
                <span className="text-rose-300 font-mono font-semibold">
                  {activeCurrency}{parseFloat((activePrice * 0.97).toFixed(2))}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Position Sizer & P&L Calculator */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Dynamic Position Sizer & Profit Simulator
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Position Quantity:</span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={positionQty}
                  onChange={(e) => setPositionQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 bg-slate-900 border border-slate-700 text-white font-mono text-xs px-2.5 py-1 rounded-lg text-right focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Total Capital</span>
                <span className="text-sm font-bold text-slate-200">{activeCurrency}{totalInvestment}</span>
              </div>
              <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 uppercase block">Gain @ Target 1</span>
                <span className="text-sm font-bold text-emerald-400">+{activeCurrency}{profitAtT1}</span>
              </div>
              <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 uppercase block">Gain @ Target 2</span>
                <span className="text-sm font-bold text-emerald-300">+{activeCurrency}{profitAtT2}</span>
              </div>
              <div className="bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/20">
                <span className="text-[10px] text-rose-400 uppercase block">Max Risk @ SL</span>
                <span className="text-sm font-bold text-rose-400">-{activeCurrency}{lossAtSL}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VERIFIED KITE HOLDINGS ACTIONS & SIGNALS                            */}
      {/* ========================================================================= */}
      {currentTab === "portfolio_signals" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Quantitative Recommendations for your 7 Synchronized Zerodha Kite Holdings:</span>
            <span className="font-mono text-emerald-400">7 Active Signals</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {portfolioHoldingSignals.map((item, idx) => (
              <div
                key={item.symbol}
                className="bg-slate-950/90 rounded-xl border border-slate-800 hover:border-indigo-500/40 p-3.5 space-y-2.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-white">{item.symbol}</span>
                    <span className="text-[10px] text-slate-400">({item.name})</span>
                  </div>
                  {getSignalBadge(item.action)}
                </div>

                <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-center font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">LTP</span>
                    <span className="font-semibold text-slate-200">₹{item.ltp}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">Target</span>
                    <span className="font-bold text-emerald-400">₹{item.target}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase">Potential</span>
                    <span className="font-bold text-emerald-400">{item.expectedReturn}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed italic bg-slate-900/30 p-2 rounded border border-slate-800/40">
                  "{item.reason}"
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                  <div className="text-[10px] text-slate-400 font-mono">
                    Urgency: <span className="text-amber-300 font-bold">{item.urgency}</span>
                  </div>
                  <button
                    onClick={() => onSelectStock(item.symbol)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FULL QUANTITATIVE THESIS & CATALYST BREAKDOWN                      */}
      {/* ========================================================================= */}
      {selectedRecModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white font-mono">{selectedRecModal.symbol}</h4>
                  {getSignalBadge(selectedRecModal.signal)}
                </div>
                <p className="text-xs text-slate-400">
                  {selectedRecModal.companyName} • {selectedRecModal.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Current</span>
                <span className="text-sm font-bold text-slate-200">
                  {selectedRecModal.currency}{selectedRecModal.currentPrice}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Target</span>
                <span className="text-sm font-bold text-emerald-400">
                  {selectedRecModal.currency}{selectedRecModal.targetPrice}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Stop Loss</span>
                <span className="text-sm font-bold text-rose-400">
                  {selectedRecModal.currency}{selectedRecModal.stopLoss}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Upside</span>
                <span className="text-sm font-bold text-emerald-400">
                  +{selectedRecModal.expectedReturnPct}%
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Quantitative Thesis
              </h5>
              <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                {selectedRecModal.rationale}
              </p>
            </div>

            {selectedRecModal.keyCatalysts && selectedRecModal.keyCatalysts.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Key Catalysts
                </h5>
                <div className="space-y-1.5">
                  {selectedRecModal.keyCatalysts.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/50"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400 font-mono">
                Horizon: <span className="text-slate-200">{selectedRecModal.timeframe}</span>
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

      {/* WhatsApp / SMS Mobile Share Modal */}
      <MobileShareModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        symbol={activeStockDetails.symbol}
        companyName={activeStockDetails.companyName}
        currency={activeCurrency}
        currentPrice={activePrice}
        targetPrice={activeTarget1}
        stopLossPrice={activeStopLoss}
        confidencePct={88}
        signal={
          activeStockDetails.signal === "STRONG BUY" || activeStockDetails.signal === "BUY"
            ? (activeStockDetails.signal as any)
            : "BUY"
        }
      />
    </section>
  );
};
