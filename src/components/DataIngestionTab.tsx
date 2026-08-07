import React, { useState } from "react";
import {
  FileText,
  Globe,
  Camera,
  MessageSquare,
  Upload,
  RefreshCw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { IngestionTab, SentimentAnalysisData, StockPreset } from "../types";
import { STOCK_PRESETS } from "../utils/sampleData";

interface DataIngestionTabProps {
  activeTab: IngestionTab;
  onTabChange: (tab: IngestionTab) => void;
  rawCsvInput: string;
  onCsvInputChange: (val: string) => void;
  onLoadPreset: (preset: StockPreset) => void;
  stockSymbol: string;
  onStockSymbolChange: (sym: string) => void;
  sentimentData: SentimentAnalysisData | null;
  onAnalyzeSentiment: (symbol: string, companyName?: string) => Promise<void>;
  isSentimentLoading: boolean;
  onOcrUpload: (file: File) => Promise<void>;
  isOcrLoading: boolean;
  ocrSuccessMessage: string | null;
  onUrlFetch: (url: string) => Promise<void>;
  isUrlLoading: boolean;
  urlError: string | null;
  rowCount: number;
}

export const DataIngestionTab: React.FC<DataIngestionTabProps> = ({
  activeTab,
  onTabChange,
  rawCsvInput,
  onCsvInputChange,
  onLoadPreset,
  stockSymbol,
  onStockSymbolChange,
  sentimentData,
  onAnalyzeSentiment,
  isSentimentLoading,
  onOcrUpload,
  isOcrLoading,
  ocrSuccessMessage,
  onUrlFetch,
  isUrlLoading,
  urlError,
  rowCount,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setOcrPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);

      await onOcrUpload(file);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Tab Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onTabChange("csv")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "csv"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste CSV / Text
          </button>

          <button
            onClick={() => onTabChange("url")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "url"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Import via URL
          </button>

          <button
            onClick={() => onTabChange("ocr")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "ocr"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Image / OCR Scanner
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              AI Vision
            </span>
          </button>

          <button
            onClick={() => onTabChange("social")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "social"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Social Sentiment
            {sentimentData && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-indigo-300 font-semibold">
            {rowCount} Data Points
          </span>
        </div>
      </div>

      {/* Tab Body */}
      <div className="pt-4">
        {/* TAB 1: CSV / Text Paste or File Upload */}
        {activeTab === "csv" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Raw Data Stream (Date, Close)
              </label>

              {/* Sample Quick Load Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">Quick Presets:</span>
                {STOCK_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onLoadPreset(p)}
                    className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-indigo-900/50 hover:text-indigo-300 text-slate-300 rounded border border-slate-700 transition-all font-mono cursor-pointer"
                  >
                    {p.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct CSV File Drag & Drop / Picker */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1 border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-950 p-4 rounded-xl flex flex-col items-center justify-center text-center relative group transition-all">
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        if (content) onCsvInputChange(content);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <Upload className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                <p className="text-xs font-bold text-slate-200">Upload .CSV or .TXT File</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click or drag stock dataset file here</p>
              </div>

              {/* Textarea for pasting raw CSV text */}
              <div className="md:col-span-2 space-y-1">
                <textarea
                  value={rawCsvInput}
                  onChange={(e) => onCsvInputChange(e.target.value)}
                  placeholder={`Paste CSV data or edit directly, e.g.:\nDate,Close\n2026-07-19,130.70\n2026-07-24,129.76\n2026-07-27,130.42\n2026-07-28,131.24\n2026-08-03,146.19\n2026-08-04,144.81\n2026-08-05,142.55`}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Supports comma, tab, or semicolon delimiters. Dates are auto-normalized into standard chronological order.
            </p>
          </div>
        )}

        {/* TAB 2: URL Fetcher */}
        {activeTab === "url" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1.5 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                Import Stock Data via Public CSV URL or API
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/stock-historical-data.csv"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => onUrlFetch(urlInput)}
                  disabled={isUrlLoading || !urlInput.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {isUrlLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  Fetch & Load CSV
                </button>
              </div>
            </div>

            {urlError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {urlError}
              </div>
            )}

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-300 block">Sample Remote CSV Endpoints:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const testUrl = "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv";
                    setUrlInput(testUrl);
                    onUrlFetch(testUrl);
                  }}
                  className="text-[11px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-lg border border-slate-700 flex items-center gap-1.5 font-mono cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> S&P 500 Historical Dataset URL
                </button>
                <button
                  onClick={() => {
                    const testUrl = "https://raw.githubusercontent.com/plotly/datasets/master/finance-charts-apple.csv";
                    setUrlInput(testUrl);
                    onUrlFetch(testUrl);
                  }}
                  className="text-[11px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-lg border border-slate-700 flex items-center gap-1.5 font-mono cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> AAPL Finance Chart CSV URL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Image / OCR Scanner */}
        {activeTab === "ocr" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-950 transition-all cursor-pointer relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                disabled={isOcrLoading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-indigo-500/20">
                  {isOcrLoading ? (
                    <RefreshCw className="w-7 h-7 animate-spin text-indigo-400" />
                  ) : (
                    <Camera className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">
                    {isOcrLoading ? "Scanning Image with Gemini AI Vision..." : "Upload Stock Chart or Table Screenshot Image"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Drag and drop or click to upload JPEG, PNG, or WebP chart screenshot
                  </p>
                </div>
              </div>
            </div>

            {ocrPreviewUrl && (
              <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <img
                  src={ocrPreviewUrl}
                  alt="Uploaded OCR scan"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-700"
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Gemini Multimodal Vision Extraction Active
                  </p>
                  <p className="text-slate-400">
                    Extracting tabular price dates and levels directly into the quantitative regression pipeline.
                  </p>
                </div>
              </div>
            )}

            {ocrSuccessMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                {ocrSuccessMessage}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Social Media & Sentiment Analyzer */}
        {activeTab === "social" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={stockSymbol}
                  onChange={(e) => onStockSymbolChange(e.target.value)}
                  placeholder="Enter Ticker (e.g., RELIANCE.NS, TCS, NVDA, TSLA)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={() => onAnalyzeSentiment(stockSymbol)}
                disabled={isSentimentLoading || !stockSymbol.trim()}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
              >
                {isSentimentLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Scrape & Analyze Sentiment
              </button>
            </div>

            {/* Display Sentiment Data if available */}
            {sentimentData && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Score Gauge Card */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Overall Sentiment Index
                    </span>
                    <div className="my-2 flex items-baseline gap-2">
                      <span
                        className={`text-2xl font-black ${
                          sentimentData.score >= 20
                            ? "text-emerald-400"
                            : sentimentData.score <= -20
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {sentimentData.score > 0 ? `+${sentimentData.score}` : sentimentData.score}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {sentimentData.label}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 ${
                          sentimentData.score >= 0 ? "bg-emerald-500" : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(10, Math.abs(sentimentData.score)))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Key Drivers */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 md:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Key News Drivers & Chatter Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {sentimentData.keyDrivers.map((driver, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40"
                        >
                          #{driver}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                      {sentimentData.summary}
                    </p>
                  </div>
                </div>

                {/* Sample Social Feeds */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Live Feed Sample Streams (X, StockTwits, Reddit, NSE News)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sentimentData.samplePosts.map((post, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-400 text-[10px]">
                            {post.source}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              post.sentiment === "Bullish"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : post.sentiment === "Bearish"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {post.sentiment}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-snug">{post.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
