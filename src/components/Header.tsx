import React, { useState, useRef, useEffect } from "react";
import { TrendingUp, Sparkles, ChevronDown, Search, RefreshCw, Bell, FileText, FileSpreadsheet } from "lucide-react";
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
  onOpenPdfReportModal?: () => void;
  onExportExcel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPreset,
  onSelectPreset,
  currency,
  onSearchStock,
  isSearching = false,
  notificationCount = 0,
  onScrollToAlerts,
  onOpenPdfReportModal,
  onExportExcel,
}) => {
  const [headerQuery, setHeaderQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerQuery.trim() || !onSearchStock || isSearching) return;
    setIsDropdownOpen(false);
    onSearchStock(headerQuery.trim());
  };

  const handleSelectSuggestion = (preset: StockPreset) => {
    setHeaderQuery(preset.name);
    setIsDropdownOpen(false);
    onSelectPreset(preset);
    if (onSearchStock) {
      onSearchStock(preset.symbol);
    }
  };

  const matchingPresets = headerQuery.trim()
    ? STOCK_PRESETS.filter((p) => {
        const q = headerQuery.trim().toUpperCase();
        return (
          p.symbol.toUpperCase().includes(q) ||
          p.name.toUpperCase().includes(q) ||
          (p.companyName && p.companyName.toUpperCase().includes(q))
        );
      }).slice(0, 6)
    : [];

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

        {/* Search Bar in Header with Live Autocomplete */}
        {onSearchStock && (
          <div ref={searchContainerRef} className="relative flex-1 max-w-md w-full my-1 md:my-0">
            <form onSubmit={handleHeaderSearch}>
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={headerQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setHeaderQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Type Stock Name (e.g. Moschip, Urban Co, Tata Motors)..."
                  disabled={isSearching}
                  className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500/50 focus:border-indigo-500 rounded-xl pl-9 pr-24 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!headerQuery.trim() || isSearching}
                  className="absolute right-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
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

            {/* Suggestions Overlay */}
            {isDropdownOpen && matchingPresets.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950 border border-indigo-500/40 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60">
                <div className="px-3 py-1.5 bg-indigo-950/40 text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Quick Select Match</span>
                  <span>Direct Quant Sync</span>
                </div>
                {matchingPresets.map((p) => {
                  // extract latest price from CSV
                  const lines = p.csvData.trim().split("\n");
                  const lastLine = lines[lines.length - 1] || "";
                  const priceStr = lastLine.split(",")[1] || "";
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(p)}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-900/30 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-300">
                          {p.symbol}
                        </span>
                        <span className="text-xs text-slate-300 truncate max-w-[180px]">
                          {p.name}
                        </span>
                      </div>
                      {priceStr && (
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                          {p.currency}{parseFloat(priceStr).toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick Stock Selector, PDF Report & Notification Bell */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Excel Export Button */}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-sm group"
              title="Export Multi-Sheet Excel Report (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:text-white" />
              <span className="hidden sm:inline">Excel Export</span>
            </button>
          )}

          {/* PDF Report Download Button */}
          {onOpenPdfReportModal && (
            <button
              onClick={onOpenPdfReportModal}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer shadow-sm"
              title="Generate Downloadable PDF Summary Report"
            >
              <FileText className="w-4 h-4 text-indigo-400 group-hover:text-white" />
              <span className="hidden sm:inline">PDF Report</span>
            </button>
          )}

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
                <optgroup label="⚡ Zerodha Kite Watchlist">
                  {STOCK_PRESETS.filter((p) => p.category === "Kite Watchlist").map((p) => (
                    <option key={p.id} value={p.id}>
                      📌 {p.symbol} - {p.name}
                    </option>
                  ))}
                </optgroup>
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
                <optgroup label="Crypto Perpetuals">
                  {STOCK_PRESETS.filter((p) => p.category === "Hyperliquid Crypto Perp").map((p) => (
                    <option key={p.id} value={p.id}>
                      💧 {p.symbol} - {p.name}
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
