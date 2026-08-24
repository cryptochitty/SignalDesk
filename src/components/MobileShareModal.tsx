import React, { useState, useEffect } from "react";
import {
  Send,
  Smartphone,
  MessageSquare,
  Share2,
  Copy,
  Check,
  X,
  Target,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface MobileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  companyName: string;
  currency: string;
  currentPrice: number;
  targetPrice: number;
  stopLossPrice?: number;
  predictionPrice?: number;
  confidencePct?: number;
  signal?: "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL";
  exchange?: string;
  timeframe?: string;
  catalystSummary?: string;
}

export const MobileShareModal: React.FC<MobileShareModalProps> = ({
  isOpen,
  onClose,
  symbol,
  companyName,
  currency,
  currentPrice,
  targetPrice: initialTargetPrice,
  stopLossPrice: initialStopLossPrice,
  predictionPrice,
  confidencePct = 86,
  signal: initialSignal = "BUY",
  exchange: propExchange,
  timeframe = "Short-term / Swing",
  catalystSummary = "AI Neural Multi-Horizon Projection & Quantitative Consensus",
}) => {
  const cleanSym = (symbol || "STOCK").toUpperCase().replace(".NS", "").replace(".BO", "");
  const price = currentPrice > 0 ? currentPrice : 100;

  // Auto-detect exchange if not explicitly passed
  const resolvedExchange = React.useMemo(() => {
    if (propExchange && propExchange !== "NSE") return propExchange;
    if (["BTC", "ETH", "SOL", "PURR", "HYPE", "BNB", "XRP", "DOGE"].includes(cleanSym)) {
      return "Crypto DEX (Hyperliquid)";
    }
    if (["AAPL", "NVDA", "TSLA", "MSFT", "GOOGL", "AMZN", "META"].includes(cleanSym)) {
      return "NASDAQ (US)";
    }
    if (["IOC", "KRRAIL", "PWL", "TAPARIA", "BOM"].includes(cleanSym) || symbol.endsWith(".BO")) {
      return "BSE";
    }
    return propExchange || "NSE";
  }, [cleanSym, propExchange, symbol]);

  // Determine smart initial target price (ensure target != currentPrice by default)
  const computeSmartTarget = () => {
    // If predictionPrice is provided and distinct from current price, prioritize it
    if (predictionPrice && Math.abs(predictionPrice - price) > 0.01) {
      return predictionPrice;
    }
    // If targetPrice is distinct from current price, use targetPrice
    if (initialTargetPrice && Math.abs(initialTargetPrice - price) > 0.01) {
      return initialTargetPrice;
    }
    // Otherwise fallback to logical +4.5% for BUY or -4.5% for SELL
    if (initialSignal.includes("SELL")) {
      return parseFloat((price * 0.955).toFixed(2));
    }
    return parseFloat((price * 1.045).toFixed(2));
  };

  const computeSmartStopLoss = () => {
    if (initialStopLossPrice && Math.abs(initialStopLossPrice - price) > 0.01) {
      return initialStopLossPrice;
    }
    if (initialSignal.includes("SELL")) {
      return parseFloat((price * 1.035).toFixed(2));
    }
    return parseFloat((price * 0.96).toFixed(2));
  };

  const [activeTarget, setActiveTarget] = useState<number>(computeSmartTarget());
  const [activeStopLoss, setActiveStopLoss] = useState<number>(computeSmartStopLoss());
  const [activeSignal, setActiveSignal] = useState<"STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL">(initialSignal);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setActiveTarget(computeSmartTarget());
      setActiveStopLoss(computeSmartStopLoss());
      setActiveSignal(initialSignal);
    }
  }, [isOpen, initialTargetPrice, initialStopLossPrice, predictionPrice, price, initialSignal]);

  if (!isOpen) return null;

  const targetDiff = activeTarget - price;
  const targetPct = price > 0 ? (targetDiff / price) * 100 : 0;
  const slDiff = activeStopLoss - price;
  const slPct = price > 0 ? (slDiff / price) * 100 : 0;

  // Format rich WhatsApp / SMS message
  const generateMessageText = () => {
    const isCrypto = resolvedExchange.includes("Crypto");
    const headerPrefix = isCrypto ? "🌐 AI CRYPTO WATCHDOG ALERT" : "📈 AI STOCK WATCHDOG FORECAST";
    const signPrefix = targetPct >= 0 ? "+" : "";

    return (
      `${headerPrefix}: *${cleanSym}*\n` +
      `🏢 ${companyName} (${resolvedExchange})\n` +
      `----------------------------------------\n` +
      `⚡ *Signal:* ${activeSignal} (${confidencePct}% Confidence)\n` +
      `💰 *LTP / Entry:* ${currency}${price.toFixed(2)}\n` +
      `🎯 *Target Price:* ${currency}${activeTarget.toFixed(2)} (${signPrefix}${targetPct.toFixed(2)}%)\n` +
      `🛡️ *Stop Loss:* ${currency}${activeStopLoss.toFixed(2)} (${slPct.toFixed(2)}%)\n` +
      `⏱️ *Timeframe:* ${timeframe}\n` +
      `----------------------------------------\n` +
      `💡 *Catalyst:* ${catalystSummary}\n` +
      (customNote.trim() ? `📝 *Note:* ${customNote.trim()}\n` : "") +
      `----------------------------------------\n` +
      `🚀 *Generated via AI Quant & Arbitrage Desk*`
    );
  };

  const messageText = generateMessageText();

  // Send via WhatsApp
  const handleSendWhatsApp = () => {
    const encodedText = encodeURIComponent(messageText);
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(waUrl, "_blank");
  };

  // Send via Native SMS
  const handleSendSMS = () => {
    const encodedText = encodeURIComponent(messageText);
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? "&" : "?";
    const smsUrl = cleanPhone
      ? `sms:${cleanPhone}${separator}body=${encodedText}`
      : `sms:${separator}body=${encodedText}`;

    window.location.href = smsUrl;
  };

  // Web Share API fallback (for mobile browsers)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AI Price Prediction: ${cleanSym}`,
          text: messageText,
        });
      } catch (err) {
        console.log("Share cancelled", err);
      }
    } else {
      handleCopy();
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Preset percentage modifiers for Target
  const setTargetByPct = (pct: number) => {
    const newTgt = parseFloat((price * (1 + pct / 100)).toFixed(2));
    setActiveTarget(newTgt);
  };

  // Preset percentage modifiers for Stop Loss
  const setStopLossByPct = (pct: number) => {
    const newSl = parseFloat((price * (1 - pct / 100)).toFixed(2));
    setActiveStopLoss(newSl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <span>Send Prediction to Mobile</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Option C • Instant & Free
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                1-Click dispatch to WhatsApp, Mobile SMS, or Telegram
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Active Asset Banner */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                <span>{cleanSym}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {resolvedExchange}
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                {companyName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase">Live Entry (LTP)</div>
              <div className="text-sm font-mono font-bold text-slate-200">
                {currency}{price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Target Price & Stop Loss Customization Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            {/* Target Price Input & Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>Target Price ({currency})</span>
                </label>
                <span className={`text-[11px] font-mono font-bold ${targetPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {targetPct >= 0 ? "+" : ""}{targetPct.toFixed(2)}%
                </span>
              </div>
              <input
                type="number"
                step="any"
                value={activeTarget}
                onChange={(e) => setActiveTarget(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {/* Quick Target Presets */}
              <div className="flex items-center gap-1 pt-0.5">
                {predictionPrice && Math.abs(predictionPrice - price) > 0.01 && (
                  <button
                    type="button"
                    onClick={() => setActiveTarget(predictionPrice)}
                    className="px-1.5 py-0.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded text-[10px] font-mono font-semibold transition-colors"
                  >
                    AI: {currency}{predictionPrice.toFixed(0)}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTargetByPct(3)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition-colors"
                >
                  +3%
                </button>
                <button
                  type="button"
                  onClick={() => setTargetByPct(5)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition-colors"
                >
                  +5%
                </button>
                <button
                  type="button"
                  onClick={() => setTargetByPct(10)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition-colors"
                >
                  +10%
                </button>
              </div>
            </div>

            {/* Stop Loss Input & Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Stop Loss ({currency})</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-rose-400">
                  {slPct.toFixed(2)}%
                </span>
              </div>
              <input
                type="number"
                step="any"
                value={activeStopLoss}
                onChange={(e) => setActiveStopLoss(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-rose-300 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              {/* Quick SL Presets */}
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setStopLossByPct(2)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition-colors"
                >
                  -2%
                </button>
                <button
                  type="button"
                  onClick={() => setStopLossByPct(4)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition-colors"
                >
                  -4%
                </button>
                <button
                  type="button"
                  onClick={() => setStopLossByPct(6)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition-colors"
                >
                  -6%
                </button>
              </div>
            </div>
          </div>

          {/* Recipient Phone & Custom Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Mobile Number (Optional)</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 919876543210"
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Personal Strategy Note (Optional)
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Trail SL after T1 reached"
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Message Live Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Live WhatsApp / SMS Preview</span>
              <button
                onClick={handleCopy}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy Text"}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-all max-h-40 overflow-y-auto">
              {messageText}
            </pre>
          </div>

          {/* 1-Click Action Dispatch Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* WhatsApp Button */}
            <button
              onClick={handleSendWhatsApp}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Send via WhatsApp</span>
            </button>

            {/* Native Mobile SMS Button */}
            <button
              onClick={handleSendSMS}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send via Mobile SMS</span>
            </button>
          </div>

          {/* Native Mobile Share fallback */}
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              onClick={handleNativeShare}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Share to Telegram / Signal / Notes</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <Sparkles className="w-3 h-3" />
            Zero-Cost Web Intent • No API key or DLT registration required
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

