import React, { useState, useMemo } from "react";
import {
  Coins,
  TrendingUp,
  Percent,
  ShieldAlert,
  Star,
  Search,
  SlidersHorizontal,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Layers,
  Zap,
  Info,
  DollarSign,
  Scale,
  Award,
  Bookmark,
  Building2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { MutualFundSuggestion } from "../types";
import { SAMPLE_MUTUAL_FUNDS } from "../utils/mutualFundData";

interface MutualFundSuggestionsProps {
  currentStockSymbol?: string;
  currency?: string;
}

export const MutualFundSuggestions: React.FC<MutualFundSuggestionsProps> = ({
  currentStockSymbol = "STOCK",
  currency = "₹",
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedRisk, setSelectedRisk] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"cagr3Y" | "dividendYield" | "expenseRatio" | "starRating">("cagr3Y");
  const [searchQuery, setSearchQuery] = useState("");
  const [presetStrategy, setPresetStrategy] = useState<"all" | "dividend" | "growth" | "low_risk" | "top_rated">("all");

  // Factor Sliders for Custom AI Weighting (0 to 100)
  const [returnWeight, setReturnWeight] = useState(50);
  const [dividendWeight, setDividendWeight] = useState(30);
  const [lowCostWeight, setLowCostWeight] = useState(20);

  // SIP Calculator State
  const [selectedFundForSip, setSelectedFundForSip] = useState<MutualFundSuggestion | null>(SAMPLE_MUTUAL_FUNDS[0]);
  const [sipMonthlyAmount, setSipMonthlyAmount] = useState<number>(5000);
  const [sipDurationYears, setSipDurationYears] = useState<number>(5);

  // Fund Comparison State
  const [compareFundIds, setCompareFundIds] = useState<string[]>(["mf-1", "mf-2"]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Preset Strategy Quick Handler
  const handleSelectPreset = (preset: "all" | "dividend" | "growth" | "low_risk" | "top_rated") => {
    setPresetStrategy(preset);
    if (preset === "dividend") {
      setSelectedCategory("Dividend Yield");
      setSortBy("dividendYield");
      setDividendWeight(80);
      setReturnWeight(20);
    } else if (preset === "growth") {
      setSelectedCategory("All");
      setSortBy("cagr3Y");
      setReturnWeight(80);
      setDividendWeight(10);
    } else if (preset === "low_risk") {
      setSelectedRisk("Low");
      setSortBy("expenseRatio");
      setLowCostWeight(70);
    } else if (preset === "top_rated") {
      setSelectedCategory("All");
      setSelectedRisk("All");
      setSortBy("starRating");
    } else {
      setSelectedCategory("All");
      setSelectedRisk("All");
      setSortBy("cagr3Y");
    }
  };

  // Filtered & Ranked Mutual Funds
  const processedFunds = useMemo(() => {
    return SAMPLE_MUTUAL_FUNDS.filter((fund) => {
      // Category filter
      if (selectedCategory !== "All" && fund.category !== selectedCategory) return false;
      // Risk filter
      if (selectedRisk !== "All" && fund.riskRating !== selectedRisk) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = fund.fundName.toLowerCase().includes(q);
        const matchesHouse = fund.fundHouse.toLowerCase().includes(q);
        const matchesHoldings = fund.topHoldings.some((h) => h.toLowerCase().includes(q));
        if (!matchesName && !matchesHouse && !matchesHoldings) return false;
      }
      return true;
    }).map((fund) => {
      // Calculate composite score (0 - 100) based on factor weighting
      // Normalizing CAGR (0 to 35), Dividend (0 to 5%), Expense (lower is better: 0 to 1%)
      const normReturn = (fund.cagr3Y / 35) * 100;
      const normDiv = (fund.dividendYield / 5) * 100;
      const normCost = ((1.0 - fund.expenseRatio) / 1.0) * 100;

      const totalW = returnWeight + dividendWeight + lowCostWeight || 1;
      const compositeScore = Math.min(
        99.9,
        Math.max(
          10,
          (normReturn * returnWeight + normDiv * dividendWeight + normCost * lowCostWeight) / totalW
        )
      );

      return {
        ...fund,
        compositeScore: parseFloat(compositeScore.toFixed(1)),
      };
    }).sort((a, b) => {
      if (sortBy === "cagr3Y") return b.cagr3Y - a.cagr3Y;
      if (sortBy === "dividendYield") return b.dividendYield - a.dividendYield;
      if (sortBy === "expenseRatio") return a.expenseRatio - b.expenseRatio; // Lower is better
      if (sortBy === "starRating") return b.starRating - a.starRating;
      return b.compositeScore - a.compositeScore;
    });
  }, [selectedCategory, selectedRisk, searchQuery, sortBy, returnWeight, dividendWeight, lowCostWeight]);

  // SIP Future Value Calculation
  const sipCalculation = useMemo(() => {
    if (!selectedFundForSip) return { totalInvested: 0, estimatedCorpus: 0, estimatedWealthGain: 0, totalDividends: 0 };

    const ratePct = selectedFundForSip.cagr3Y || 15;
    const monthlyRate = ratePct / 12 / 100;
    const totalMonths = sipDurationYears * 12;

    const totalInvested = sipMonthlyAmount * totalMonths;
    // SIP Formula: P * [((1 + i)^n - 1) / i] * (1 + i)
    const futureValue =
      sipMonthlyAmount *
      (((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate));

    const estimatedWealthGain = Math.max(0, futureValue - totalInvested);

    // Dividend Yield contribution estimate
    const annualDivRate = selectedFundForSip.dividendYield / 100;
    const totalDividends = totalInvested * annualDivRate * (sipDurationYears / 2);

    return {
      totalInvested: Math.round(totalInvested),
      estimatedCorpus: Math.round(futureValue),
      estimatedWealthGain: Math.round(estimatedWealthGain),
      totalDividends: Math.round(totalDividends),
    };
  }, [selectedFundForSip, sipMonthlyAmount, sipDurationYears]);

  const toggleCompareFund = (id: string) => {
    if (compareFundIds.includes(id)) {
      setCompareFundIds(compareFundIds.filter((f) => f !== id));
    } else {
      if (compareFundIds.length >= 3) {
        alert("You can compare up to 3 mutual funds side-by-side.");
        return;
      }
      setCompareFundIds([...compareFundIds, id]);
    }
  };

  const comparedFunds = SAMPLE_MUTUAL_FUNDS.filter((f) => compareFundIds.includes(f.id));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                MUTUAL FUND & ETF INVESTMENT SUGGESTIONS
              </h2>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                QUANT FACTOR RANKING
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Filter mutual funds by <span className="text-emerald-400 font-bold">Annualized Return (3Y/5Y)</span>,{" "}
              <span className="text-amber-300 font-bold">Dividend Yield (%)</span>,{" "}
              <span className="text-indigo-300 font-bold">Expense Ratio</span>, & <span className="text-sky-300 font-bold">Risk Rating</span>.
            </p>
          </div>
        </div>

        {/* Comparison Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsCompareOpen(!isCompareOpen)}
          className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto shrink-0 shadow-sm"
        >
          <Scale className="w-4 h-4 text-amber-400" />
          <span>Compare Funds ({compareFundIds.length})</span>
        </button>
      </div>

      {/* Preset Strategy Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          Strategy Presets:
        </span>
        <button
          type="button"
          onClick={() => handleSelectPreset("all")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            presetStrategy === "all"
              ? "bg-amber-500 text-slate-950"
              : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          All High-Performers
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset("dividend")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
            presetStrategy === "dividend"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <span>💰 High Dividend Income</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset("growth")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
            presetStrategy === "growth"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <span>🚀 High CAGR Growth</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset("low_risk")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
            presetStrategy === "low_risk"
              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
              : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <span>🛡️ Low Risk Preservation</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset("top_rated")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
            presetStrategy === "top_rated"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
              : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <span>⭐ 5-Star Morningstar Rated</span>
        </button>
      </div>

      {/* Factor Weighting & Filter Toolbar */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fund Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Categories</option>
              <option value="Dividend Yield">Dividend Yield Funds</option>
              <option value="Large Cap">Large Cap Funds</option>
              <option value="Mid Cap">Mid & Small Cap</option>
              <option value="Flexi Cap">Flexi Cap / Multi Cap</option>
              <option value="Debt & Hybrid">Debt & Hybrid Funds</option>
              <option value="Global / Tech">Global & Technology ETFs</option>
            </select>
          </div>

          {/* Risk Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Risk Profile
            </label>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="High">High Risk</option>
              <option value="Very High">Very High Risk</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Primary Sorting Factor
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="cagr3Y">3-Year Annualized Return (CAGR)</option>
              <option value="dividendYield">Highest Dividend Yield (%)</option>
              <option value="expenseRatio">Lowest Expense Ratio (%)</option>
              <option value="starRating">Morningstar Star Rating</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Search Fund or Holding
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Dividend, ICICI, Reliance..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Quant Custom Factor Sliders (Factor Weighting) */}
        <div className="border-t border-slate-800/80 pt-3 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            Quant Factor Preference Weighting (Custom Multi-Factor Score)
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Slider 1: Return Weight */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  Return (CAGR) Priority
                </span>
                <span className="font-mono">{returnWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={returnWeight}
                onChange={(e) => setReturnWeight(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 2: Dividend Yield Weight */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1 text-amber-400">
                  <Percent className="w-3 h-3" />
                  Dividend Yield Priority
                </span>
                <span className="font-mono">{dividendWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={dividendWeight}
                onChange={(e) => setDividendWeight(parseInt(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 3: Low Cost Expense Weight */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1 text-indigo-400">
                  <DollarSign className="w-3 h-3" />
                  Low Expense Ratio Priority
                </span>
                <span className="font-mono">{lowCostWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={lowCostWeight}
                onChange={(e) => setLowCostWeight(parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Drawer (if open) */}
      {isCompareOpen && (
        <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              Side-by-Side Factor Comparison Matrix
            </span>
            <button
              type="button"
              onClick={() => setIsCompareOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              Close Comparison
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-mono">
                  <th className="py-2 px-3">Factor / Metric</th>
                  {comparedFunds.map((f) => (
                    <th key={f.id} className="py-2 px-3 font-bold text-white">
                      {f.fundName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold font-sans">Category</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 text-slate-200">
                      {f.category}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold font-sans">3Y CAGR (%)</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 font-bold text-emerald-400">
                      +{f.cagr3Y}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold font-sans">Dividend Yield (%)</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 font-bold text-amber-400">
                      {f.dividendYield}% ({f.dividendFrequency})
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold font-sans">Expense Ratio</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 text-indigo-300">
                      {f.expenseRatio}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold font-sans">Risk Rating</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 text-sky-300">
                      {f.riskRating}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-bold font-sans">Star Rating</td>
                  {comparedFunds.map((f) => (
                    <td key={f.id} className="py-2.5 px-3 text-amber-400 font-bold">
                      {"★".repeat(f.starRating)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ranked Mutual Funds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processedFunds.map((fund, rank) => {
          const isSelectedForSip = selectedFundForSip?.id === fund.id;
          const isCompared = compareFundIds.includes(fund.id);

          return (
            <div
              key={fund.id}
              className={`bg-slate-950/90 border rounded-xl p-4 space-y-3 transition-all relative flex flex-col justify-between ${
                isSelectedForSip
                  ? "border-amber-500 shadow-lg shadow-amber-500/10"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Card Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                    RANK #{rank + 1} · {fund.category}
                  </span>

                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{fund.starRating}.0</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug hover:text-amber-300 transition-colors">
                  {fund.fundName}
                </h3>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  {fund.fundHouse}
                </p>
              </div>

              {/* Key Investment Factors Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 my-2">
                {/* 3Y CAGR */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">3Y Annual Return</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    +{fund.cagr3Y}%
                  </span>
                </div>

                {/* Dividend Yield */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Dividend Yield</span>
                  <span className="text-base font-black font-mono text-amber-400 flex items-center gap-0.5">
                    {fund.dividendYield}%
                    <span className="text-[9px] text-slate-400 font-sans font-normal">({fund.dividendFrequency})</span>
                  </span>
                </div>

                {/* Expense Ratio */}
                <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Expense Ratio</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {fund.expenseRatio}%
                  </span>
                </div>

                {/* Risk Profile */}
                <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Risk Profile</span>
                  <span
                    className={`text-xs font-bold ${
                      fund.riskRating === "Low"
                        ? "text-emerald-400"
                        : fund.riskRating === "Moderate"
                        ? "text-sky-300"
                        : "text-rose-400"
                    }`}
                  >
                    {fund.riskRating}
                  </span>
                </div>
              </div>

              {/* Top Holdings Tags */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono">Top Holdings:</span>
                <div className="flex flex-wrap gap-1">
                  {fund.topHoldings.slice(0, 4).map((h, i) => (
                    <span
                      key={i}
                      className="text-[9px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 font-mono"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFundForSip(fund)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isSelectedForSip
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{isSelectedForSip ? "Active in SIP Calculator" : "Simulate SIP"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCompareFund(fund.id)}
                  className={`text-[11px] px-2 py-1 rounded font-semibold transition-all cursor-pointer ${
                    isCompared
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isCompared ? "✓ Comparing" : "+ Compare"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive SIP Wealth Growth Calculator */}
      {selectedFundForSip && (
        <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Interactive SIP Wealth Simulator for</span>
                  <span className="text-amber-300 font-bold">{selectedFundForSip.fundName}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Simulates monthly compounding growth based on historical 3Y CAGR ({selectedFundForSip.cagr3Y}%) and Dividend Yield ({selectedFundForSip.dividendYield}%)
                </p>
              </div>
            </div>

            <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 self-start md:self-auto">
              Min SIP: {selectedFundForSip.currency}{selectedFundForSip.minSipAmount}/mo
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calculator Controls */}
            <div className="space-y-4 lg:col-span-1">
              {/* Monthly SIP Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>Monthly Investment (SIP)</span>
                  <span className="text-amber-400 font-mono">
                    {selectedFundForSip.currency}{sipMonthlyAmount.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={sipMonthlyAmount}
                  onChange={(e) => setSipMonthlyAmount(parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Investment Horizon */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>Investment Horizon (Years)</span>
                  <span className="text-amber-400 font-mono">{sipDurationYears} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={sipDurationYears}
                  onChange={(e) => setSipDurationYears(parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Wealth Outcomes Display */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Invested */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Amount Invested</span>
                <div className="text-xl font-black font-mono text-slate-200">
                  {selectedFundForSip.currency}{sipCalculation.totalInvested.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500">Over {sipDurationYears} years</p>
              </div>

              {/* Estimated Capital Gain */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Estimated Capital Gain</span>
                <div className="text-xl font-black font-mono text-emerald-400">
                  +{selectedFundForSip.currency}{sipCalculation.estimatedWealthGain.toLocaleString()}
                </div>
                <p className="text-[10px] text-emerald-500/80 font-mono">
                  CAGR Compounding Effect
                </p>
              </div>

              {/* Total Future Corpus */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-amber-300 uppercase">Total Projected Value</span>
                <div className="text-2xl font-black font-mono text-amber-300">
                  {selectedFundForSip.currency}{sipCalculation.estimatedCorpus.toLocaleString()}
                </div>
                <p className="text-[10px] text-amber-400/90 font-mono">
                  Includes Dividends & Growth
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
