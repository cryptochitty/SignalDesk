import Papa from "papaparse";
import { StockDataRow } from "../types";

/**
 * Normalizes various date string formats into standard ISO YYYY-MM-DD
 * Returns empty string if the input string is not a valid date.
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  const cleanStr = dateStr.trim();
  if (!cleanStr) return "";

  // Reject purely numeric values (e.g. prices like "142.24" or volumes like "50000")
  if (/^\d+(\.\d+)?$/.test(cleanStr)) {
    return "";
  }

  // Try YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = cleanStr.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  // Try DD-MM-YYYY or MM-DD-YYYY or DD/MM/YYYY
  const ddmmyyyyMatch = cleanStr.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const p1 = parseInt(ddmmyyyyMatch[1], 10);
    const p2 = parseInt(ddmmyyyyMatch[2], 10);
    const year = parseInt(ddmmyyyyMatch[3], 10);

    if (year >= 1900 && year <= 2100) {
      let month = p1 <= 12 ? p1 : p2;
      let day = p1 <= 12 ? p2 : p1;
      if (p2 > 12) {
        day = p2;
        month = p1;
      }
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${year}-${pad(month)}-${pad(day)}`;
      }
    }
  }

  // Fallback to JS Date parsing for strings like "Aug 5, 2026", "2026-Aug-05"
  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getUTCFullYear();
    if (year >= 1900 && year <= 2100) {
      const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
      const day = String(parsed.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  return "";
}

/**
 * Clean numeric string representation (removes currency symbols, commas, quotes)
 */
export function cleanNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;

  const str = String(val)
    .replace(/[₹$€£,"]/g, "")
    .trim();

  if (!str || str === "-" || str === "N/A" || str === "null" || str === "undefined") {
    return null;
  }

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Scans raw CSV rows to find header row and date-price column indexes
 */
function findColumnIndexes(rawRows: any[][]): { headerRowIdx: number; dateColIdx: number; closeColIdx: number } {
  let bestHeaderRowIdx = -1;
  let bestDateColIdx = -1;
  let bestCloseColIdx = -1;
  let maxScore = -1;

  const maxSearchRows = Math.min(rawRows.length, 10);

  for (let rIdx = 0; rIdx < maxSearchRows; rIdx++) {
    const row = rawRows[rIdx];
    if (!Array.isArray(row) || row.length === 0) continue;

    let candidateDateCol = -1;
    let candidateCloseCol = -1;
    let dateScore = 0;
    let closeScore = 0;

    row.forEach((cell, cIdx) => {
      const cellStr = String(cell || "").trim().toLowerCase();
      if (!cellStr) return;

      // Check for Date column indicators
      if (/^(date|trade_?date|timestamp|trans_?date|day|period|dt)$/i.test(cellStr)) {
        candidateDateCol = cIdx;
        dateScore = 10;
      } else if (/date|time|timestamp/i.test(cellStr) && candidateDateCol === -1) {
        candidateDateCol = cIdx;
        dateScore = 5;
      }

      // Check for Close / Price column indicators
      if (/^(close|closing|close_?price|closing_?price|adj_?close|adjusted_?close|settle|settlement)$/i.test(cellStr)) {
        candidateCloseCol = cIdx;
        closeScore = 10;
      } else if (/(^|_)(close|adj_?close)($|_)/i.test(cellStr) && closeScore < 10) {
        candidateCloseCol = cIdx;
        closeScore = 9;
      } else if (/^(last|last_?price|ltp|cmp)$/i.test(cellStr) && closeScore < 8) {
        candidateCloseCol = cIdx;
        closeScore = 8;
      } else if (/^(price|rate|value|val|nav)$/i.test(cellStr) && closeScore < 5) {
        if (!/open|high|low|vol|qty|quantity|turnover|change|chg|%/i.test(cellStr)) {
          candidateCloseCol = cIdx;
          closeScore = 5;
        }
      }
    });

    const totalScore = dateScore + closeScore;
    if (totalScore > maxScore && candidateDateCol !== -1 && candidateCloseCol !== -1 && candidateDateCol !== candidateCloseCol) {
      maxScore = totalScore;
      bestHeaderRowIdx = rIdx;
      bestDateColIdx = candidateDateCol;
      bestCloseColIdx = candidateCloseCol;
    }
  }

  return {
    headerRowIdx: bestHeaderRowIdx,
    dateColIdx: bestDateColIdx,
    closeColIdx: bestCloseColIdx,
  };
}

/**
 * Fallback column inference by sampling data rows when no explicit header text is present
 */
function inferColumnIndexesFromData(rawRows: any[][], startRow: number): { dateColIdx: number; closeColIdx: number } {
  const colStats: Record<number, { validDates: number; validPrices: number; totalNonEmpty: number; sumPrice: number; integerCount: number }> = {};

  const sampleRows = rawRows.slice(startRow, startRow + 30);

  sampleRows.forEach((row) => {
    if (!Array.isArray(row)) return;
    row.forEach((cell, cIdx) => {
      if (!colStats[cIdx]) {
        colStats[cIdx] = { validDates: 0, validPrices: 0, totalNonEmpty: 0, sumPrice: 0, integerCount: 0 };
      }

      const cellStr = String(cell || "").trim();
      if (!cellStr) return;

      colStats[cIdx].totalNonEmpty++;

      const isoDate = normalizeDate(cellStr);
      if (isoDate) {
        colStats[cIdx].validDates++;
      }

      const num = cleanNumber(cellStr);
      if (num !== null && num > 0 && isFinite(num)) {
        colStats[cIdx].validPrices++;
        colStats[cIdx].sumPrice += num;
        if (Number.isInteger(num) && num > 1000) {
          colStats[cIdx].integerCount++;
        }
      }
    });
  });

  let bestDateCol = 0;
  let maxDates = -1;

  let bestCloseCol = 1;
  let maxPrices = -1;

  Object.entries(colStats).forEach(([cIdxStr, stats]) => {
    const cIdx = parseInt(cIdxStr, 10);
    if (stats.validDates > maxDates) {
      maxDates = stats.validDates;
      bestDateCol = cIdx;
    }
  });

  Object.entries(colStats).forEach(([cIdxStr, stats]) => {
    const cIdx = parseInt(cIdxStr, 10);
    if (cIdx === bestDateCol) return;

    const isLikelyVolume = stats.totalNonEmpty > 0 && stats.integerCount / stats.totalNonEmpty > 0.8 && (stats.sumPrice / stats.totalNonEmpty) > 100000;
    
    if (!isLikelyVolume && stats.validPrices > maxPrices) {
      maxPrices = stats.validPrices;
      bestCloseCol = cIdx;
    }
  });

  return { dateColIdx: bestDateCol, closeColIdx: bestCloseCol };
}

/**
 * Parses raw CSV or whitespace/tab delimited text into clean StockDataRow[]
 */
export function parseCSV(rawText: string): { rows: StockDataRow[]; detectedCurrency: string } {
  if (!rawText || !rawText.trim()) {
    return { rows: [], detectedCurrency: "$" };
  }

  let detectedCurrency = "$";
  if (rawText.includes("₹") || rawText.toLowerCase().includes("inr") || rawText.includes(".NS")) {
    detectedCurrency = "₹";
  } else if (rawText.includes("€") || rawText.toLowerCase().includes("eur")) {
    detectedCurrency = "€";
  } else if (rawText.includes("£") || rawText.toLowerCase().includes("gbp")) {
    detectedCurrency = "£";
  }

  // Use PapaParse for intelligent delimiter detection
  const parsed = Papa.parse<any>(rawText.trim(), {
    skipEmptyLines: "greedy",
    dynamicTyping: false,
  });

  const rawRows: any[] = parsed.data;
  if (!rawRows || rawRows.length === 0) {
    return { rows: [], detectedCurrency };
  }

  // 1. Scan for explicit header row and date-price column pair
  const headerInfo = findColumnIndexes(rawRows);
  let dateColIdx = headerInfo.dateColIdx;
  let closeColIdx = headerInfo.closeColIdx;
  let startIdx = 0;

  if (headerInfo.headerRowIdx !== -1) {
    startIdx = headerInfo.headerRowIdx + 1;
  } else {
    // 2. If no explicit header row, infer column pair from data structure
    const inferred = inferColumnIndexesFromData(rawRows, 0);
    dateColIdx = inferred.dateColIdx;
    closeColIdx = inferred.closeColIdx;
  }

  const resultRows: StockDataRow[] = [];

  for (let i = startIdx; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row) continue;

    let dateVal = "";
    let closeVal: number | null = null;

    if (Array.isArray(row)) {
      if (row.length === 1 && typeof row[0] === "string") {
        const parts = row[0].trim().split(/[\s,;\t]+/);
        if (parts.length >= 2) {
          for (const p of parts) {
            const normD = normalizeDate(p);
            if (normD && !dateVal) dateVal = normD;
            const normN = cleanNumber(p);
            if (normN !== null && normN > 0 && closeVal === null && !normalizeDate(p)) {
              closeVal = normN;
            }
          }
        }
      } else {
        dateVal = String(row[dateColIdx] ?? "").trim();
        closeVal = cleanNumber(row[closeColIdx]);
      }
    } else if (typeof row === "object" && row !== null) {
      const keys = Object.keys(row);
      const dateKey = keys.find((k) => /^(date|trade_?date|timestamp|time|dt)$/i.test(k.trim())) || keys[dateColIdx] || keys[0];
      const closeKey = keys.find((k) => /^(close|closing|close_?price|adj_?close|last|price)$/i.test(k.trim())) || keys[closeColIdx] || keys[1];

      dateVal = String(row[dateKey] ?? "").trim();
      closeVal = cleanNumber(row[closeKey]);
    }

    const isoDate = normalizeDate(dateVal);
    if (isoDate && closeVal !== null && !isNaN(closeVal) && closeVal > 0) {
      resultRows.push({
        date: isoDate,
        close: closeVal,
      });
    }
  }

  // Deduplicate by date & sort chronologically ascending
  const uniqueMap = new Map<string, StockDataRow>();
  resultRows.forEach((r) => {
    uniqueMap.set(r.date, r);
  });

  const sortedRows = Array.from(uniqueMap.values()).sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (isNaN(da) || isNaN(db)) return a.date.localeCompare(b.date);
    return da - db;
  });

  return { rows: sortedRows, detectedCurrency };
}

