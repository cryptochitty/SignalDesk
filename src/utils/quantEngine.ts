import {
  StockDataRow,
  QuantitativeConfig,
  PredictionResult,
  BacktestMetrics,
  SentimentAnalysisData,
  WeeklyForwardProjection,
  WeeklyForwardDay,
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

  // Intraday Buying Zone
  let buyRangeLow: number;
  let buyRangeHigh: number;
  let buyOptimal: number;

  if (signal === "STRONG BUY" || signal === "BUY / LONG") {
    buyRangeLow = Math.min(prevClose, S1);
    buyRangeHigh = prevClose * (1 - dailyVolPct * 0.15);
    buyOptimal = (buyRangeLow + buyRangeHigh) / 2;
  } else {
    buyRangeLow = S2;
    buyRangeHigh = S1;
    buyOptimal = S1;
  }

  // Intraday Selling Targets
  let sellTarget1: number;
  let sellTarget2: number;
  let sellTarget3: number;

  if (signal === "STRONG BUY" || signal === "BUY / LONG") {
    sellTarget1 = Math.max(prevClose * 1.008, PP);
    sellTarget2 = Math.max(sellTarget1 * 1.012, R1);
    sellTarget3 = Math.max(sellTarget2 * 1.015, R2);
  } else {
    sellTarget1 = prevClose * (1 - dailyVolPct * 0.4);
    sellTarget2 = S1;
    sellTarget3 = S2;
  }

  // Intraday Stop Loss (1:2.8 Risk:Reward ratio)
  const stopDistance = Math.abs(sellTarget1 - buyOptimal) / 2.8;
  const stopLoss = buyOptimal - Math.max(prevClose * 0.005, stopDistance);

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

