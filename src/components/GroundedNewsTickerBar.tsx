import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  RefreshCw,
  Pause,
  Play,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { GroundedNewsData, GroundedNewsHeadline } from "../types";

interface GroundedNewsTickerBarProps {
  symbol: string;
  companyName?: string;
  exchange?: string;
  currency?: string;
}

export const GroundedNewsTickerBar: React.FC<GroundedNewsTickerBarProps> = ({
  symbol,
  companyName,
  exchange = "NSE",
  currency = "₹",
}) => {
  const [newsData, setNewsData] = useState<GroundedNewsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedHeadline, setSelectedHeadline] = useState<GroundedNewsHeadline | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const cleanSymbol = symbol.toUpperCase().replace(".NS", "").replace(".BO", "");

  const fetchGroundedHeadlines = async (sym: string, cName?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stock-grounded-headlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: sym,
          companyName: cName || sym,
          exchange,
        }),
      });

      if (response.ok) {
        const data: GroundedNewsData = await response.json();
        setNewsData(data);
      }
    } catch (err) {
      console.warn("Failed to fetch Google Search grounded headlines:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch whenever symbol or companyName changes
  useEffect(() => {
    fetchGroundedHeadlines(cleanSymbol, companyName);
  }, [cleanSymbol, companyName]);

  const headlines = newsData?.headlines || [];

  const getSentimentBadge = (sentiment: "BULLISH" | "BEARISH" | "NEUTRAL") => {
    switch (sentiment) {
      case "BULLISH":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-2.5 h-2.5" />
            BULLISH
          </span>
        );
      case "BEARISH":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <TrendingDown className="w-2.5 h-2.5" />
            BEARISH
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Minus className="w-2.5 h-2.5" />
            NEUTRAL
          </span>
        );
    }
  };

  const getCategoryClass = (category: string) => {
    switch (category) {
      case "Earnings & Revenue":
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
      case "Order Book & Deals":
        return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      case "Regulatory & SEBI":
        return "bg-purple-500/10 text-purple-300 border-purple-500/20";
      case "Analyst Target":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div id="grounded-news-ticker-bar" className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-[57px] z-30 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 py-1.5 gap-2 text-xs overflow-hidden">
        {/* Left Badge: Live Grounding Badge & Active Stock */}
        <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-slate-800">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 px-2 py-0.5 rounded-md border border-blue-500/30 text-blue-300 font-semibold tracking-wide text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="flex items-center gap-1">
              <Search className="w-3 h-3 text-blue-400" />
              <span className="hidden sm:inline">Google Grounded</span>
              <span className="sm:hidden">News</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-200 font-mono font-bold text-[11px]">
            <span className="text-indigo-400">{cleanSymbol}</span>
            {companyName && (
              <span className="hidden lg:inline text-[10px] text-slate-400 max-w-[120px] truncate font-sans font-normal">
                {companyName}
              </span>
            )}
          </div>
        </div>

        {/* Center: Marquee / Ticker Stream */}
        <div
          className="flex-1 overflow-hidden relative cursor-pointer select-none group py-0.5"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onClick={() => setIsModalOpen(true)}
          title="Click to view all grounded news and search sources"
        >
          {isLoading && !newsData ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-0.5">
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
              <span>Grounding real-time financial headlines for {cleanSymbol} via Google Search...</span>
            </div>
          ) : headlines.length === 0 ? (
            <div className="text-slate-400 text-xs">
              No recent news catalysts found for {cleanSymbol}. Trading smoothly.
            </div>
          ) : (
            <div
              ref={scrollRef}
              className={`flex items-center gap-8 whitespace-nowrap will-change-transform ${
                isPaused ? "" : "animate-marquee"
              }`}
              style={{
                display: "inline-flex",
                animationDuration: `${Math.max(25, headlines.length * 9)}s`,
                animationPlayState: isPaused ? "paused" : "running",
              }}
            >
              {/* Duplicate list to enable seamless infinite scroll loop */}
              {[...headlines, ...headlines].map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex items-center gap-2 text-xs hover:text-indigo-300 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedHeadline(item);
                    setIsModalOpen(true);
                  }}
                >
                  {getSentimentBadge(item.sentiment)}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] border font-medium ${getCategoryClass(item.category)}`}>
                    {item.category}
                  </span>
                  <span className="font-medium text-slate-200 hover:text-white transition-colors">
                    {item.headline}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    • {item.source} ({item.timeAgo})
                  </span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-indigo-400 transition-colors p-0.5"
                      onClick={(e) => e.stopPropagation()}
                      title={`Open source: ${item.source}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <span className="text-slate-700 mx-2">|</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls: Play/Pause, Refresh, Expand Modal */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-800">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title={isPaused ? "Resume Ticker Scrolling" : "Pause Ticker Scrolling"}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
          </button>

          <button
            onClick={() => fetchGroundedHeadlines(cleanSymbol, companyName)}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors disabled:opacity-40"
            title="Refresh Grounded Headlines"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
            title="Open Detailed Google Grounded News Feed"
          >
            <Layers className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">All ({headlines.length})</span>
          </button>
        </div>
      </div>

      {/* Expanded Modal for Detailed Grounded Headings & Search Citations */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-base">
                      Google Search Grounded Headlines
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {cleanSymbol}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Real-time market disclosures, analyst ratings & news verified via Google Search Grounding
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedHeadline(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Overall Sentiment & Search Grounding Metadata Card */}
              {newsData && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Search Verification Status:</span>
                      <span className="text-emerald-400 font-bold">Google Search Grounded</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                      <span>Queries Executed:</span>
                      {newsData.searchQueriesUsed.map((q, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">
                          "{q}"
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Overall Sentiment
                      </div>
                      <div className="font-bold text-xs">
                        {getSentimentBadge(newsData.overallSentiment)}
                      </div>
                    </div>
                    <div className="text-right pl-3 border-l border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Last Updated
                      </div>
                      <div className="font-mono text-xs text-slate-300">
                        {newsData.lastUpdated}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Headline Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Verified News Stream ({headlines.length})</span>
                </h4>

                {headlines.map((item) => {
                  const isSelected = selectedHeadline?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-indigo-950/20 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                          : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {getSentimentBadge(item.sentiment)}
                          <span className={`px-2 py-0.5 rounded text-[10px] border font-medium ${getCategoryClass(item.category)}`}>
                            {item.category}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.source} • {item.timeAgo}
                          </span>
                        </div>

                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors shrink-0"
                          >
                            <span>Read Source</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <h5 className="text-sm font-bold text-slate-100 mb-1 leading-snug">
                        {item.headline}
                      </h5>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.summary}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Grounded Catalyst Verified
                        </span>
                        <span className="font-mono text-slate-500">
                          Impact Score: <strong className="text-slate-300">{item.impactScore}/100</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grounding Source Citations & References */}
              {newsData && newsData.groundingSources && newsData.groundingSources.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Grounding Citations & Direct Sources</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newsData.groundingSources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white flex items-center justify-between gap-2 transition-colors truncate group"
                      >
                        <span className="truncate">{src.title || src.uri}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Live Grounding updates continuously with active stock changes
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
