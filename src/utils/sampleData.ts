import { StockPreset } from "../types";

/**
 * Generates a clean 6-month daily trading series ending on today's date
 * with exact ending price matching live benchmark price.
 */
function generate6MonthSeries(startPrice: number, endPrice: number, seed: number): string {
  const dates: string[] = [];
  const today = new Date(); // Current date (2026-08-20)
  
  // Collect 130 past business days up to today
  let curr = new Date(today);
  const businessDays: string[] = [];
  let count = 0;
  
  while (count < 130) {
    const day = curr.getUTCDay();
    if (day !== 0 && day !== 6) {
      const y = curr.getUTCFullYear();
      const m = String(curr.getUTCMonth() + 1).padStart(2, "0");
      const d = String(curr.getUTCDate()).padStart(2, "0");
      businessDays.unshift(`${y}-${m}-${d}`);
      count++;
    }
    curr.setUTCDate(curr.getUTCDate() - 1);
  }

  const n = businessDays.length;
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
      price = endPrice; // Strict exact match on latest close
    } else {
      const noise = (pseudoRandom() - 0.48) * (startPrice * 0.015);
      const trendPrice = startPrice + step * i;
      price = trendPrice + noise;
    }
    rows.push(`${businessDays[i]},${price.toFixed(2)}`);
  }

  return rows.join("\n");
}

export const STOCK_PRESETS: StockPreset[] = [
  {
    id: "urbanco-nse",
    symbol: "URBANCO",
    name: "Urban Company",
    companyName: "Urban Company (NSE)",
    currency: "₹",
    category: "Kite Watchlist",
    csvData: generate6MonthSeries(124.50, 158.60, 101),
  },
  {
    id: "moschip-nse",
    symbol: "MOSCHIP",
    name: "MosChip Technologies",
    companyName: "MosChip Technologies Ltd (NSE)",
    currency: "₹",
    category: "Kite Watchlist",
    csvData: generate6MonthSeries(165.00, 206.31, 105),
  },
  {
    id: "pinelabs-nse",
    symbol: "PINELABS",
    name: "Pine Labs",
    companyName: "Pine Labs (NSE Pre-IPO)",
    currency: "₹",
    category: "Kite Watchlist",
    csvData: generate6MonthSeries(134.00, 156.91, 104),
  },
  {
    id: "ioc-bse",
    symbol: "IOC",
    name: "Indian Oil Corp",
    companyName: "Indian Oil Corporation Ltd (BSE)",
    currency: "₹",
    category: "Kite Watchlist",
    csvData: generate6MonthSeries(148.00, 136.00, 106),
  },
  {
    id: "krrail-bse",
    symbol: "KRRAIL",
    name: "Konkan Railway (KR Rail)",
    companyName: "Konkan Railway Corp Ltd (BSE)",
    currency: "₹",
    category: "Kite Watchlist",
    csvData: generate6MonthSeries(26.50, 22.56, 107),
  },
  {
    id: "pwl-bse",
    symbol: "PWL",
    name: "Premier Polyfilm (PWL)",
    companyName: "Premier Polyfilm Ltd (BSE)",
    currency: "₹",
    category: "Kite Watchlist",
    csvData: generate6MonthSeries(98.00, 120.90, 108),
  },
  {
    id: "taparia-bse",
    symbol: "TAPARIA",
    name: "Taparia Tools",
    companyName: "Taparia Tools Ltd (BSE)",
    currency: "₹",
    category: "Kite Watchlist",
    csvData: generate6MonthSeries(12.14, 12.14, 109),
  },
  {
    id: "hcc-nse",
    symbol: "HCC",
    name: "Hindustan Construction",
    companyName: "Hindustan Construction Co Ltd (NSE)",
    currency: "₹",
    category: "Kite Watchlist",
    csvData: generate6MonthSeries(15.20, 21.22, 102),
  },
  {
    id: "bepl-nse",
    symbol: "BEPL",
    name: "Bhansali Eng Polymers",
    companyName: "Bhansali Engineering Polymers Ltd (NSE)",
    currency: "₹",
    category: "Kite Watchlist",
    csvData: generate6MonthSeries(98.40, 123.23, 103),
  },
  {
    id: "tatamotors-nse",
    symbol: "TATAMOTORS",
    name: "Tata Motors Ltd",
    companyName: "Tata Motors Ltd (NSE)",
    currency: "₹",
    category: "NSE India",
    csvData: generate6MonthSeries(885.00, 965.50, 202),
  },
  {
    id: "reliance-nse",
    symbol: "RELIANCE",
    name: "Reliance Industries",
    companyName: "Reliance Industries Limited (NSE)",
    currency: "₹",
    category: "NSE India",
    csvData: generate6MonthSeries(2810.00, 2985.00, 202),
  },
  {
    id: "infy-nse",
    symbol: "INFY",
    name: "Infosys Ltd",
    companyName: "Infosys Ltd (NSE)",
    currency: "₹",
    category: "NSE India",
    csvData: generate6MonthSeries(1720.00, 1842.00, 303),
  },
  {
    id: "tcs-nse",
    symbol: "TCS",
    name: "Tata Consultancy Services",
    companyName: "Tata Consultancy Services Ltd (NSE)",
    currency: "₹",
    category: "NSE India",
    csvData: generate6MonthSeries(3980.00, 4185.00, 404),
  },
  {
    id: "meesho-nse",
    symbol: "MEESHO",
    name: "Meesho",
    companyName: "Meesho (NSE / Pre-IPO)",
    currency: "₹",
    category: "NSE India",
    csvData: generate6MonthSeries(184.50, 206.54, 505),
  },
  {
    id: "tvshltd-nse",
    symbol: "TVSHLTD",
    name: "TVS Holdings Ltd",
    companyName: "TVS Holdings Ltd (NSE)",
    currency: "₹",
    category: "NSE India",
    csvData: generate6MonthSeries(13200.00, 14096.00, 606),
  },
  {
    id: "olaelec-nse",
    symbol: "OLAELEC",
    name: "Ola Electric Mobility",
    companyName: "Ola Electric Mobility Ltd (NSE)",
    currency: "₹",
    category: "NSE India",
    csvData: generate6MonthSeries(44.20, 38.61, 707),
  },
  {
    id: "nifty50-nse",
    symbol: "NIFTY50",
    name: "NSE Nifty 50 Index",
    companyName: "Nifty 50 Index (National Stock Exchange of India)",
    currency: "₹",
    category: "Indices",
    csvData: generate6MonthSeries(23400.00, 24231.85, 808),
  },
  {
    id: "nvda-tech",
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    companyName: "NVIDIA Corp (NASDAQ)",
    currency: "$",
    category: "US Tech",
    csvData: generate6MonthSeries(108.50, 124.80, 909),
  },
  {
    id: "aapl-tech",
    symbol: "AAPL",
    name: "Apple Inc.",
    companyName: "Apple Inc. (NASDAQ)",
    currency: "$",
    category: "US Tech",
    csvData: generate6MonthSeries(205.00, 224.50, 1010),
  },
  {
    id: "hl-btc",
    symbol: "BTC",
    name: "Bitcoin (Hyperliquid L1)",
    companyName: "Bitcoin Perpetual (Hyperliquid L1 DEX)",
    currency: "$",
    category: "Hyperliquid Crypto Perp",
    csvData: generate6MonthSeries(58200.00, 64800.00, 1111),
  },
  {
    id: "hl-eth",
    symbol: "ETH",
    name: "Ethereum (Hyperliquid L1)",
    companyName: "Ethereum Perpetual (Hyperliquid L1 DEX)",
    currency: "$",
    category: "Hyperliquid Crypto Perp",
    csvData: generate6MonthSeries(2420.00, 2680.00, 1212),
  },
  {
    id: "hl-sol",
    symbol: "SOL",
    name: "Solana (Hyperliquid L1)",
    companyName: "Solana Perpetual (Hyperliquid L1 DEX)",
    currency: "$",
    category: "Hyperliquid Crypto Perp",
    csvData: generate6MonthSeries(134.00, 152.00, 1313),
  },
];

