import { StockPreset } from "../types";

/**
 * Generates a clean 6-month daily trading series (Feb 2, 2026 to Aug 5, 2026)
 * with deterministic, realistic price walk for walk-forward backtesting.
 */
function generate6MonthSeries(startPrice: number, endPrice: number, seed: number): string {
  const dates: string[] = [];
  const start = new Date(Date.UTC(2026, 1, 2)); // Feb 2, 2026
  const end = new Date(Date.UTC(2026, 7, 5));   // Aug 5, 2026

  let curr = new Date(start);
  while (curr <= end) {
    const day = curr.getUTCDay();
    if (day !== 0 && day !== 6) {
      const y = curr.getUTCFullYear();
      const m = String(curr.getUTCMonth() + 1).padStart(2, "0");
      const d = String(curr.getUTCDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  const n = dates.length;
  const rows: string[] = ["Date,Close"];

  let rng = seed;
  const pseudoRandom = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };

  const step = (endPrice - startPrice) / (n - 1);

  for (let i = 0; i < n; i++) {
    let price: number;
    if (i === 0) {
      price = startPrice;
    } else if (i === n - 1) {
      price = endPrice;
    } else {
      const noise = (pseudoRandom() - 0.48) * (startPrice * 0.015);
      const trendPrice = startPrice + step * i;
      price = trendPrice + noise;
    }
    rows.push(`${dates[i]},${price.toFixed(2)}`);
  }

  return rows.join("\n");
}

export const STOCK_PRESETS: StockPreset[] = [
  {
    id: "urbanco-nse",
    symbol: "URBANCO",
    name: "Urban Company",
    companyName: "Urban Company (URBANCO)",
    currency: "₹",
    category: "NSE India",
    csvData: generate6MonthSeries(182.50, 142.24, 101),
  },
  {
    id: "reliance-nse",
    symbol: "RELIANCE.NS",
    name: "Reliance Industries",
    companyName: "Reliance Industries Limited (NSE)",
    currency: "₹",
    category: "NSE India",
    csvData: generate6MonthSeries(1280.00, 1525.80, 202),
  },
  {
    id: "tcs-nse",
    symbol: "TCS.NS",
    name: "Tata Consultancy Services",
    companyName: "Tata Consultancy Services Ltd (NSE)",
    currency: "₹",
    category: "NSE India",
    csvData: generate6MonthSeries(3850.00, 4448.60, 303),
  },
  {
    id: "nifty50-nse",
    symbol: "NIFTY50.NS",
    name: "NSE Nifty 50 Index",
    companyName: "Nifty 50 Index (National Stock Exchange of India)",
    currency: "₹",
    category: "Indices",
    csvData: generate6MonthSeries(22100.00, 25520.80, 404),
  },
  {
    id: "tech-sample",
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    companyName: "NVIDIA Corp (NASDAQ)",
    currency: "$",
    category: "US Tech",
    csvData: generate6MonthSeries(112.50, 142.55, 505),
  },
  {
    id: "aapl-tech",
    symbol: "AAPL",
    name: "Apple Inc.",
    companyName: "Apple Inc. (NASDAQ)",
    currency: "$",
    category: "US Tech",
    csvData: generate6MonthSeries(182.00, 251.20, 606),
  },
  {
    id: "hl-btc",
    symbol: "BTC",
    name: "Bitcoin (Hyperliquid L1)",
    companyName: "Bitcoin Perpetual (Hyperliquid L1 DEX)",
    currency: "$",
    category: "Hyperliquid Crypto Perp",
    csvData: generate6MonthSeries(51800.00, 68820.50, 707),
  },
  {
    id: "hl-eth",
    symbol: "ETH",
    name: "Ethereum (Hyperliquid L1)",
    companyName: "Ethereum Perpetual (Hyperliquid L1 DEX)",
    currency: "$",
    category: "Hyperliquid Crypto Perp",
    csvData: generate6MonthSeries(2450.00, 3640.20, 808),
  },
  {
    id: "hl-sol",
    symbol: "SOL",
    name: "Solana (Hyperliquid L1)",
    companyName: "Solana Perpetual (Hyperliquid L1 DEX)",
    currency: "$",
    category: "Hyperliquid Crypto Perp",
    csvData: generate6MonthSeries(102.00, 174.50, 909),
  },
];
