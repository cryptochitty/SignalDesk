import * as XLSX from "xlsx";
import { PredictionResult } from "../types";

/**
 * Generates and triggers download of a multi-sheet Microsoft Excel workbook (.xlsx)
 * containing full quantitative model predictions, historical price series, 1-week projections,
 * intraday path, and backtest metrics.
 */
export function exportToExcel(
  prediction: PredictionResult,
  symbol: string,
  currency: string
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);

  // 1. SHEET 1: Summary & Quantitative Model Metrics
  const summaryData: (string | number)[][] = [
    ["QUANTITATIVE STOCK PREDICTION MODEL REPORT"],
    ["Generated At", new Date().toLocaleString()],
    ["Stock Symbol", prediction.symbol || symbol],
    ["Currency", currency],
    ["Current / Latest Close Price", `${currency} ${prediction.currentPrice}`],
    ["Next Session Quantitative Target Close", `${currency} ${prediction.nextClose}`],
    ["Sentiment-Adjusted Forecast Close", `${currency} ${prediction.sentimentAdjustedNextClose}`],
    ["24h Forecasted Price Change %", `${prediction.percentChange >= 0 ? "+" : ""}${prediction.percentChange}%`],
    [],
    ["BACKTEST & ACCURACY METRICS"],
    ["Directional Accuracy", `${prediction.backtestMetrics.directionalAccuracy}%`],
    ["Mean Absolute Error (MAE)", `${currency} ${prediction.backtestMetrics.mae}`],
    ["MAE Percentage of Price", `${prediction.backtestMetrics.maePercent}%`],
    ["Root Mean Square Error (RMSE)", `${currency} ${prediction.backtestMetrics.rmse}`],
    ["Max Recorded Error", `${currency} ${prediction.backtestMetrics.maxError}`],
    ["Backtest Historical Sample Count", prediction.backtestMetrics.sampleCount],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs["!cols"] = [{ wch: 38 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Model Summary");

  // 2. SHEET 2: 1-Week Forward Projection Pathway
  if (prediction.weeklyProjection) {
    const proj = prediction.weeklyProjection;
    const weeklyData: (string | number)[][] = [
      ["1-WEEK FORWARD PROJECTION SUMMARY"],
      ["Stock Symbol", proj.symbol],
      ["Base Price", `${currency} ${proj.startPrice}`],
      ["End-of-Week Target Close", `${currency} ${proj.endOfWeekTarget}`],
      ["Weekly Projected Change", `${proj.weeklyChangePct >= 0 ? "+" : ""}${proj.weeklyChangePct}%`],
      ["Weekly Expected Range", `${currency} ${proj.weeklyLow} - ${currency} ${proj.weeklyHigh}`],
      ["Overall Model Bias", proj.overallBias],
      ["1-Week Projection Confidence", `${proj.weeklyConfidence}%`],
      [],
      ["Day #", "Date", "Day Name", "Forecast Close", "Expected Low", "Expected High", "Daily Change %", "Cumulative Change %", "Signal", "Confidence %"],
    ];

    proj.dailyProjections.forEach((d) => {
      weeklyData.push([
        `Day ${d.dayNumber}`,
        d.date,
        d.dayName,
        d.predictedClose,
        d.expectedLow,
        d.expectedHigh,
        `${d.dailyChangePct >= 0 ? "+" : ""}${d.dailyChangePct}%`,
        `${d.cumulativeChangePct >= 0 ? "+" : ""}${d.cumulativeChangePct}%`,
        d.trendSignal,
        `${d.confidenceScore}%`,
      ]);
    });

    const weeklyWs = XLSX.utils.aoa_to_sheet(weeklyData);
    weeklyWs["!cols"] = [
      { wch: 10 },
      { wch: 14 },
      { wch: 10 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, weeklyWs, "1-Week Projections");
  }

  // 3. SHEET 3: Intraday Session Hourly Pathway
  if (prediction.intradayPrediction) {
    const intra = prediction.intradayPrediction;
    const intraData: (string | number)[][] = [
      ["INTRADAY TRADING ENGINE PATHWAY"],
      ["Signal", intra.signal],
      ["Confidence Score", `${intra.confidenceScore}%`],
      ["Optimal Buy Range", `${currency} ${intra.buyRangeLow} - ${currency} ${intra.buyRangeHigh}`],
      ["Buy Target Optimal", `${currency} ${intra.buyOptimal}`],
      ["Sell Target 1 (Conservative)", `${currency} ${intra.sellTarget1}`],
      ["Sell Target 2 (Moderate)", `${currency} ${intra.sellTarget2}`],
      ["Sell Target 3 (Extended)", `${currency} ${intra.sellTarget3}`],
      ["Stop Loss Level", `${currency} ${intra.stopLoss}`],
      ["Pivot Point", `${currency} ${intra.pivotPoint}`],
      ["Risk / Reward Ratio", intra.riskRewardRatio],
      [],
      ["Hour Time Point", "Expected Price", "Expected VWAP", "Low Band", "High Band"],
    ];

    intra.intradayHourlyCurve.forEach((h) => {
      intraData.push([
        h.time,
        h.predictedPrice,
        h.vwap,
        h.lowBand,
        h.highBand,
      ]);
    });

    const intraWs = XLSX.utils.aoa_to_sheet(intraData);
    intraWs["!cols"] = [{ wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, intraWs, "Intraday Pathway");
  }

  // 4. SHEET 4: Historical Bar Data & Forecast Series
  if (prediction.chartData && prediction.chartData.length > 0) {
    const chartRows: (string | number)[][] = [
      ["Date", "Type", "Actual Close", "Moving Avg (MA)", "Regression (REG)", "Backtest Pred", "Forecast Price", "Lower Band", "Upper Band"],
    ];

    prediction.chartData.forEach((pt) => {
      chartRows.push([
        pt.date,
        pt.isForecast ? "FORECAST" : "HISTORICAL",
        pt.actualClose !== undefined ? pt.actualClose : "",
        pt.ma !== undefined ? pt.ma : "",
        pt.reg !== undefined ? pt.reg : "",
        pt.backtestPred !== undefined ? pt.backtestPred : "",
        pt.forecastPrice !== undefined ? pt.forecastPrice : "",
        pt.lowBand !== undefined ? pt.lowBand : "",
        pt.highBand !== undefined ? pt.highBand : "",
      ]);
    });

    const chartWs = XLSX.utils.aoa_to_sheet(chartRows);
    chartWs["!cols"] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, chartWs, "Historical & Forecast Data");
  }

  // Write and trigger download file
  const fileName = `${prediction.symbol || symbol}_Quant_Prediction_Report_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
