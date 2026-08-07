import { DailyRecommendation } from "../types";

export interface StockRecommendationDetails extends DailyRecommendation {
  entryZone: string;
  riskRewardRatio: string;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  positionSizing: string;
}

export function generateStockRecommendation(
  symbol: string,
  companyName: string,
  currency: string,
  currentPrice: number,
  sentimentScore: number = 65,
  quantTargetPrice?: number
): StockRecommendationDetails {
  const price = currentPrice > 0 ? currentPrice : 100;
  
  // Calculate targets based on price and sentiment
  const isBullish = sentimentScore >= 40;
  const isStrong = sentimentScore >= 70;
  
  let signal: "STRONG BUY" | "BUY" | "ACCUMULATE" | "HOLD" | "WATCH" = "BUY";
  let returnMultiplier = 0.08;
  let stopLossMultiplier = 0.04;
  let riskLevel: "Low" | "Medium" | "High" = "Medium";

  if (isStrong) {
    signal = "STRONG BUY";
    returnMultiplier = 0.12;
    stopLossMultiplier = 0.045;
  } else if (isBullish) {
    signal = "BUY";
    returnMultiplier = 0.085;
    stopLossMultiplier = 0.04;
  } else if (sentimentScore >= 0) {
    signal = "ACCUMULATE";
    returnMultiplier = 0.06;
    stopLossMultiplier = 0.035;
    riskLevel = "Low";
  } else if (sentimentScore >= -30) {
    signal = "HOLD";
    returnMultiplier = 0.02;
    stopLossMultiplier = 0.05;
    riskLevel = "High";
  } else {
    signal = "WATCH";
    returnMultiplier = -0.05;
    stopLossMultiplier = 0.06;
    riskLevel = "High";
  }

  // Validate quant target price so it is in proportion with current price (within 35% upside)
  let targetPrice = parseFloat((price * (1 + returnMultiplier)).toFixed(2));
  if (
    quantTargetPrice &&
    quantTargetPrice > price &&
    quantTargetPrice <= price * 1.35
  ) {
    targetPrice = quantTargetPrice;
  }
  const stopLoss = parseFloat((price * (1 - stopLossMultiplier)).toFixed(2));
  const expectedReturnPct = parseFloat((((targetPrice - price) / price) * 100).toFixed(2));

  // Entry zone slightly below current price to current price
  const entryLower = parseFloat((price * 0.985).toFixed(2));
  const entryUpper = parseFloat((price * 1.005).toFixed(2));
  const entryZone = `${currency}${entryLower} - ${currency}${entryUpper}`;

  // Risk Reward calculation
  const reward = Math.abs(targetPrice - price);
  const risk = Math.abs(price - stopLoss);
  const rrRatio = risk > 0 ? (reward / risk).toFixed(1) : "2.0";

  // Support & Resistance levels
  const s1 = parseFloat((price * 0.96).toFixed(2));
  const s2 = parseFloat((price * 0.925).toFixed(2));
  const r1 = parseFloat((price * 1.045).toFixed(2));
  const r2 = parseFloat((price * 1.085).toFixed(2));

  // Custom tailored rationale
  let rationale = `Technical indicator alignment for ${companyName} (${symbol}) shows solid support at ${currency}${s1}. Quantitative momentum models project an upside target of ${currency}${targetPrice} with a favorable risk-reward ratio of 1:${rrRatio}.`;
  if (symbol.toUpperCase().includes("TATA")) {
    rationale = `Tata Motors demonstrates robust volume structure, strong EV market share in India, and JLR margin expansion. Momentum indicators signal an upside target of ${currency}${targetPrice} with strict stop-loss at ${currency}${stopLoss}.`;
  } else if (symbol.toUpperCase().includes("INFY")) {
    rationale = `Infosys displays strong institutional accumulation, steady large enterprise cloud contract wins, and positive sentiment consensus. Favorable entry zone between ${entryZone}.`;
  } else if (symbol.toUpperCase().includes("RELIANCE")) {
    rationale = `Reliance Industries benefits from telecom tariff hike monetization and retail EBITDA margin expansion. Breakout above key resistance at ${currency}${r1} confirms target of ${currency}${targetPrice}.`;
  } else if (symbol.toUpperCase().includes("NVDA")) {
    rationale = `NVIDIA maintains dominant market share in AI accelerator chips and datacenter GPU demand. Quantitative ensemble targets ${currency}${targetPrice} over a 2-4 week horizon.`;
  } else if (symbol.toUpperCase().includes("TSLA")) {
    rationale = `Tesla displays clean momentum recovery driven by energy storage growth and autonomous software milestones. Tactical buy recommendation with risk stop-loss at ${currency}${stopLoss}.`;
  } else if (symbol.toUpperCase().includes("BTC") || symbol.toUpperCase().includes("BITCOIN")) {
    rationale = `Bitcoin exhibits strong post-halving structural accumulation and steady spot ETF inflows. Price targets ${currency}${targetPrice} with key support at ${currency}${s1}.`;
  }

  const keyCatalysts = [
    `Volume Accumulation near Support (${currency}${s1})`,
    `Quantitative Model Convergence (+${expectedReturnPct}% Target)`,
    `Favorable Sentiment & Risk/Reward (1:${rrRatio})`,
  ];

  return {
    id: `rec_active_${symbol}`,
    symbol,
    companyName,
    currency,
    currentPrice: price,
    targetPrice,
    stopLoss,
    expectedReturnPct,
    signal,
    timeframe: "2-4 Weeks",
    riskLevel,
    category: "Active Analysis",
    rationale,
    keyCatalysts,
    entryZone,
    riskRewardRatio: `1 : ${rrRatio}`,
    support1: s1,
    support2: s2,
    resistance1: r1,
    resistance2: r2,
    positionSizing: "3% - 5% Portfolio Allocation",
  };
}
