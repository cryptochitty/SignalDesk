export interface StockDataRow {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  // Computed indicators on historical points
  ma?: number;
  reg?: number;
  momentum?: number;
  backtestPred?: number;
  backtestError?: number;
}

export interface ModelWeights {
  ma: number;         // 0 to 1 weight
  regression: number; // 0 to 1 weight
  momentum: number;   // 0 to 1 weight
  sentiment: number;  // 0 to 1 weight
}

export interface QuantitativeConfig {
  maWindow: number;          // e.g. 3, 5, 10, 20 days
  forecastHorizon: number;   // e.g. 1 to 14 days
  confidenceLevel: number;   // e.g. 80, 90, 95 (%)
  backtestHorizonMonths?: number; // e.g. 1, 3, 6, 12 months (default: 6)
  weights: ModelWeights;
}

export interface BacktestMetrics {
  mae: number;               // Mean Absolute Error in currency units
  maePercent: number;        // MAE as percentage of price
  rmse: number;              // Root Mean Square Error
  directionalAccuracy: number; // % of times predicted trend direction matched actual trend
  maxError: number;          // Maximum prediction error
  sampleCount: number;       // Number of historical points backtested
}

export interface ForecastPoint {
  date: string;
  price: number;
  lowBand: number;
  highBand: number;
  isForecast: boolean;
  isBacktest?: boolean;
}

export interface HourlySessionPoint {
  time: string;           // e.g. "09:30 AM", "10:30 AM", "12:00 PM", "01:30 PM", "03:00 PM", "03:30 PM"
  predictedPrice: number;
  vwap: number;
  lowBand: number;
  highBand: number;
}

export interface IntradayPrediction {
  symbol: string;
  currency: string;
  currentPrice: number;
  signal: 'STRONG BUY' | 'BUY / LONG' | 'SELL / SHORT' | 'NEUTRAL HOLD';
  confidenceScore: number; // 0-100%
  buyRangeLow: number;
  buyRangeHigh: number;
  buyOptimal: number;
  sellTarget1: number;
  sellTarget2: number;
  sellTarget3: number;
  stopLoss: number;
  expectedHigh: number;
  expectedLow: number;
  expectedVwap: number;
  pivotPoint: number;
  resistance1: number;
  resistance2: number;
  support1: number;
  support2: number;
  riskRewardRatio: string; // e.g., "1 : 2.8"
  intradayHourlyCurve: HourlySessionPoint[];
}

export interface WeeklyForwardDay {
  dayNumber: number;        // 1 to 5
  date: string;             // e.g., "Aug 10, 2026"
  dayName: string;          // e.g., "Mon", "Tue"
  predictedClose: number;
  expectedLow: number;
  expectedHigh: number;
  dailyChangePct: number;
  cumulativeChangePct: number;
  trendSignal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  confidenceScore: number;
}

export interface WeeklyForwardProjection {
  symbol: string;
  currency: string;
  startPrice: number;
  endOfWeekTarget: number;
  weeklyChangePct: number;
  weeklyLow: number;
  weeklyHigh: number;
  overallBias: 'BULLISH CONTINUATION' | 'MODERATE GAIN' | 'SIDEWAYS / NEUTRAL' | 'BEARISH PULLBACK';
  weeklyConfidence: number;
  dailyProjections: WeeklyForwardDay[];
}

export interface PredictionResult {
  symbol: string;
  currency: string;
  lastClose: number;
  currentPrice: number;
  nextClose: number;
  percentChange: number;
  lowBand: number;
  highBand: number;
  maPrediction: number;
  regressionPrediction: number;
  momentumPrediction: number;
  sentimentAdjustedNextClose: number;
  backtestMetrics: BacktestMetrics;
  intradayPrediction?: IntradayPrediction;
  weeklyProjection?: WeeklyForwardProjection;
  chartData: Array<{
    date: string;
    actualClose?: number;
    ma?: number;
    reg?: number;
    backtestPred?: number;
    forecastPrice?: number;
    lowBand?: number;
    highBand?: number;
    isForecast?: boolean;
  }>;
}

export interface SentimentPost {
  source: string;
  text: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral' | string;
  timestamp?: string;
}

export interface SentimentAnalysisData {
  symbol: string;
  score: number; // -100 to +100
  label: string; // Bullish, Bearish, Neutral
  sentimentMultiplier: number; // e.g. 0.95 to 1.05 factor
  keyDrivers: string[];
  summary: string;
  samplePosts: SentimentPost[];
  references?: Array<{ title: string; uri: string }>;
}

export type IngestionTab = 'csv' | 'url' | 'ocr' | 'social';

export interface DailyRecommendation {
  id: string;
  symbol: string;
  companyName: string;
  currency: string;
  currentPrice: number;
  targetPrice: number;
  stopLoss: number;
  expectedReturnPct: number;
  signal: 'STRONG BUY' | 'BUY' | 'ACCUMULATE' | 'HOLD' | 'WATCH';
  timeframe: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  rationale: string;
  category: string;
  keyCatalysts: string[];
}

export interface StockPreset {
  id: string;
  symbol: string;
  name: string;
  currency: string;
  category: 'NSE India' | 'US Tech' | 'Crypto' | 'Indices' | 'Uploaded Image / Scan' | 'URL Import' | string;
  csvData: string;
  companyName: string;
}

export interface PriceAlertThreshold {
  enabled: boolean;
  targetPrice: number;
  condition: 'exceeds' | 'falls_below' | 'either';
  stockSymbol: string;
}

export interface ToastAlert {
  id: string;
  type: 'exceeded' | 'dropped' | 'info';
  title: string;
  message: string;
  symbol: string;
  predictedPrice: number;
  targetThreshold: number;
  currency: string;
  timestamp: string;
}

export interface MutualFundSuggestion {
  id: string;
  fundName: string;
  category: 'Large Cap' | 'Mid Cap' | 'Flexi Cap' | 'Dividend Yield' | 'Debt & Hybrid' | 'Index / ETF' | 'Global / Tech';
  cagr3Y: number; // 3-Year CAGR %
  cagr5Y: number; // 5-Year CAGR %
  dividendYield: number; // Dividend Yield %
  expenseRatio: number; // Expense Ratio %
  aumInCr: number; // AUM in Crores or $M
  riskRating: 'Low' | 'Moderate' | 'High' | 'Very High';
  starRating: 1 | 2 | 3 | 4 | 5;
  fundHouse: string;
  topHoldings: string[];
  recommendedStrategy: 'Growth & Wealth Creation' | 'Regular Income & Dividends' | 'Capital Preservation' | 'Aggressive Growth';
  currency: string;
  minSipAmount: number;
  dividendFrequency: 'Quarterly' | 'Monthly' | 'Annually';
}

