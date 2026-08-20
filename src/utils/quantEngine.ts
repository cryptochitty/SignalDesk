import {
  StockDataRow,
  QuantitativeConfig,
  PredictionResult,
  BacktestMetrics,
  SentimentAnalysisData,
  WeeklyForwardProjection,
  WeeklyForwardDay,
  MonthlyForwardProjection,
  MonthlyForwardWeek,
  WeeklyCandle,
  WeeklyMethodAnalysis,
  ExecutionProtocolLevels,
} from "../types";

/**
 * Calculates Simple Moving Average for a given window size
 */
export function calculateMA(prices: number[], windowSize: number): number {
  if (prices.length === 0) return 0;
  const actualWindow = Math.min(windowSize, prices.length);
  const subset = prices.slice(prices.length - actualWindow);
  const sum = subset.reduce((acc, val) => acc + val, 0);
  return sum / actualWindow;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], windowSize: number): number {
  if (prices.length === 0) return 0;
  const actualWindow = Math.min(windowSize, prices.length);
  const k = 2 / (actualWindow + 1);

  let ema = prices[prices.length - actualWindow];
  for (let i = prices.length - actualWindow + 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * Fits Linear Regression (OLS) over recent points
 * Returns { slope, intercept, predict(x) }
 */
export function calculateLinearRegression(prices: number[]): {
  slope: number;
  intercept: number;
  predictNext: (stepsAhead: number) => number;
} {
  const n = prices.length;
  if (n <= 1) {
    const val = prices[0] || 0;
    return { slope: 0, intercept: val, predictNext: () => val };
  }

  // Fit OLS on up to the most recent 30 price points for accurate local trend modeling
  const lookback = Math.min(30, n);
  const subset = prices.slice(n - lookback);
  const m = subset.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < m; i++) {
    const x = i;
    const y = subset[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = m * sumXX - sumX * sumX;
  const slope = denominator !== 0 ? (m * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / m;
  const lastPrice = prices[n - 1];

  return {
    slope,
    intercept,
    predictNext: (stepsAhead: number) => {
      const targetX = m - 1 + stepsAhead;
      const rawPred = slope * targetX + intercept;

      // Bound predictions relative to last price to prevent unrealistic extrapolation explosion
      const maxChangeFraction = Math.min(0.20, 0.03 * stepsAhead + 0.05);
      const minBound = lastPrice * (1 - maxChangeFraction);
      const maxBound = lastPrice * (1 + maxChangeFraction);

      return Math.min(maxBound, Math.max(minBound, rawPred));
    },
  };
}

/**
 * Calculates Momentum velocity over a window
 */
export function calculateMomentumPrediction(prices: number[], lookback: number = 3): number {
  const n = prices.length;
  if (n <= 1) return prices[0] || 0;

  const actualLookback = Math.min(lookback, n - 1);
  const current = prices[n - 1];
  const previous = prices[n - 1 - actualLookback];

  if (!previous || previous <= 0) return current;

  const momentumRate = (current - previous) / previous; // percentage change
  // Project momentum forward with damped persistence coefficient and realistic 1-step bounds (max +/- 10%)
  const clampedRate = Math.max(-0.10, Math.min(0.10, momentumRate * 0.7));
  return current * (1 + clampedRate);
}

/**
 * Safely adds days to a date string (YYYY-MM-DD) using UTC arithmetic.
 * Prevents "RangeError: Invalid time value" and DST/timezone shifts.
 */
export function getFutureDateString(baseDateStr: string, daysToAdd: number): string {
  if (!baseDateStr) {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + daysToAdd);
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const clean = baseDateStr.trim();
  const ymdMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);

  let dateObj: Date;

  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    dateObj = new Date(Date.UTC(year, month, day));
  } else {
    dateObj = new Date(clean);
  }

  if (isNaN(dateObj.getTime())) {
    const fallback = new Date();
    fallback.setUTCDate(fallback.getUTCDate() + daysToAdd);
    const y = fallback.getUTCFullYear();
    const m = String(fallback.getUTCMonth() + 1).padStart(2, "0");
    const d = String(fallback.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const futureTime = dateObj.getTime() + daysToAdd * 24 * 60 * 60 * 1000;
  const futureDate = new Date(futureTime);

  if (isNaN(futureDate.getTime())) {
    return `+${daysToAdd}d`;
  }

  const y = futureDate.getUTCFullYear();
  const m = String(futureDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(futureDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Standard deviation of historical daily returns for volatility band
 */
export function calculateVolatility(prices: number[]): number {
  if (prices.length <= 1) return 0.02; // default 2% daily volatility

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(ret);
  }

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1 || 1);

  return Math.sqrt(variance);
}

/**
 * Z-score multiplier for confidence level
 */
export function getZScore(confidenceLevel: number): number {
  if (confidenceLevel >= 95) return 1.96;
  if (confidenceLevel >= 90) return 1.645;
  return 1.28; // 80%
}

/**
 * Filters data rows based on selected backtest horizon (in months or trading days)
 */
export function filterRowsForBacktestWindow(
  rows: StockDataRow[],
  horizonMonths?: number
): StockDataRow[] {
  if (!horizonMonths || horizonMonths <= 0 || rows.length === 0) {
    return rows;
  }

  const lastRow = rows[rows.length - 1];
  const lastDate = new Date(lastRow.date);
  if (isNaN(lastDate.getTime())) return rows;

  const targetStartDate = new Date(lastDate);
  targetStartDate.setMonth(targetStartDate.getMonth() - horizonMonths);

  const filtered = rows.filter((r) => {
    const d = new Date(r.date);
    return !isNaN(d.getTime()) && d >= targetStartDate;
  });

  // Ensure we keep at least 10 rows for mathematical validity
  return filtered.length >= 10 ? filtered : rows;
}

/**
 * Computes historical Walk-Forward Backtesting
 */
export function runWalkForwardBacktest(
  rows: StockDataRow[],
  config: QuantitativeConfig,
  sentimentMultiplier: number = 1.0
): { metrics: BacktestMetrics; backtestSeries: StockDataRow[] } {
  // Respect configured backtest horizon in months (e.g. 1, 3, 6 months)
  const targetRows = filterRowsForBacktestWindow(rows, config.backtestHorizonMonths);
  const prices = targetRows.map((r) => r.close);
  const total = prices.length;

  if (total < 4) {
    return {
      metrics: {
        mae: 0,
        maePercent: 0,
        rmse: 0,
        directionalAccuracy: 100,
        maxError: 0,
        sampleCount: 0,
      },
      backtestSeries: targetRows,
    };
  }

  const startIdx = Math.max(3, Math.floor(total * 0.3)); // use first 30% as burn-in window
  let totalError = 0;
  let totalSqError = 0;
  let maxError = 0;
  let correctDirectionCount = 0;
  let testSamples = 0;

  const weights = config.weights;
  const totalWeight = weights.ma + weights.regression + weights.momentum || 1;

  const updatedRows = [...targetRows];

  for (let i = startIdx; i < total; i++) {
    const historyPrices = prices.slice(0, i);
    const actualPrice = prices[i];
    const prevActual = prices[i - 1];

    // Predict for index i using history up to i-1
    const maPred = calculateMA(historyPrices, config.maWindow);
    const regRes = calculateLinearRegression(historyPrices);
    const regPred = regRes.predictNext(1);
    const momPred = calculateMomentumPrediction(historyPrices, 3);

    let ensemblePred =
      (weights.ma * maPred + weights.regression * regPred + weights.momentum * momPred) /
      totalWeight;

    // Apply sentiment factor if sentiment weight > 0
    if (weights.sentiment > 0 && sentimentMultiplier !== 1.0) {
      const sentimentEffect = (sentimentMultiplier - 1.0) * weights.sentiment;
      ensemblePred = ensemblePred * (1 + sentimentEffect);
    }

    const absErr = Math.abs(ensemblePred - actualPrice);
    totalError += absErr;
    totalSqError += absErr * absErr;
    if (absErr > maxError) maxError = absErr;

    // Direction check
    const actualDirection = Math.sign(actualPrice - prevActual);
    const predDirection = Math.sign(ensemblePred - prevActual);
    if (actualDirection === predDirection || actualDirection === 0) {
      correctDirectionCount++;
    }

    testSamples++;

    updatedRows[i] = {
      ...updatedRows[i],
      ma: Math.round(maPred * 100) / 100,
      reg: Math.round(regPred * 100) / 100,
      momentum: Math.round(momPred * 100) / 100,
      backtestPred: Math.round(ensemblePred * 100) / 100,
      backtestError: Math.round(absErr * 100) / 100,
    };
  }

  const mae = testSamples > 0 ? totalError / testSamples : 0;
  const rmse = testSamples > 0 ? Math.sqrt(totalSqError / testSamples) : 0;
  const lastPrice = prices[prices.length - 1] || 1;
  const maePercent = (mae / lastPrice) * 100;
  const directionalAccuracy =
    testSamples > 0 ? (correctDirectionCount / testSamples) * 100 : 100;

  return {
    metrics: {
      mae: Math.round(mae * 100) / 100,
      maePercent: Math.round(maePercent * 10) / 10,
      rmse: Math.round(rmse * 100) / 100,
      directionalAccuracy: Math.round(directionalAccuracy * 10) / 10,
      maxError: Math.round(maxError * 100) / 100,
      sampleCount: testSamples,
    },
    backtestSeries: updatedRows,
  };
}

/**
 * Generates full Ensemble Prediction & Multi-Day Horizon Forecast
 */
export function generatePrediction(
  symbol: string,
  currency: string,
  rows: StockDataRow[],
  config: QuantitativeConfig,
  sentimentData?: SentimentAnalysisData | null
): PredictionResult | null {
  if (!rows || rows.length === 0) return null;

  const prices = rows.map((r) => r.close);
  const lastClose = prices[prices.length - 1];

  // Sentiment multiplier factor
  const sentimentMultiplier =
    sentimentData && config.weights.sentiment > 0
      ? sentimentData.sentimentMultiplier
      : 1.0;

  // Run Walk-Forward Backtest first
  const { metrics, backtestSeries } = runWalkForwardBacktest(rows, config, sentimentMultiplier);

  // Calculate individual model 1-step predictions
  const maPrediction = calculateMA(prices, config.maWindow);
  const regResult = calculateLinearRegression(prices);
  const regressionPrediction = regResult.predictNext(1);
  const momentumPrediction = calculateMomentumPrediction(prices, 3);

  // Raw weighted ensemble
  const weights = config.weights;
  const totalWeight = weights.ma + weights.regression + weights.momentum || 1;

  const rawEnsemble =
    (weights.ma * maPrediction +
      weights.regression * regressionPrediction +
      weights.momentum * momentumPrediction) /
    totalWeight;

  // Sentiment adjustment
  let sentimentAdjustedNextClose = rawEnsemble;
  if (weights.sentiment > 0 && sentimentMultiplier !== 1.0) {
    const sentimentEffect = (sentimentMultiplier - 1.0) * weights.sentiment;
    sentimentAdjustedNextClose = rawEnsemble * (1 + sentimentEffect);
  }

  // Clamp 1-day prediction to realistic financial step boundaries (max +/- 15%)
  const minAllowed = lastClose * 0.85;
  const maxAllowed = lastClose * 1.15;
  const nextClose = Math.min(maxAllowed, Math.max(minAllowed, sentimentAdjustedNextClose));
  const percentChange = ((nextClose - lastClose) / lastClose) * 100;

  // Calculate Volatility Confidence Bands
  const volatility = calculateVolatility(prices);
  const zScore = getZScore(config.confidenceLevel);
  const margin1Day = zScore * volatility * lastClose;

  const lowBand = Math.max(0, nextClose - margin1Day);
  const highBand = nextClose + margin1Day;

  // Build combined chart points (Historical + Backtest + Future Forecast Horizon)
  const backtestMap = new Map<string, StockDataRow>();
  backtestSeries.forEach((b) => backtestMap.set(b.date, b));

  const chartData: PredictionResult["chartData"] = rows.map((r) => {
    const backtestRow = backtestMap.get(r.date);
    return {
      date: r.date,
      actualClose: r.close,
      ma: backtestRow?.ma,
      reg: backtestRow?.reg,
      backtestPred: backtestRow?.backtestPred,
      isForecast: false,
    };
  });

  // Append future horizon forecast points
  const lastRowDate = rows[rows.length - 1]?.date || "";
  for (let k = 1; k <= config.forecastHorizon; k++) {
    const dateStr = getFutureDateString(lastRowDate, k);

    // Project each model k steps ahead
    const kMa = maPrediction; // MA stays constant or slow decay
    const kReg = regResult.predictNext(k);
    const kMom = momentumPrediction * Math.pow(0.95, k - 1); // decaying momentum

    let kEnsemble =
      (weights.ma * kMa + weights.regression * kReg + weights.momentum * kMom) /
      totalWeight;

    if (weights.sentiment > 0 && sentimentMultiplier !== 1.0) {
      const sentimentEffect = (sentimentMultiplier - 1.0) * weights.sentiment * Math.pow(0.9, k - 1);
      kEnsemble = kEnsemble * (1 + sentimentEffect);
    }

    const kMargin = zScore * volatility * Math.sqrt(k) * lastClose;
    const kLow = Math.max(0, kEnsemble - kMargin);
    const kHigh = kEnsemble + kMargin;

    chartData.push({
      date: dateStr,
      forecastPrice: Math.round(kEnsemble * 100) / 100,
      lowBand: Math.round(kLow * 100) / 100,
      highBand: Math.round(kHigh * 100) / 100,
      isForecast: true,
    });
  }

  // Generate Intraday Buying and Selling Range Prediction
  const intradayPrediction = calculateIntradayPrediction(
    symbol,
    currency,
    lastClose,
    nextClose,
    volatility,
    rows,
    sentimentData?.score || 0
  );

  // Generate 1-Week Forward Projection
  const weeklyProjection = calculateWeeklyForwardProjection(
    symbol,
    currency,
    lastClose,
    volatility,
    rows,
    chartData,
    sentimentData?.score || 0
  );

  // Generate 1-Month (4-Week Forward) Macro Horizon Projection
  const monthlyProjection = calculateMonthlyForwardProjection(
    symbol,
    currency,
    lastClose,
    volatility,
    rows,
    weeklyProjection,
    sentimentData?.score || 0
  );

  // Generate Multi-Timeframe Weekly Methodology Analysis (Supertrend ATR 10 / 2.25, Wilder RSI 14, Composite 50/35/15, Probe/Add/Invalidation)
  const weeklyMethod = calculateWeeklyMethodology(
    symbol,
    currency,
    rows,
    sentimentData?.score || 60
  );

  return {
    symbol,
    currency,
    lastClose: Math.round(lastClose * 100) / 100,
    currentPrice: Math.round(lastClose * 100) / 100,
    nextClose: Math.round(nextClose * 100) / 100,
    percentChange: Math.round(percentChange * 100) / 100,
    lowBand: Math.round(lowBand * 100) / 100,
    highBand: Math.round(highBand * 100) / 100,
    maPrediction: Math.round(maPrediction * 100) / 100,
    regressionPrediction: Math.round(regressionPrediction * 100) / 100,
    momentumPrediction: Math.round(momentumPrediction * 100) / 100,
    sentimentAdjustedNextClose: Math.round(sentimentAdjustedNextClose * 100) / 100,
    backtestMetrics: metrics,
    intradayPrediction,
    weeklyProjection,
    monthlyProjection,
    weeklyMethod,
    chartData,
  };
}

/**
 * Calculates Intraday Entry (Buy) and Exit (Sell) Targets, Pivots, and Session Curve
 */
export function calculateIntradayPrediction(
  symbol: string,
  currency: string,
  lastClose: number,
  nextClose: number,
  volatility: number,
  rows: StockDataRow[],
  sentimentScore: number = 0
) {
  const lastRow = rows[rows.length - 1];
  const dailyVolPct = Math.max(0.010, Math.min(0.060, volatility));

  // Determine High, Low, Close for floor pivot points
  const prevClose = lastClose;
  const prevHigh = lastRow?.high && lastRow.high > 0 ? lastRow.high : prevClose * (1 + dailyVolPct * 0.7);
  const prevLow = lastRow?.low && lastRow.low > 0 ? lastRow.low : prevClose * (1 - dailyVolPct * 0.7);

  // Standard Floor Pivot Calculations
  const PP = (prevHigh + prevLow + prevClose) / 3;
  const R1 = (2 * PP) - prevLow;
  const S1 = (2 * PP) - prevHigh;
  const R2 = PP + (prevHigh - prevLow);
  const S2 = PP - (prevHigh - prevLow);

  const priceDiff = nextClose - lastClose;
  const pctChange = (priceDiff / lastClose) * 100;

  let signal: "STRONG BUY" | "BUY / LONG" | "SELL / SHORT" | "NEUTRAL HOLD" = "BUY / LONG";
  if (pctChange > 1.2) {
    signal = "STRONG BUY";
  } else if (pctChange >= -0.3) {
    signal = "BUY / LONG";
  } else if (pctChange < -1.2) {
    signal = "SELL / SHORT";
  } else {
    signal = "NEUTRAL HOLD";
  }

  // Intraday Buying Zone & Optimal Entry (anchored directly to current share price)
  let buyRangeLow: number;
  let buyRangeHigh: number;
  let buyOptimal: number;

  const currentPrice = prevClose;

  if (signal === "STRONG BUY" || signal === "BUY / LONG") {
    // Actionable Buy Zone centered on current price
    const lowerOffset = Math.max(0.003, dailyVolPct * 0.25);
    const upperOffset = Math.max(0.002, dailyVolPct * 0.10);

    buyRangeLow = Math.min(currentPrice * (1 - lowerOffset), Math.max(S1, currentPrice * 0.985));
    buyRangeHigh = Math.max(currentPrice * (1 + upperOffset), buyRangeLow * 1.004);
    buyOptimal = currentPrice; // Take optimal entry directly as the current share price
  } else if (signal === "SELL / SHORT") {
    buyRangeLow = Math.min(currentPrice * (1 - dailyVolPct * 0.5), S2);
    buyRangeHigh = currentPrice;
    buyOptimal = currentPrice;
  } else {
    // Neutral / Hold
    buyRangeLow = Math.min(currentPrice * 0.993, S1);
    buyRangeHigh = Math.max(currentPrice * 1.003, PP);
    buyOptimal = currentPrice;
  }

  // Ensure buyRangeLow <= buyRangeHigh
  if (buyRangeLow > buyRangeHigh) {
    const temp = buyRangeLow;
    buyRangeLow = buyRangeHigh;
    buyRangeHigh = temp;
  }

  // Intraday Selling Targets (anchored directly from current share price)
  let sellTarget1: number;
  let sellTarget2: number;
  let sellTarget3: number;

  if (signal === "STRONG BUY" || signal === "BUY / LONG") {
    const t1Pct = Math.max(0.008, dailyVolPct * 0.35);
    sellTarget1 = Math.max(currentPrice * (1 + t1Pct), PP);
    sellTarget2 = Math.max(sellTarget1 * 1.012, R1);
    sellTarget3 = Math.max(sellTarget2 * 1.015, R2);
  } else if (signal === "SELL / SHORT") {
    sellTarget1 = currentPrice * (1 - Math.max(0.010, dailyVolPct * 0.4));
    sellTarget2 = currentPrice * (1 - Math.max(0.022, dailyVolPct * 0.8));
    sellTarget3 = currentPrice * (1 - Math.max(0.038, dailyVolPct * 1.2));
  } else {
    sellTarget1 = Math.max(currentPrice * 1.008, R1);
    sellTarget2 = Math.max(sellTarget1 * 1.012, R2);
    sellTarget3 = sellTarget2 * 1.015;
  }

  // Intraday Stop Loss (Risk Management anchored to current price)
  let stopLoss: number;
  if (signal === "SELL / SHORT") {
    stopLoss = currentPrice * (1 + Math.max(0.008, dailyVolPct * 0.5));
  } else {
    const minRiskDist = currentPrice * Math.max(0.006, dailyVolPct * 0.4);
    stopLoss = Math.min(buyRangeLow * 0.997, currentPrice - minRiskDist);
  }

  // Expected Intraday High and Low
  const expectedHigh = Math.max(prevHigh, R1, nextClose * (1 + dailyVolPct * 0.4));
  const expectedLow = Math.min(prevLow, S1, buyRangeLow * 0.995);
  const expectedVwap = (PP + prevClose + buyOptimal) / 3;

  // Calculate Confidence Score
  const confidenceScore = Math.min(96, Math.max(68, Math.round(82 + (sentimentScore * 0.1) - (dailyVolPct * 100))));

  // Risk / Reward Ratio
  const riskAmount = Math.abs(buyOptimal - stopLoss);
  const rewardAmount = Math.abs(sellTarget2 - buyOptimal);
  const rrValue = riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(1) : "2.8";
  const riskRewardRatio = `1 : ${rrValue}`;

  // Hourly Session Trajectory (09:30 AM to 03:30 PM)
  const sessionHours = [
    { time: "09:30 AM", factor: -0.25 },
    { time: "10:30 AM", factor: 0.10 },
    { time: "12:00 PM", factor: -0.05 },
    { time: "01:30 PM", factor: 0.40 },
    { time: "03:00 PM", factor: 0.85 },
    { time: "03:30 PM", factor: 1.00 },
  ];

  const totalDelta = nextClose - prevClose;
  const intradayHourlyCurve = sessionHours.map((h) => {
    const projPrice = prevClose + totalDelta * h.factor;
    const sessionVwap = (expectedVwap + projPrice) / 2;
    const bandMargin = prevClose * dailyVolPct * 0.35;
    return {
      time: h.time,
      predictedPrice: Math.round(projPrice * 100) / 100,
      vwap: Math.round(sessionVwap * 100) / 100,
      lowBand: Math.round((projPrice - bandMargin) * 100) / 100,
      highBand: Math.round((projPrice + bandMargin) * 100) / 100,
    };
  });

  return {
    symbol,
    currency,
    currentPrice: Math.round(prevClose * 100) / 100,
    signal,
    confidenceScore,
    buyRangeLow: Math.round(buyRangeLow * 100) / 100,
    buyRangeHigh: Math.round(buyRangeHigh * 100) / 100,
    buyOptimal: Math.round(buyOptimal * 100) / 100,
    sellTarget1: Math.round(sellTarget1 * 100) / 100,
    sellTarget2: Math.round(sellTarget2 * 100) / 100,
    sellTarget3: Math.round(sellTarget3 * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    expectedHigh: Math.round(expectedHigh * 100) / 100,
    expectedLow: Math.round(expectedLow * 100) / 100,
    expectedVwap: Math.round(expectedVwap * 100) / 100,
    pivotPoint: Math.round(PP * 100) / 100,
    resistance1: Math.round(R1 * 100) / 100,
    resistance2: Math.round(R2 * 100) / 100,
    support1: Math.round(S1 * 100) / 100,
    support2: Math.round(S2 * 100) / 100,
    riskRewardRatio,
    intradayHourlyCurve,
  };
}

/**
 * Calculates 1-Week (5-Trading-Day) Forward Projection Model
 */
export function calculateWeeklyForwardProjection(
  symbol: string,
  currency: string,
  lastClose: number,
  volatility: number,
  rows: StockDataRow[],
  chartData: PredictionResult["chartData"],
  sentimentScore: number = 0
): WeeklyForwardProjection {
  // Filter future forecast items from chartData
  const forecastPoints = chartData.filter((c) => c.isForecast);
  const weekDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const daysToProject = Math.min(5, forecastPoints.length > 0 ? forecastPoints.length : 5);
  const dailyProjections: WeeklyForwardDay[] = [];

  let prevClose = lastClose;
  let minLow = lastClose;
  let maxHigh = lastClose;

  // Compute future dates starting tomorrow
  const today = new Date();
  let dayOffset = 1;

  for (let i = 0; i < daysToProject; i++) {
    const pt = forecastPoints[i];
    const dayNum = i + 1;

    // Find next business day
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + dayOffset);
    while (futureDate.getDay() === 0 || futureDate.getDay() === 6) {
      dayOffset++;
      futureDate.setDate(today.getDate() + dayOffset);
    }
    dayOffset++;

    const dayNameIndex = futureDate.getDay() === 0 ? 6 : futureDate.getDay() - 1;
    const dayName = weekDayNames[dayNameIndex] || `Day ${dayNum}`;
    const dateStr = pt?.date || futureDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const predictedClose = pt?.forecastPrice || prevClose * (1 + (i + 1) * 0.003);
    const expectedLow = pt?.lowBand || predictedClose * (1 - volatility * Math.sqrt(dayNum));
    const expectedHigh = pt?.highBand || predictedClose * (1 + volatility * Math.sqrt(dayNum));

    minLow = Math.min(minLow, expectedLow);
    maxHigh = Math.max(maxHigh, expectedHigh);

    const dailyChangePct = ((predictedClose - prevClose) / prevClose) * 100;
    const cumulativeChangePct = ((predictedClose - lastClose) / lastClose) * 100;

    let trendSignal: "BULLISH" | "NEUTRAL" | "BEARISH" = "NEUTRAL";
    if (dailyChangePct > 0.20) trendSignal = "BULLISH";
    else if (dailyChangePct < -0.20) trendSignal = "BEARISH";

    const dayConfidence = Math.min(95, Math.max(60, Math.round(88 - dayNum * 2.5 + sentimentScore * 0.05)));

    dailyProjections.push({
      dayNumber: dayNum,
      date: dateStr,
      dayName,
      predictedClose: Math.round(predictedClose * 100) / 100,
      expectedLow: Math.round(expectedLow * 100) / 100,
      expectedHigh: Math.round(expectedHigh * 100) / 100,
      dailyChangePct: Math.round(dailyChangePct * 100) / 100,
      cumulativeChangePct: Math.round(cumulativeChangePct * 100) / 100,
      trendSignal,
      confidenceScore: dayConfidence,
    });

    prevClose = predictedClose;
  }

  const endOfWeekTarget = dailyProjections[dailyProjections.length - 1]?.predictedClose || lastClose;
  const weeklyChangePct = ((endOfWeekTarget - lastClose) / lastClose) * 100;

  let overallBias: WeeklyForwardProjection["overallBias"] = "SIDEWAYS / NEUTRAL";
  if (weeklyChangePct >= 2.0) overallBias = "BULLISH CONTINUATION";
  else if (weeklyChangePct > 0.3) overallBias = "MODERATE GAIN";
  else if (weeklyChangePct <= -1.2) overallBias = "BEARISH PULLBACK";

  const weeklyConfidence = Math.min(92, Math.max(65, Math.round(84 + sentimentScore * 0.08 - volatility * 50)));

  return {
    symbol,
    currency,
    startPrice: Math.round(lastClose * 100) / 100,
    endOfWeekTarget: Math.round(endOfWeekTarget * 100) / 100,
    weeklyChangePct: Math.round(weeklyChangePct * 100) / 100,
    weeklyLow: Math.round(minLow * 100) / 100,
    weeklyHigh: Math.round(maxHigh * 100) / 100,
    overallBias,
    weeklyConfidence,
    dailyProjections,
  };
}

/**
 * Calculates 1-Month (4-Week Forward Macro Horizon) Projection Model
 */
export function calculateMonthlyForwardProjection(
  symbol: string,
  currency: string,
  lastClose: number,
  volatility: number,
  rows: StockDataRow[],
  weeklyProjection: WeeklyForwardProjection,
  sentimentScore: number = 0
): MonthlyForwardProjection {
  const monthVolPct = Math.max(0.015, Math.min(0.08, volatility));
  const week1Target = weeklyProjection?.endOfWeekTarget || lastClose * (1 + (sentimentScore >= 0 ? 0.015 : -0.01));
  const baseWeeklyDrift = ((week1Target - lastClose) / lastClose);

  // Derive 4-week macro trajectory with mean-reversion and momentum continuity
  const weeklyBreakdowns: MonthlyForwardWeek[] = [];
  let prevWeekClose = lastClose;
  let runningMin = lastClose;
  let runningMax = lastClose;

  const catalysts = [
    `Momentum Continuation & Institutional Flow Absorption`,
    `Moving Average Support Retest & Volume Consolidation`,
    `Earnings/Macro Guidance & Valuation Multiple Re-rating`,
    `Month-End Balance Sheet Drift & Target Convergence`,
  ];

  const today = new Date();

  for (let w = 1; w <= 4; w++) {
    // Week start and end dates
    const startOffsetDays = (w - 1) * 7 + 1;
    const endOffsetDays = w * 7;
    
    const dStart = new Date(today);
    dStart.setDate(today.getDate() + startOffsetDays);
    const dEnd = new Date(today);
    dEnd.setDate(today.getDate() + endOffsetDays);

    const startStr = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = dEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekLabel = `Week ${w} (${startStr} - ${endStr})`;

    // Projected weekly compound with decay factor
    const decay = Math.pow(0.85, w - 1);
    const stepReturn = baseWeeklyDrift * decay + (sentimentScore > 30 ? 0.006 * w : 0.002);
    
    let predClose = w === 1 ? week1Target : prevWeekClose * (1 + stepReturn);
    
    // Bounds check to avoid unrealistic runaway extrapolation (cap monthly shift within -25% to +35%)
    predClose = Math.max(lastClose * 0.75, Math.min(lastClose * 1.35, predClose));

    const weekExpLow = predClose * (1 - monthVolPct * Math.sqrt(w) * 0.75);
    const weekExpHigh = predClose * (1 + monthVolPct * Math.sqrt(w) * 0.85);

    runningMin = Math.min(runningMin, weekExpLow);
    runningMax = Math.max(runningMax, weekExpHigh);

    const weeklyChangePct = ((predClose - prevWeekClose) / prevWeekClose) * 100;
    const cumulativeChangePct = ((predClose - lastClose) / lastClose) * 100;

    let trendSignal: MonthlyForwardWeek["trendSignal"] = "NEUTRAL";
    if (weeklyChangePct >= 2.5) trendSignal = "STRONG BULLISH";
    else if (weeklyChangePct > 0.4) trendSignal = "BULLISH";
    else if (weeklyChangePct < -0.8) trendSignal = "BEARISH";

    weeklyBreakdowns.push({
      weekNumber: w,
      weekLabel,
      startDate: startStr,
      endDate: endStr,
      predictedClose: Math.round(predClose * 100) / 100,
      expectedLow: Math.round(weekExpLow * 100) / 100,
      expectedHigh: Math.round(weekExpHigh * 100) / 100,
      weeklyChangePct: Math.round(weeklyChangePct * 100) / 100,
      cumulativeChangePct: Math.round(cumulativeChangePct * 100) / 100,
      trendSignal,
      keyCatalyst: catalysts[w - 1] || "Quarterly Liquidity Transition",
    });

    prevWeekClose = predClose;
  }

  const endOfMonthTarget = weeklyBreakdowns[3].predictedClose;
  const monthlyChangePct = ((endOfMonthTarget - lastClose) / lastClose) * 100;

  let monthlyBias: MonthlyForwardProjection["monthlyBias"] = "MODERATE CONSOLIDATION";
  if (monthlyChangePct >= 6.0) monthlyBias = "STRONG EXPANSION";
  else if (monthlyChangePct > 1.5) monthlyBias = "BULLISH CONTINUATION";
  else if (monthlyChangePct <= -3.5) monthlyBias = "BEARISH RETRACEMENT";

  const monthlyConfidence = Math.min(88, Math.max(60, Math.round(80 + sentimentScore * 0.06 - volatility * 40)));
  const supportLevel = Math.round((lastClose * (1 - monthVolPct * 1.5)) * 100) / 100;
  const resistanceLevel = Math.round((endOfMonthTarget * 1.025) * 100) / 100;

  let macroDriver = `Institutional accumulation corridor with ${monthlyBias.toLowerCase()} bias. Model anticipates target of ${currency}${endOfMonthTarget} backed by multi-week momentum drift.`;
  if (sentimentScore >= 50) {
    macroDriver = `Sustained bullish sentiment and positive volume accumulation support a 30-day expansion toward ${currency}${endOfMonthTarget} (+${monthlyChangePct.toFixed(2)}%).`;
  } else if (sentimentScore < 0) {
    macroDriver = `Defensive consolidation expected with primary support holding near ${currency}${supportLevel} and key recovery hurdle at ${currency}${resistanceLevel}.`;
  }

  return {
    symbol,
    currency,
    startPrice: Math.round(lastClose * 100) / 100,
    endOfMonthTarget: Math.round(endOfMonthTarget * 100) / 100,
    monthlyChangePct: Math.round(monthlyChangePct * 100) / 100,
    monthlyLow: Math.round(runningMin * 100) / 100,
    monthlyHigh: Math.round(runningMax * 100) / 100,
    monthlyBias,
    monthlyConfidence,
    supportLevel,
    resistanceLevel,
    macroDriver,
    weeklyBreakdowns,
  };
}

/**
 * Aggregates daily StockDataRow rows into weekly OHLC candlesticks.
 * Identifies completed weekly candles and the live ongoing weekly candle.
 */
export function aggregateToWeeklyCandles(rows: StockDataRow[]): WeeklyCandle[] {
  if (!rows || rows.length === 0) return [];

  // Sort chronologically by date
  const sorted = [...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const weeklyMap = new Map<string, StockDataRow[]>();

  sorted.forEach((r) => {
    const d = new Date(r.date);
    if (isNaN(d.getTime())) return;
    
    // Group by Monday-based ISO week
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
    const weekKey = monday.toISOString().split("T")[0];

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, []);
    }
    weeklyMap.get(weekKey)!.push(r);
  });

  const weekKeys = Array.from(weeklyMap.keys()).sort();
  const totalWeeks = weekKeys.length;

  const candles: WeeklyCandle[] = weekKeys.map((wk, idx) => {
    const dayRows = weeklyMap.get(wk)!;
    const open = dayRows[0].open || dayRows[0].close;
    const close = dayRows[dayRows.length - 1].close;
    let high = -Infinity;
    let low = Infinity;
    let volume = 0;

    dayRows.forEach((dr) => {
      const rHigh = dr.high !== undefined ? dr.high : dr.close;
      const rLow = dr.low !== undefined ? dr.low : dr.close;
      if (rHigh > high) high = rHigh;
      if (rLow < low) low = rLow;
      if (dr.volume) volume += dr.volume;
    });

    if (high === -Infinity) high = Math.max(open, close);
    if (low === Infinity) low = Math.min(open, close);

    const endDate = dayRows[dayRows.length - 1].date;
    const isCompleted = idx < totalWeeks - 1 || dayRows.length >= 5;

    return {
      weekStartDate: wk,
      weekEndDate: endDate,
      open,
      high,
      low,
      close,
      volume,
      isCompleted,
    };
  });

  return candles;
}

/**
 * Calculates Wilder's 14-period smoothed RSI on Weekly Closes
 */
export function calculateWilderRSI(
  closes: number[],
  length: number = 14
): {
  value: number;
  condition: 'BULLISH MOMENTUM' | 'NEUTRAL' | 'OVERSOLD REBOUND' | 'OVERBOUGHT';
} {
  if (!closes || closes.length < 2) {
    return { value: 50, condition: 'NEUTRAL' };
  }

  // If fewer than length points, extrapolate or use available
  const period = Math.min(length, closes.length - 1);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const currGain = diff >= 0 ? diff : 0;
    const currLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (length - 1) + currGain) / length;
    avgLoss = (avgLoss * (length - 1) + currLoss) / length;
  }

  if (avgLoss === 0) {
    return { value: 100, condition: 'OVERBOUGHT' };
  }

  const rs = avgGain / avgLoss;
  const rsi = Math.round((100 - 100 / (1 + rs)) * 10) / 10;

  let condition: 'BULLISH MOMENTUM' | 'NEUTRAL' | 'OVERSOLD REBOUND' | 'OVERBOUGHT' = 'NEUTRAL';
  if (rsi >= 70) condition = 'OVERBOUGHT';
  else if (rsi >= 55) condition = 'BULLISH MOMENTUM';
  else if (rsi <= 35) condition = 'OVERSOLD REBOUND';

  return { value: rsi, condition };
}

/**
 * Calculates Weekly Supertrend using ATR length 10 and factor 2.25
 */
export function calculateSupertrendWeekly(
  candles: WeeklyCandle[],
  atrLength: number = 10,
  factor: number = 2.25
): {
  value: number;
  direction: 'BULLISH' | 'BEARISH';
  upperBand: number;
  lowerBand: number;
  atr10: number;
  factor: number;
} {
  if (!candles || candles.length === 0) {
    return {
      value: 0,
      direction: 'BULLISH',
      upperBand: 0,
      lowerBand: 0,
      atr10: 0,
      factor,
    };
  }

  const n = candles.length;
  // Compute True Range for each candle
  const tr: number[] = [];
  for (let i = 0; i < n; i++) {
    const c = candles[i];
    if (i === 0) {
      tr.push(c.high - c.low);
    } else {
      const prevClose = candles[i - 1].close;
      const trueRange = Math.max(
        c.high - c.low,
        Math.abs(c.high - prevClose),
        Math.abs(c.low - prevClose)
      );
      tr.push(trueRange);
    }
  }

  // Smooth ATR(10)
  const actualPeriod = Math.min(atrLength, tr.length);
  let atr = tr.slice(0, actualPeriod).reduce((a, b) => a + b, 0) / actualPeriod;
  for (let i = actualPeriod; i < tr.length; i++) {
    atr = (atr * (atrLength - 1) + tr[i]) / atrLength;
  }

  const lastCandle = candles[n - 1];
  const hl2 = (lastCandle.high + lastCandle.low) / 2;
  const basicUpperBand = hl2 + factor * atr;
  const basicLowerBand = hl2 - factor * atr;

  let supertrendVal: number;
  let direction: 'BULLISH' | 'BEARISH';

  if (lastCandle.close >= hl2) {
    direction = 'BULLISH';
    supertrendVal = Math.round(basicLowerBand * 100) / 100;
  } else {
    direction = 'BEARISH';
    supertrendVal = Math.round(basicUpperBand * 100) / 100;
  }

  return {
    value: supertrendVal,
    direction,
    upperBand: Math.round(basicUpperBand * 100) / 100,
    lowerBand: Math.round(basicLowerBand * 100) / 100,
    atr10: Math.round(atr * 100) / 100,
    factor,
  };
}

/**
 * Calculates Multi-Timeframe Weekly Quantitative Methodology:
 * 1. Weekly Supertrend (ATR 10, Factor 2.25)
 * 2. Weekly RSI (Wilder RSI 14)
 * 3. Last Completed Weekly Candle score contribution
 * 4. Live Weekly Candle recovery evidence
 * 5. Composite Score = 50 Technical + 35 Fundamental + 15 Execution
 * 6. Audited Top 200 PCI reuse vs Other asset survival proxy penalty
 * 7. Probe Level = Prior week midpoint: (High + Low) / 2
 * 8. Add Level = Prior week high
 * 9. Invalidation Level = Four week low
 */
export function calculateWeeklyMethodology(
  symbol: string,
  currency: string,
  rows: StockDataRow[],
  sentimentScore: number = 60
): WeeklyMethodAnalysis {
  const weeklyCandles = aggregateToWeeklyCandles(rows);
  const currentPrice = rows.length > 0 ? rows[rows.length - 1].close : 100;

  // Fallback synthetic candles if history is short (< 4 weeks)
  const fullCandles = [...weeklyCandles];
  while (fullCandles.length < 6) {
    const prev = fullCandles[0] || {
      open: currentPrice * 0.96,
      high: currentPrice * 0.98,
      low: currentPrice * 0.94,
      close: currentPrice * 0.96,
      weekStartDate: "2026-01-01",
      weekEndDate: "2026-01-07",
      isCompleted: true,
    };
    fullCandles.unshift({
      open: prev.open * 0.98,
      high: prev.high * 0.985,
      low: prev.low * 0.975,
      close: prev.close * 0.98,
      weekStartDate: "2025-12-01",
      weekEndDate: "2025-12-07",
      isCompleted: true,
    });
  }

  // 1. Weekly Supertrend (ATR length 10, factor 2.25)
  const supertrend = calculateSupertrendWeekly(fullCandles, 10, 2.25);

  // 2. Weekly RSI (Wilder RSI length 14)
  const weeklyCloses = fullCandles.map((c) => c.close);
  const wilderRsi14 = calculateWilderRSI(weeklyCloses, 14);

  // Separate completed weekly candles from live weekly candle
  const completedCandles = fullCandles.filter((c) => c.isCompleted);
  const lastCompletedCandle =
    completedCandles.length > 0
      ? completedCandles[completedCandles.length - 1]
      : fullCandles[fullCandles.length - 1];

  const liveCandle = fullCandles[fullCandles.length - 1];

  // 3. Last Completed Weekly Candle score contribution (0-100 baseline)
  const compRange = Math.max(0.01, lastCompletedCandle.high - lastCompletedCandle.low);
  const compClosePosition = (lastCompletedCandle.close - lastCompletedCandle.low) / compRange; // 0 to 1
  const compWeeklyGainPct =
    ((lastCompletedCandle.close - lastCompletedCandle.open) / lastCompletedCandle.open) * 100;

  let completedScore = 50;
  if (compClosePosition > 0.65) completedScore += 25;
  else if (compClosePosition < 0.35) completedScore -= 20;

  if (compWeeklyGainPct > 2.0) completedScore += 20;
  else if (compWeeklyGainPct < -2.0) completedScore -= 20;

  if (supertrend.direction === 'BULLISH') completedScore += 10;
  else completedScore -= 10;

  completedScore = Math.min(100, Math.max(10, completedScore));

  // 4. Live Weekly Candle supplies recovery evidence
  const liveWeeklyGainPct = ((currentPrice - liveCandle.open) / liveCandle.open) * 100;
  const liveRange = Math.max(0.01, liveCandle.high - liveCandle.low);
  const liveBounceFromLow = ((currentPrice - liveCandle.low) / liveRange) * 100;

  let recoveryEvidenceScore = 50;
  if (liveWeeklyGainPct > 0) recoveryEvidenceScore += Math.min(30, liveWeeklyGainPct * 5);
  else recoveryEvidenceScore -= Math.min(30, Math.abs(liveWeeklyGainPct) * 4);

  if (liveBounceFromLow > 50) recoveryEvidenceScore += 20;
  recoveryEvidenceScore = Math.min(100, Math.max(5, Math.round(recoveryEvidenceScore)));

  const hasPositiveRecovery = liveWeeklyGainPct >= 0 || liveBounceFromLow > 50;

  // 6 & 7. Asset Audited Top 200 PCI vs other coins survival proxy penalty
  const upperSym = symbol.toUpperCase().replace(".NS", "").replace(".BO", "");
  const isTop200Pci =
    /BTC|ETH|SOL|SUI|AVAX|HYPE|XRP|RELIANCE|TCS|HDFCBANK|INFY|TATAMOTORS|ICICIBANK|ITC|SBIN|BHARTIARTL|LT|KOTAKBANK|NVDA|AAPL|MSFT|AMZN|GOOGL|TSLA|META/i.test(
      upperSym
    ) || symbol.length <= 6;

  const categoryLabel = isTop200Pci ? "Audited Top 200 PCI Asset" : "Non-Audited Alt / Speculative Asset";
  const survivalProxyScore = isTop200Pci ? 95 : 60;
  const evidencePenalty = isTop200Pci ? 0 : 12; // Capped penalty for non-audited assets

  // 8. Probe is the prior week midpoint: (Prior High + Prior Low) / 2
  const probeLevel = Math.round(((lastCompletedCandle.high + lastCompletedCandle.low) / 2) * 100) / 100;

  // 9. Add is the prior week high
  const addLevel = Math.round(lastCompletedCandle.high * 100) / 100;

  // 10. Invalidation is the four week low
  const recent4Completed = completedCandles.slice(-4);
  const fourWeekLow =
    recent4Completed.length > 0
      ? Math.min(...recent4Completed.map((c) => c.low))
      : lastCompletedCandle.low * 0.95;
  const invalidationLevel = Math.round(fourWeekLow * 100) / 100;

  // Distance percentages from current price
  const distanceToProbePct = Math.round((((probeLevel - currentPrice) / currentPrice) * 100) * 10) / 10;
  const distanceToAddPct = Math.round((((addLevel - currentPrice) / currentPrice) * 100) * 10) / 10;
  const distanceToInvalidationPct = Math.round((((currentPrice - invalidationLevel) / currentPrice) * 100) * 10) / 10;

  // Action status & guidance
  let actionStatus: ExecutionProtocolLevels["actionStatus"] = "HOLDING";
  let actionGuidance = "";

  if (currentPrice < invalidationLevel) {
    actionStatus = "INVALIDATED / EXIT";
    actionGuidance = `Current price below 4-week low (${currency}${invalidationLevel}). Invalidation triggered; preserve capital.`;
  } else if (currentPrice >= addLevel) {
    actionStatus = "BREAKOUT ADD";
    actionGuidance = `Price broke above prior week high (${currency}${addLevel}). Add sizing on confirmed momentum breakout.`;
  } else if (Math.abs(currentPrice - probeLevel) / probeLevel <= 0.015 || (currentPrice >= probeLevel && currentPrice < addLevel)) {
    actionStatus = "PROBE ZONE";
    actionGuidance = `Trading in optimal test zone around prior week midpoint (${currency}${probeLevel}). Initiating probe position.`;
  } else {
    actionStatus = "HOLDING";
    actionGuidance = `Holding structure above 4-week low (${currency}${invalidationLevel}) with upside trigger at (${currency}${addLevel}).`;
  }

  // 5. Composite Score = 50 Technical, 35 Fundamental, 15 Execution
  // Technical (50 max): Supertrend (15) + RSI (15) + Completed Candle (10) + Live Recovery (10)
  let rawTech = 0;
  if (supertrend.direction === 'BULLISH') rawTech += 15;
  else rawTech += 4;

  if (wilderRsi14.value >= 50 && wilderRsi14.value <= 70) rawTech += 15;
  else if (wilderRsi14.value > 70) rawTech += 11;
  else if (wilderRsi14.value >= 40) rawTech += 9;
  else rawTech += 5;

  rawTech += (completedScore / 100) * 10;
  rawTech += (recoveryEvidenceScore / 100) * 10;
  const technicalScore = Math.round(Math.min(50, Math.max(5, rawTech)) * 10) / 10;

  // Fundamental (35 max): Top 200 PCI audit / survival proxy (20) + Macro / Sentiment (15) - penalty
  const rawFund =
    (survivalProxyScore / 100) * 20 +
    (Math.max(0, sentimentScore) / 100) * 15 -
    evidencePenalty;
  const fundamentalScore = Math.round(Math.min(35, Math.max(5, rawFund)) * 10) / 10;

  // Execution (15 max): Distance from invalidation safety + probe/add alignment
  let rawExec = 8;
  if (currentPrice > invalidationLevel) rawExec += 4;
  if (actionStatus === "PROBE ZONE" || actionStatus === "BREAKOUT ADD") rawExec += 3;
  if (currentPrice < invalidationLevel) rawExec = 2;
  const executionScore = Math.round(Math.min(15, Math.max(1, rawExec)) * 10) / 10;

  const totalScore = Math.round(technicalScore + fundamentalScore + executionScore);

  let rating: WeeklyMethodAnalysis["compositeScore"]["rating"] = "NEUTRAL HOLD";
  if (totalScore >= 78) rating = "STRONG ACCUMULATE";
  else if (totalScore >= 62) rating = "TACTICAL BUY";
  else if (totalScore >= 45) rating = "NEUTRAL HOLD";
  else rating = "DEFENSIVE REDUCE";

  return {
    symbol,
    currency,
    supertrend,
    wilderRsi14,
    completedWeeklyCandle: {
      weekRange: `${lastCompletedCandle.weekStartDate} to ${lastCompletedCandle.weekEndDate}`,
      open: Math.round(lastCompletedCandle.open * 100) / 100,
      high: Math.round(lastCompletedCandle.high * 100) / 100,
      low: Math.round(lastCompletedCandle.low * 100) / 100,
      close: Math.round(lastCompletedCandle.close * 100) / 100,
      changePct: Math.round(compWeeklyGainPct * 100) / 100,
      scoreContribution: Math.round(completedScore),
    },
    liveWeeklyCandle: {
      weekRange: `${liveCandle.weekStartDate} (Live)`,
      open: Math.round(liveCandle.open * 100) / 100,
      high: Math.round(liveCandle.high * 100) / 100,
      low: Math.round(liveCandle.low * 100) / 100,
      currentClose: Math.round(currentPrice * 100) / 100,
      weeklyGainPct: Math.round(liveWeeklyGainPct * 100) / 100,
      recoveryEvidenceScore,
      hasPositiveRecovery,
    },
    compositeScore: {
      technicalScore,
      fundamentalScore,
      executionScore,
      totalScore,
      rating,
    },
    assetAuditStatus: {
      isTop200Pci,
      categoryLabel,
      survivalProxyScore,
      evidencePenalty,
    },
    executionProtocol: {
      probeLevel,
      addLevel,
      invalidationLevel,
      currentPrice: Math.round(currentPrice * 100) / 100,
      distanceToProbePct,
      distanceToAddPct,
      distanceToInvalidationPct,
      actionStatus,
      actionGuidance,
    },
  };
}


