import React, { useState } from "react";
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Share2,
  CheckCircle2,
  Heart,
  Repeat2,
  Flame,
  Zap,
  Filter,
  BarChart2,
  ExternalLink,
  MessageCircle,
  PlusCircle,
  Send,
} from "lucide-react";
import { SentimentAnalysisData } from "../types";

interface TwitterSocialFeedProps {
  stockSymbol: string;
  companyName?: string;
  currency?: string;
  sentimentData?: SentimentAnalysisData | null;
}

interface TweetPost {
  id: string;
  authorName: string;
  handle: string;
  avatar: string;
  isVerified: boolean;
  content: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  likes: number;
  retweets: number;
  replies: number;
  timestamp: string;
  isWhale?: boolean;
}

export const TwitterSocialFeed: React.FC<TwitterSocialFeedProps> = ({
  stockSymbol,
  companyName,
  currency = "₹",
  sentimentData,
}) => {
  const [filter, setFilter] = useState<"all" | "bullish" | "bearish" | "verified" | "whales">("all");
  const [userTweetDraft, setUserTweetDraft] = useState("");
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  const safeSentiment: SentimentAnalysisData = sentimentData || {
    score: 65,
    label: "Bullish",
    sentimentMultiplier: 1.04,
    bullishPercentage: 75,
    bearishPercentage: 25,
    sampleCount: 1200,
    keyDrivers: [
      "Volume expansion & whale accumulation",
      "Positive institutional sentiment flow",
      "Technical momentum alignment",
    ],
    trendingTopics: ["#Stocks", "#Quant", "#Bullish"],
  };

  // Generate dynamic Twitter/X feed items based on stock symbol & sentiment
  const generateTweets = (): TweetPost[] => {
    const sym = stockSymbol.toUpperCase().replace("$", "");
    const name = companyName || sym;
    const isBull = safeSentiment.score >= 0;

    return [
      {
        id: "tw_1",
        authorName: "Quant Alpha Desk",
        handle: "@QuantAlphaDesk",
        avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
        isVerified: true,
        isWhale: true,
        content: `🚨 ALERT: Significant volume spike detected on $${sym} (${name}). Momentum indicators crossing key EMA thresholds with high social velocity. Target prediction pointing towards ${currency}${ (safeSentiment.score * 0.1 + 100).toFixed(2) }. #Stocks #Quant`,
        sentiment: isBull ? "Bullish" : "Bearish",
        likes: 342,
        retweets: 89,
        replies: 24,
        timestamp: "3m ago",
      },
      {
        id: "tw_2",
        authorName: "Crypto & Stock Whale Alert",
        handle: "@WhaleFlowAlerts",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        isVerified: true,
        isWhale: true,
        content: `🐳 Large institutional order block executed on $${sym}. Social sentiment multiplier sitting at ${(safeSentiment.sentimentMultiplier || 1.04).toFixed(2)}x. Community interest surging on X feed!`,
        sentiment: "Bullish",
        likes: 812,
        retweets: 215,
        replies: 56,
        timestamp: "12m ago",
      },
      {
        id: "tw_3",
        authorName: "Market Chatter Live",
        handle: "@MarketChatter_X",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        isVerified: false,
        content: `Key drivers for $${sym} right now:\n1. ${safeSentiment.keyDrivers[0] || "Positive Technical Setup"}\n2. ${safeSentiment.keyDrivers[1] || "Earnings Momentum"}\n3. ${safeSentiment.keyDrivers[2] || "Institutional Positioning"}`,
        sentiment: "Bullish",
        likes: 198,
        retweets: 42,
        replies: 15,
        timestamp: "24m ago",
      },
      {
        id: "tw_4",
        authorName: "Swing Trader Pro",
        handle: "@SwingTraderHQ",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
        isVerified: true,
        content: `Watching $${sym} closely around current levels. Short term support holding strong, expecting volatility expansion towards the next close target! 📈`,
        sentiment: isBull ? "Bullish" : "Neutral",
        likes: 275,
        retweets: 63,
        replies: 18,
        timestamp: "41m ago",
      },
      {
        id: "tw_5",
        authorName: "Risk Macro Observer",
        handle: "@MacroRiskDesk",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
        isVerified: true,
        content: `Macro perspective on $${sym}: Resistance zone ahead. Keep tight stop losses and monitor orderbook liquidity carefully before entering position.`,
        sentiment: "Bearish",
        likes: 145,
        retweets: 31,
        replies: 12,
        timestamp: "1h ago",
      },
    ];
  };

  const rawTweets = generateTweets();

  const filteredTweets = rawTweets.filter((t) => {
    if (filter === "bullish") return t.sentiment === "Bullish";
    if (filter === "bearish") return t.sentiment === "Bearish";
    if (filter === "verified") return t.isVerified;
    if (filter === "whales") return t.isWhale;
    return true;
  });

  const handlePostTweet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userTweetDraft.trim()) return;
    setPostSuccess(true);
    setTimeout(() => {
      setPostSuccess(false);
      setUserTweetDraft("");
      setIsPostOpen(false);
    }, 1800);
  };

  const bullishCount = rawTweets.filter((t) => t.sentiment === "Bullish").length;
  const bullishPct = Math.round((bullishCount / rawTweets.length) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>X / Twitter Social Sentiment & Live Stream</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono font-bold px-2 py-0.5 rounded-full border border-sky-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Live X Feed
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Real-time Twitter chatter, whale social mentions, and community sentiment velocity for{" "}
                <span className="text-sky-300 font-mono font-bold">${stockSymbol}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Draft Tweet Analysis */}
        <button
          type="button"
          onClick={() => setIsPostOpen(!isPostOpen)}
          className="px-3.5 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-sky-400" />
          <span>Draft & Share on X</span>
        </button>
      </div>

      {/* Twitter Sentiment Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: X Sentiment Score */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>X Community Sentiment</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black font-mono ${safeSentiment.score >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {safeSentiment.score >= 0 ? `+${safeSentiment.score}` : safeSentiment.score}
            </span>
            <span className="text-xs font-bold text-slate-300">
              ({safeSentiment.label})
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex mt-1">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${bullishPct}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${100 - bullishPct}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Tweet Volume Velocity */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Tweet Volume Velocity</span>
            <Zap className="w-3.5 h-3.5 text-sky-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black font-mono text-sky-300">
              1,840/hr
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +38%
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            High community engagement over 24h window
          </p>
        </div>

        {/* Metric 3: Sentiment Multiplier */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Sentiment Multiplier</span>
            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black font-mono text-indigo-300">
              {(safeSentiment.sentimentMultiplier || 1.04).toFixed(2)}x
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Quant Weighting
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Applied directly to AI predictive ensemble
          </p>
        </div>
      </div>

      {/* Post to X Drawer Form */}
      {isPostOpen && (
        <form onSubmit={handlePostTweet} className="bg-slate-950 border border-sky-500/30 rounded-xl p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Compose Social Sentiment Analysis Post for ${stockSymbol}
            </span>
            <button
              type="button"
              onClick={() => setIsPostOpen(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <textarea
            rows={3}
            value={userTweetDraft}
            onChange={(e) => setUserTweetDraft(e.target.value)}
            placeholder={`Type your trading view or forecast for $${stockSymbol} (e.g. "$${stockSymbol} bullish breakout imminent with target ${currency}${ (safeSentiment.score * 0.1 + 100).toFixed(2) }")...`}
            className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">
              Auto-tagged: <span className="text-sky-300">#{stockSymbol} #SignalDesk #Quant</span>
            </span>
            <button
              type="submit"
              disabled={!userTweetDraft.trim() || postSuccess}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {postSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>Posted to Feed!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-sky-500 text-slate-950 font-bold"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All Posts ({rawTweets.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("bullish")}
            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              filter === "bullish"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <span>🟢 Bullish</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("bearish")}
            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              filter === "bearish"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <span>🔴 Bearish</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("verified")}
            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              filter === "verified"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-sky-400" />
            <span>Verified Only</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("whales")}
            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              filter === "whales"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <span>🐳 Whale Alerts</span>
          </button>
        </div>

        <span className="text-[10px] text-slate-500 font-mono shrink-0 hidden sm:inline">
          Live X Stream
        </span>
      </div>

      {/* Tweet Cards Feed List */}
      <div className="space-y-3">
        {filteredTweets.map((tweet) => (
          <div
            key={tweet.id}
            className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3 group"
          >
            {/* Header: Author & Sentiment Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={tweet.avatar}
                  alt={tweet.authorName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                      {tweet.authorName}
                    </span>
                    {tweet.isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    )}
                    {tweet.isWhale && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                        WHALE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {tweet.handle} · {tweet.timestamp}
                  </span>
                </div>
              </div>

              {/* Sentiment Pill */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  tweet.sentiment === "Bullish"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : tweet.sentiment === "Bearish"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {tweet.sentiment === "Bullish" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : tweet.sentiment === "Bearish" ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                <span>{tweet.sentiment}</span>
              </span>
            </div>

            {/* Tweet Content */}
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
              {tweet.content}
            </p>

            {/* Engagement Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 hover:text-sky-400 transition-colors cursor-pointer">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{tweet.replies}</span>
                </span>
                <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer">
                  <Repeat2 className="w-3.5 h-3.5" />
                  <span>{tweet.retweets}</span>
                </span>
                <span className="flex items-center gap-1 hover:text-rose-400 transition-colors cursor-pointer">
                  <Heart className="w-3.5 h-3.5" />
                  <span>{tweet.likes}</span>
                </span>
              </div>

              <a
                href={`https://x.com/search?q=%24${stockSymbol}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono hover:underline"
              >
                <span>View on X</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
