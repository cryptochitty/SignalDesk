import React, { useState } from "react";
import { TrendingUp, Sparkles, ChevronDown, Search, RefreshCw, Bell } from "lucide-react";
import { StockPreset } from "../types";
import { STOCK_PRESETS } from "../utils/sampleData";

interface HeaderProps {
  selectedPreset: StockPreset;
  onSelectPreset: (preset: StockPreset) => void;
  currency: string;
  onSearchStock?: (query: string) => Promise<void>;
  isSearching?: boolean;
  notificationCount?: number;
  onScrollToAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPreset,
  onSelectPreset,
  currency,
  onSearchStock,
  isSearching = false,
  notificationCount = 0,
  onScrollToAlerts,
}) => {

  const [headerQuery, setHeaderQuery] = useState("");

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerQuery.trim() || !onSearchStock || isSearching) return;
    onSearchStock(headerQuery.trim());
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SIGNAL DESK
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.5 QUANT
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI Quantitative Stock Predictor & Sentiment Engine
            </p>
          </div>
        </div>

        {/* Search Bar in Header */}
        {onSearchStock && (
          <form onSubmit={handleHeaderSearch} className="flex-1 max-w-md w-full my-1 md:my-0">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={headerQuery}
                onChange={(e) => setHeaderQuery(e.target.value)}
                placeholder="Type Stock Name (e.g. Tata Motors, INFY, NVDA)..."
                disabled={isSearching}
                className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500/50 focus:border-indigo-500 rounded-xl pl-9 pr-24 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!headerQuery.trim() || isSearching}
                className="absolute right-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
              >
                {isSearching ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-indigo-200" />
                )}
                <span>AI Analyze</span>
              </button>
            </div>
          </form>
        )}

        {/* Quick Stock Selector & Notification Bell */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Price Alert Monitor Bell */}
          {onScrollToAlerts && (
            <button
              onClick={onScrollToAlerts}
              className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center justify-center shrink-0"
              title="View Price Threshold Alerts"
            >
              <Bell className="w-4 h-4 text-indigo-400" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-slate-900 animate-pulse">
                  {notificationCount}
                </span>
              )}
            </button>
          )}
          <div className="relative group min-w-[170px]">
            <div className="relative">
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  const p = STOCK_PRESETS.find((sp) => sp.id === e.target.value);
                  if (p) onSelectPreset(p);
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors hover:border-slate-600"
              >
                {!STOCK_PRESETS.some((p) => p.id === selectedPreset.id) && (
                  <optgroup label="Active Search Result">
                    <option value={selectedPreset.id}>
                      🔍 {selectedPreset.symbol} - {selectedPreset.name}
                    </option>
                  </optgroup>
                )}
                <optgroup label="NSE India Stocks">
                  {STOCK_PRESETS.filter((p) => p.category === "NSE India").map((p) => (
                    <option key={p.id} value={p.id}>
                      🇮🇳 {p.symbol} - {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Indices">
                  {STOCK_PRESETS.filter((p) => p.category === "Indices").map((p) => (
                    <option key={p.id} value={p.id}>
                      📊 {p.symbol} - {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="US Tech Stocks">
                  {STOCK_PRESETS.filter((p) => p.category === "US Tech").map((p) => (
                    <option key={p.id} value={p.id}>
                      🇺🇸 {p.symbol} - {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Engine Status Badge */}
          <div className="hidden xl:flex flex-col items-end pl-3 border-l border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Engine Online
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Currency: {currency}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
