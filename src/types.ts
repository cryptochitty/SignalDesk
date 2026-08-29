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

export interface MonthlyForwardWeek {
  weekNumber: number;       // 1 to 4
  weekLabel: string;        // e.g., "Week 1 (Aug 21 - Aug 28)"
  startDate: string;
  endDate: string;
  predictedClose: number;
  expectedLow: number;
  expectedHigh: number;
  weeklyChangePct: number;
  cumulativeChangePct: number;
  trendSignal: 'STRONG BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  keyCatalyst: string;
}

export interface MonthlyForwardProjection {
  symbol: string;
  currency: string;
  startPrice: number;
  endOfMonthTarget: number;
  monthlyChangePct: number;
  monthlyLow: number;
  monthlyHigh: number;
  monthlyBias: 'STRONG EXPANSION' | 'BULLISH CONTINUATION' | 'MODERATE CONSOLIDATION' | 'BEARISH RETRACEMENT';
  monthlyConfidence: number;
  supportLevel: number;
  resistanceLevel: number;
  macroDriver: string;
  weeklyBreakdowns: MonthlyForwardWeek[];
}

export interface WeeklyCandle {
  weekStartDate: string;
  weekEndDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  isCompleted: boolean;
}

export interface ExecutionProtocolLevels {
  probeLevel: number;             // Prior week midpoint: (High + Low) / 2
  addLevel: number;               // Prior week high
  invalidationLevel: number;      // 4-week low
  currentPrice: number;
  distanceToProbePct: number;     // % from current to probe
  distanceToAddPct: number;       // % from current to add
  distanceToInvalidationPct: number; // % from current to invalidation
  actionStatus: 'PROBE ZONE' | 'BREAKOUT ADD' | 'HOLDING' | 'INVALIDATED / EXIT' | 'ABOVE ADD LEVEL';
  actionGuidance: string;
}

export interface WeeklyMethodAnalysis {
  symbol: string;
  currency: string;
  supertrend: {
    value: number;
    direction: 'BULLISH' | 'BEARISH';
    upperBand: number;
    lowerBand: number;
    atr10: number;
    factor: number; // 2.25
  };
  wilderRsi14: {
    value: number;
    condition: 'BULLISH MOMENTUM' | 'NEUTRAL' | 'OVERSOLD REBOUND' | 'OVERBOUGHT';
  };
  completedWeeklyCandle: {
    weekRange: string;
    open: number;
    high: number;
    low: number;
    close: number;
    changePct: number;
    scoreContribution: number; // 0-100 score driving baseline
  };
  liveWeeklyCandle: {
    weekRange: string;
    open: number;
    high: number;
    low: number;
    currentClose: number;
    weeklyGainPct: number;
    recoveryEvidenceScore: number; // 0-100 recovery evidence
    hasPositiveRecovery: boolean;
  };
  compositeScore: {
    technicalScore: number;    // 50% weight (0 - 50 max)
    fundamentalScore: number;  // 35% weight (0 - 35 max)
    executionScore: number;    // 15% weight (0 - 15 max)
    totalScore: number;        // 0 - 100 sum
    rating: 'STRONG ACCUMULATE' | 'TACTICAL BUY' | 'NEUTRAL HOLD' | 'DEFENSIVE REDUCE';
  };
  assetAuditStatus: {
    isTop200Pci: boolean;
    categoryLabel: string;
    survivalProxyScore: number;
    evidencePenalty: number;
  };
  executionProtocol: ExecutionProtocolLevels;
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
  monthlyProjection?: MonthlyForwardProjection;
  weeklyMethod?: WeeklyMethodAnalysis;
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

export interface DataSourceHealth {
  id: string;
  name: string;
  type: 'Exchange Match Engine' | 'Global Market Stream' | 'DEX Tick Engine' | 'Multi-Node Cluster' | 'Consensus Validator';
  status: 'ONLINE' | 'SYNCHRONIZED' | 'BACKUP_STANDBY';
  latencyMs: number;
  uptimePct: number;
  coverage: string;
  lastPing: string;
  accuracyRating: string;
}

export interface MultiSourceQuoteDetail {
  sourceName: string;
  price: number;
  timestamp: string;
  status: 'VERIFIED' | 'SYNCHRONIZED' | 'BACKTEST_ALIGNED';
  deviationPct: number;
}

export interface KiteSyncDetail {
  isSynced: boolean;
  instrumentToken: string;
  tradingSymbol: string;
  exchange: 'NSE' | 'BSE' | 'NFO' | 'CDS' | 'MCX' | 'NASDAQ' | 'GLOBAL';
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  lastTickTime: string;
  tickStatus: 'ACTIVE_LTP_STREAM' | 'CALIBRATED_TICK' | 'QUORUM_VERIFIED';
  spread: number;
  depthBid?: number;
  depthAsk?: number;
  tickLatencyMs?: number;
}

export interface MarketMover {
  symbol: string;
  displaySymbol: string;
  name: string;
  currency: string;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'Hyperliquid' | 'MCX' | 'GLOBAL';
  category: 'NSE India' | 'US Tech' | 'Crypto' | 'Commodities';
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  volumeFormatted: string;
  turnoverCr?: number;
  kiteToken?: string;
  sentimentScore: number;
  intradaySignal: 'STRONG BUY' | 'BUY' | 'ACCUMULATE' | 'SELL' | 'NEUTRAL';
  trendDirection: 'UP' | 'DOWN' | 'FLAT';
  keyCatalyst: string;
}

export interface TopGainersLosersData {
  lastUpdated: string;
  gainers: MarketMover[];
  losers: MarketMover[];
  mostActive: MarketMover[];
  advanceCount: number;
  declineCount: number;
  unchangedCount: number;
  marketBreadthPct: number;
  averageGainerPct: number;
  averageLoserPct: number;
}

export interface AccuracyQuote {
  symbol: string;
  displaySymbol: string;
  companyName: string;
  currency: string;
  livePrice: number;
  previousClose: number;
  change: number;
  changePct: number;
  exchange: string;
  source: string;
  secondarySource?: string;
  consensusSourcesCount?: number;
  quorumAgreementPct?: number;
  multiSources?: MultiSourceQuoteDetail[];
  kiteSync?: KiteSyncDetail;
  latencyMs?: number;
  lastCheckedTime: string;
  dataAgeSeconds: number;
  isAccurate: boolean;
  accuracyScore: number; // 0 to 100%
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  bidPrice?: number;
  askPrice?: number;
  status: 'VERIFIED_LTP' | 'MATCH_CONFIRMED' | 'CALIBRATED' | 'MULTI_SOURCE_CONSENSUS';
}

export interface AccuracyCheckConfig {
  autoCheckEnabled: boolean;
  checkIntervalSeconds: number; // e.g. 10, 15, 30, 60
  lastGlobalCheckTimestamp: number;
}

export interface NseTradingStrategy {
  id: string;
  name: string;
  category: 'Trend Following' | 'Breakout & Range' | 'Intraday Scalp' | 'Mean Reversion' | 'AI Custom Prompt';
  description: string;
  accuracyRate: number; // e.g. 84.5 (%)
  winRate: number;      // e.g. 78.2 (%)
  profitFactor: number; // e.g. 2.65
  avgRiskReward: string; // e.g. "1 : 2.8"
  timeframe: string;    // e.g. "15m Intraday", "1D Swing", "Weekly Positional"
  primaryIndicators: string[];
  rules: {
    entry: string;
    addPosition: string;
    stopLoss: string;
    target1: string;
    target2: string;
    invalidation: string;
  };
  recommendedFor: string;
}

export interface StrategyTradeOrder {
  id: string;
  timestamp: string;
  symbol: string;
  strategyName: string;
  action: 'PROBE BUY' | 'ADD / SCALE IN' | 'TAKE PROFIT (T1)' | 'TAKE PROFIT (T2)' | 'TRAILING STOP' | 'STOP LOSS EXIT';
  price: number;
  quantity: number;
  currency: string;
  pnl?: number;
  pnlPct?: number;
  status: 'FILLED' | 'TRIGGERED' | 'TARGET_HIT' | 'SL_HIT';
  reasoning: string;
}

export interface StrategyExecutionReport {
  strategyId: string;
  strategyName: string;
  symbol: string;
  currency: string;
  currentPrice: number;
  activeSignal: 'STRONG BUY' | 'ACCUMULATE PROBE' | 'BREAKOUT ADD' | 'HOLDING IN PROFIT' | 'EXIT / DEFENSIVE';
  confidenceScore: number; // 0-100%
  executionAccuracy: number; // 0-100%
  recommendedAllocationPct: number; // e.g. 10%
  levels: {
    entryPrice: number;
    probeLevel: number;
    addLevel: number;
    stopLoss: number;
    target1: number;
    target2: number;
    target3: number;
    riskRewardRatio: string;
    riskPerShare: number;
    maxRewardPerShare: number;
  };
  aiExecutionThesis: string;
  ruleChecklist: Array<{
    rule: string;
    status: 'PASSED' | 'PENDING' | 'WAITING_TRIGGER';
    details: string;
  }>;
  recentOrders: StrategyTradeOrder[];
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    profitFactor: number;
    totalPnl: number;
    maxDrawdownPct: number;
    sharpeRatio: number;
  };
}

export interface HiddenAiSignal {
  id: string;
  type: 'Order Block Imbalance' | 'Hidden Bullish Divergence' | 'Liquidity Sweep' | 'Dark Pool Footprint' | 'Volatility Compression' | 'Gamma Squeeze Trap';
  asset: string;
  assetClass: 'NSE Stock' | 'Commodity' | 'Crypto 24/7';
  confidence: number;
  timeframe: string;
  description: string;
  whatHumansMiss: string;
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  actionableRecommendation: string;
  detectedAt: string;
}

export interface GainLockShield {
  id: string;
  symbol: string;
  entryPrice: number;
  currentPrice: number;
  unrealizedGainPct: number;
  lockedGainPct: number;
  currentStopPrice: number;
  initialStopPrice: number;
  breakevenLocked: boolean;
  ratchetTier: string;
  downsideProtectedAmount: number;
  currency: string;
}

export interface AiAgentLearningMemory {
  id: string;
  tradeDate: string;
  symbol: string;
  assetClass: 'NSE Stock' | 'Commodity' | 'Crypto 24/7';
  setupType: string;
  outcome: 'WIN (+Gain Locked)' | 'WIN (Target Hit)' | 'CONTROLLED LOSS (SL Invalidation)';
  pnlPct: number;
  lessonLearned: string;
  parameterAdjustment: string;
  accuracyDelta: string;
}

export interface AiAgentAssetScan {
  symbol: string;
  name: string;
  assetClass: 'NSE Stock' | 'Commodity' | 'Crypto 24/7';
  marketStatus: 'OPEN' | 'LIVE 24/7' | 'PRE-MARKET';
  price: number;
  change24h: number;
  currency: string;
  aiPrediction: 'STRONG ACCUMULATION' | 'BREAKOUT PENDING' | 'PROBE LONG' | 'DEFENSIVE HEDGE' | 'LOCK GAINS';
  confidence: number;
  accuracyScore: number;
  keyLevel: string;
  strategyDeployed: string;
  deployedInSeconds: number;
}

export interface GroundedNewsHeadline {
  id: string;
  headline: string;
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  category: 'Earnings & Revenue' | 'Corporate Action' | 'Regulatory & SEBI' | 'Analyst Target' | 'Order Book & Deals' | 'Sector & Macro';
  source: string;
  url?: string;
  timeAgo: string;
  impactScore: number; // 1-100
}

export interface GroundedNewsData {
  symbol: string;
  companyName: string;
  overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number; // -100 to +100
  isGrounded: boolean;
  groundingSources: Array<{ title: string; uri: string }>;
  searchQueriesUsed: string[];
  lastUpdated: string;
  headlines: GroundedNewsHeadline[];
}

export interface KitePortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  t1Quantity?: number;
  averagePrice: number;
  investedAmount: number;
  ltp: number;
  dayChange: number;
  dayChangePct: number;
  pnl: number;
  pnlPct: number;
  assetClass: 'Equities' | 'Pre-IPO' | 'Commodity & Silver ETFs';
  kiteToken?: string;
  aiSignal?: 'ACCUMULATE' | 'HOLD' | 'PROBE HEDGE' | 'TAKE PROFIT' | 'STOP LOSS INVAL';
  keySupport?: number;
  keyTarget?: number;
}

export interface KitePortfolioPosition {
  id: string;
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  product: 'CNC' | 'MIS' | 'NRML';
  positionType: 'SOLD HOLDING' | 'HOLDING' | 'INTRADAY';
  averagePrice: number;
  ltp: number;
  pnl: number;
  pnlPct?: number;
  dayChangePct?: number;
  kiteToken?: string;
  aiRecommendation?: string;
}

export interface DailyProfitAction {
  id: string;
  symbol: string;
  name: string;
  type: 'BOOK_PROFIT' | 'TRAIL_STOP' | 'ACCUMULATE_DIP' | 'REBALANCE_HEDGE' | 'HARVEST_TAX_LOSS' | string;
  urgency: 'HIGH' | 'MEDIUM' | 'OPPORTUNITY' | string;
  sessionTime: '09:15 AM (Open)' | '11:00 AM (Morning)' | '12:30 PM (Mid-Day)' | '02:00 PM (Afternoon)' | '03:15 PM (EOD)' | string;
  title: string;
  description: string;
  triggerPrice: number;
  currentPrice: number;
  targetPrice?: number;
  projectedProfitImpact: string;
  status: 'PENDING' | 'EXECUTED' | 'DISMISSED';
  isExecuted?: boolean;
}

export interface DailyPortfolioSnapshot {
  id: string;
  date: string;
  dayLabel: string;
  totalInvested: number;
  currentValue: number;
  dayPnl: number;
  dayPnlPct: number;
  cumulativePnl: number;
  cumulativePnlPct: number;
  topGainer: string;
  topDrag: string;
  profitEnhancedDelta: number;
  notes: string;
  actionsTakenCount: number;
}

export interface ProfitEnhancementScorecard {
  enhancementScore: number; // 0 - 100
  potentialMonthlyAlpha: number; // in INR
  currentDrawdownRisk: 'LOW' | 'MODERATE' | 'CRITICAL';
  capitalEfficiencyPct: number;
  topActionableSuggestion: string;
  diversificationScore: number;
  profitProtectionHealth: number;
}

export interface KitePortfolioOverview {
  totalInvested: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPct: number;
  daysPnl: number;
  positionsPnl: number;
  holdingsCount: number;
  positionsCount: number;
  nifty50: { price: number; change: number; changePct: number };
  niftyBank: { price: number; change: number; changePct: number };
  holdings: KitePortfolioHolding[];
  positions: KitePortfolioPosition[];
  portfolioRiskMetrics?: {
    silverConcentrationPct: number;
    riskLevel: string;
    recommendedAction: string;
    highestGainerToday: string;
    topHoldingByValue: string;
  };
  dailyActionPlans?: DailyProfitAction[];
  snapshotHistory?: DailyPortfolioSnapshot[];
  enhancementScorecard?: ProfitEnhancementScorecard;
  lastSyncedAt?: string;
  nextAutoSyncSeconds?: number;
}

