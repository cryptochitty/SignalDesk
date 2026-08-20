import React, { useState } from "react";
import { Search, Sparkles, RefreshCw, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

interface StockSearchBarProps {
  onSearchStock: (query: string) => Promise<void>;
  isSearching: boolean;
  searchError: string | null;
  activeStockSymbol: string;
  activeCompanyName?: string;
  activeDataSource?: string | null;
}

const POPULAR_SUGGESTIONS = [
  { name: "Meesho", symbol: "MEESHO", icon: "🇮🇳" },
  { name: "TVS Holdings", symbol: "TVSHLTD", icon: "🇮🇳" },
  { name: "TVS Electronics", symbol: "TVSELECT", icon: "🇮🇳" },
  { name: "Ola Electric", symbol: "OLAELEC", icon: "🇮🇳" },
  { name: "Tata Motors", symbol: "TATAMOTORS", icon: "🇮🇳" },
  { name: "Reliance", symbol: "RELIANCE", icon: "🇮🇳" },
  { name: "Infosys", symbol: "INFY", icon: "🇮🇳" },
  { name: "Nvidia", symbol: "NVDA", icon: "🇺🇸" },
  { name: "Tesla", symbol: "TSLA", icon: "🇺🇸" },
  { name: "Bitcoin (Hyperliquid)", symbol: "HL:BTC", icon: "💧" },
  { name: "Ethereum (Hyperliquid)", symbol: "HL:ETH", icon: "💧" },
  { name: "Solana (Hyperliquid)", symbol: "HL:SOL", icon: "💧" },
];

export const StockSearchBar: React.FC<StockSearchBarProps> = ({
  onSearchStock,
  isSearching,
  searchError,
  activeStockSymbol,
  activeCompanyName,
  activeDataSource,
}) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim() || isSearching) return;
    onSearchStock(searchInput.trim());
  };

  const handleQuickSelect = (query: string) => {
    setSearchInput(query);
    onSearchStock(query);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              AI Stock Market Desk & Live Search
            </h2>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Zerodha Kite LTP Protocol (All Stocks)
            </span>
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/30 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Yahoo & Hyperliquid DEX API
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Type any Stock or Crypto Ticker (e.g. <span className="text-indigo-300 font-semibold">Tata Motors</span>, <span className="text-indigo-300 font-semibold">NVDA</span>, <span className="text-cyan-300 font-semibold">HL:BTC</span>, <span className="text-cyan-300 font-semibold">HL:ETH</span>, <span className="text-cyan-300 font-semibold">HL:SOL</span>) for live Hyperliquid DEX candles, Yahoo Finance, & X social chatter.
          </p>
        </div>

        {/* Current Active Stock Tag */}
        {activeStockSymbol && (
          <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2.5 self-start md:self-auto">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-end gap-1 font-bold">
                {activeDataSource ? (
                  <span className="text-emerald-400 font-mono text-[9px] font-semibold">● {activeDataSource}</span>
                ) : (
                  "Active Analysis Target"
                )}
              </span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {activeStockSymbol} {activeCompanyName ? `(${activeCompanyName})` : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Stock Search Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Stock Name or Ticker Symbol (e.g. Tata Motors, INFY, NVDA, Reliance, TSLA)..."
              disabled={isSearching}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!searchInput.trim() || isSearching}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 shrink-0 cursor-pointer"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing Stock...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Run AI Stock Analysis</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Search Chips / Shortcuts */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
          Popular Stock Searches:
        </span>
        {POPULAR_SUGGESTIONS.map((s) => (
          <button
            key={s.symbol}
            type="button"
            onClick={() => handleQuickSelect(s.name)}
            disabled={isSearching}
            className="text-xs px-2.5 py-1 bg-slate-950 hover:bg-indigo-950/60 hover:text-indigo-300 text-slate-300 rounded-lg border border-slate-800 hover:border-indigo-500/40 transition-all font-sans flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <span>{s.icon}</span>
            <span className="font-medium">{s.name}</span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">({s.symbol})</span>
          </button>
        ))}
      </div>

      {/* Search Error Message */}
      {searchError && (
        <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Loading Progress Feedback */}
      {isSearching && (
        <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2.5 animate-pulse">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              AI Desk is searching market records & synthesizing sentiment for "{searchInput}"...
            </span>
            <span className="font-mono text-[10px] text-indigo-400 font-bold uppercase">
              Gemini 3.6 Flash
            </span>
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              1. Fetching recent prices
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              2. Analyzing social sentiment
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-full border border-slate-600 inline-block" />
              3. Running Quant Ensemble
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
