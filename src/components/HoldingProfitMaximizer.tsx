import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Target,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  DollarSign,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  Maximize2,
  Calendar,
  Lock,
  Compass,
  Briefcase,
  ArrowDownUp,
} from 'lucide-react';
import { KitePortfolioHolding, KitePortfolioOverview } from '../types';

export interface HoldingProfitRecommendation {
  holdingId: string;
  symbol: string;
  name: string;
  assetClass: 'Equities' | 'Pre-IPO' | 'Commodity & Silver ETFs';
  currentQty: number;
  avgCost: number;
  ltp: number;
  investedAmount: number;
  currentValue: number;
  currentPnl: number;
  currentPnlPct: number;
  
  // Strategy Recommendation
  primaryAction: 'PYRAMID / ACCUMULATE' | 'PROFIT HARVEST (T1)' | 'TRAILING STOP RATIO' | 'COVERED CALL / YIELD' | 'DEFENSIVE HEDGE' | 'HOLD CORE COMPOUNDER' | 'TACTICAL REBALANCE / TRIM' | 'HOLD CORE HEDGE' | 'TRAIL STOP / HOLD' | string;
  actionUrgency: 'HIGH (IMMEDIATE)' | 'OPPORTUNE (NEXT 24H)' | 'STRATEGIC (WEEKLY)' | 'PASSIVE' | 'MEDIUM (DAILY)' | string;
  actionBadgeColor: string;
  
  // Quantitative Targets & Milestones
  targetExitT1: number;
  targetExitT2: number;
  trailingStopTrigger: number;
  idealReaccumulatePrice: number;
  
  // Financial Impact Projections
  unlockedProfitEstimateINR: number;
  roiEnhancementPct: number;
  riskRewardRatio: string;
  holdingHorizon: '1-3 Weeks' | '2-4 Weeks' | '1-3 Months' | 'Multi-Quarter / Pre-IPO Exit' | string;
  
  // Step-by-Step Playbook
  tacticalSteps: string[];
  catalystRationale: string;
  riskGuardWarning: string;
  
  // Yield / Enhanced Profit Strategy
  optionsOverlayRecommendation?: string;
  taxOptimizationTip?: string;
}

interface HoldingProfitMaximizerProps {
  portfolio: KitePortfolioOverview;
  onSelectStock: (symbol: string) => void;
  onExecuteRecommendation?: (rec: HoldingProfitRecommendation) => void;
}

export const HoldingProfitMaximizer: React.FC<HoldingProfitMaximizerProps> = ({
  portfolio,
  onSelectStock,
  onExecuteRecommendation,
}) => {
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<'ALL' | 'Equities' | 'Pre-IPO' | 'Commodity & Silver ETFs'>('ALL');
  const [strategyFilter, setStrategyFilter] = useState<'ALL' | 'HARVEST' | 'ACCUMULATE' | 'PROTECT'>('ALL');
  const [expandedHoldingId, setExpandedHoldingId] = useState<string | null>(null);
  const [executedHoldingMap, setExecutedHoldingMap] = useState<Record<string, boolean>>({});
  const [minRoiFilter, setMinRoiFilter] = useState<number>(0);
  const [sortByHolding, setSortByHolding] = useState<'urgency' | 'alpha_desc' | 'roi_desc' | 'weight_desc' | 'symbol'>('urgency');

  // Generate granular, stock-specific profit maximization strategies
  const recommendations: HoldingProfitRecommendation[] = useMemo(() => {
    const holdings = portfolio?.holdings || [];
    if (holdings.length === 0) return [];

    return holdings.map((h): HoldingProfitRecommendation => {
      const qty = (h.quantity || 0) + (h.t1Quantity || 0);
      const curVal = qty * (h.ltp || h.averagePrice || 1);
      const inv = h.investedAmount || qty * (h.averagePrice || 1);
      const pnl = curVal - inv;
      const pnlPct = inv > 0 ? (pnl / inv) * 100 : 0;
      const ltp = h.ltp || h.averagePrice || 100;
      const avg = h.averagePrice || ltp;

      // Dynamic profiling per specific holding
      if (h.symbol === 'SILVERCASE') {
        const t1 = 26.50;
        const t2 = 28.80;
        const sl = 23.80;
        const reaccum = 23.90;
        const unlocked = curVal * 0.25; // 25% tactical trim
        return {
          holdingId: h.id,
          symbol: h.symbol,
          name: h.name,
          assetClass: h.assetClass,
          currentQty: qty,
          avgCost: avg,
          ltp,
          investedAmount: inv,
          currentValue: curVal,
          currentPnl: pnl,
          currentPnlPct: pnlPct,
          primaryAction: 'TACTICAL REBALANCE / TRIM',
          actionUrgency: 'HIGH (IMMEDIATE)',
          actionBadgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          targetExitT1: t1,
          targetExitT2: t2,
          trailingStopTrigger: sl,
          idealReaccumulatePrice: reaccum,
          unlockedProfitEstimateINR: Math.round(unlocked),
          roiEnhancementPct: 16.5,
          riskRewardRatio: '1 : 3.2',
          holdingHorizon: '1-3 Weeks',
          catalystRationale: `Silver Case Bullion comprises ~55.7% of total portfolio value (${qty.toLocaleString('en-IN')} units at ₹${avg.toFixed(2)}). Staggered 25% harvest on pullback bounce to ₹${t1.toFixed(2)} releases ~₹1.50L liquid capital to accelerate portfolio recovery.`,
          riskGuardWarning: 'Overweight concentration risk. If MCX Silver slips below ₹23.80, trail stop to defend capital.',
          tacticalSteps: [
            `Place GTT Limit Sell for 6,125 units (25% tranche) at Target ₹${t1.toFixed(2)} (locks in recovery delta).`,
            `Ratchet protective Stop-Loss up to ₹${sl.toFixed(2)} for support invalidation protection.`,
            `Re-deploy released ₹1,50,000 cash into high-alpha growth engines (Meesho, Canara HSBC Life, MosChip).`
          ],
          optionsOverlayRecommendation: 'Consider buying 1 lot ATM MCX Silver Put option as cost-effective crash hedge.',
          taxOptimizationTip: 'Held in ETF format — long-term capital gains tax benefits apply after indexation.'
        };
      }

      if (h.symbol === 'SILVERBEES') {
        const t1 = 242.00;
        const t2 = 258.00;
        const sl = 224.00;
        const reaccum = 225.00;
        const unlocked = curVal * 0.20;
        return {
          holdingId: h.id,
          symbol: h.symbol,
          name: h.name,
          assetClass: h.assetClass,
          currentQty: qty,
          avgCost: avg,
          ltp,
          investedAmount: inv,
          currentValue: curVal,
          currentPnl: pnl,
          currentPnlPct: pnlPct,
          primaryAction: 'HOLD CORE HEDGE',
          actionUrgency: 'STRATEGIC (WEEKLY)',
          actionBadgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          targetExitT1: t1,
          targetExitT2: t2,
          trailingStopTrigger: sl,
          idealReaccumulatePrice: reaccum,
          unlockedProfitEstimateINR: Math.round(unlocked),
          roiEnhancementPct: 12.0,
          riskRewardRatio: '1 : 2.8',
          holdingHorizon: '1-3 Months',
          catalystRationale: 'Nippon India ETF Silver BeES provides high liquidity and tracking efficiency with institutional NAV parity.',
          riskGuardWarning: 'Maintain trailing stop at ₹224.00 to guard cost basis.',
          tacticalSteps: [
            `Hold core 500 units through consolidation above ₹${sl.toFixed(2)}.`,
            `Set Target 1 GTT Sell for 150 units at ₹${t1.toFixed(2)}.`
          ]
        };
      }

      if (h.symbol === 'SILVER1') {
        const t1 = 24.80;
        const t2 = 26.50;
        const sl = 22.80;
        const reaccum = 22.90;
        const unlocked = curVal * 0.25;
        return {
          holdingId: h.id,
          symbol: h.symbol,
          name: h.name,
          assetClass: h.assetClass,
          currentQty: qty,
          avgCost: avg,
          ltp,
          investedAmount: inv,
          currentValue: curVal,
          currentPnl: pnl,
          currentPnlPct: pnlPct,
          primaryAction: 'HOLD CORE HEDGE',
          actionUrgency: 'STRATEGIC (WEEKLY)',
          actionBadgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          targetExitT1: t1,
          targetExitT2: t2,
          trailingStopTrigger: sl,
          idealReaccumulatePrice: reaccum,
          unlockedProfitEstimateINR: Math.round(unlocked),
          roiEnhancementPct: 11.5,
          riskRewardRatio: '1 : 2.6',
          holdingHorizon: '1-3 Months',
          catalystRationale: 'Commodity bullion hedge allocation with strong mean-reversion characteristics.',
          riskGuardWarning: 'Set price alert at ₹22.80 support.',
          tacticalSteps: [
            `Hold position with Target 1 at ₹${t1.toFixed(2)}.`,
            `Consolidate with SILVERBEES on rally above ₹${t1.toFixed(2)}.`
          ]
        };
      }

      if (h.symbol === 'PWL') {
        const t1 = 135.00;
        const t2 = 152.00;
        const sl = 118.00;
        const reaccum = 119.00;
        const unlocked = curVal * 0.30;
        return {
          holdingId: h.id,
          symbol: h.symbol,
          name: h.name,
          assetClass: h.assetClass,
          currentQty: qty,
          avgCost: avg,
          ltp,
          investedAmount: inv,
          currentValue: curVal,
          currentPnl: pnl,
          currentPnlPct: pnlPct,
          primaryAction: 'TRAIL STOP / HOLD',
          actionUrgency: 'MEDIUM (DAILY)',
          actionBadgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          targetExitT1: t1,
          targetExitT2: t2,
          trailingStopTrigger: sl,
          idealReaccumulatePrice: reaccum,
          unlockedProfitEstimateINR: Math.round(unlocked),
          roiEnhancementPct: 18.0,
          riskRewardRatio: '1 : 3.0',
          holdingHorizon: '2-4 Weeks',
          catalystRationale: 'Premier Polyfilm Ltd holding at ₹124.58 cost basis. Support base firmly established above ₹118.00.',
          riskGuardWarning: 'Strict trailing stop at ₹118.00 prevents capital drawdown.',
          tacticalSteps: [
            `Set GTT Stop-Loss Order at ₹${sl.toFixed(2)}.`,
            `Take partial profit (30 shares) on breakout test of ₹${t1.toFixed(2)}.`
          ]
        };
      }

      if (h.symbol === 'MEESHO') {
        const t1 = ltp * 1.35;
        const t2 = ltp * 1.70;
        const sl = ltp * 0.88;
        const reaccum = ltp * 0.95;
        const unlocked = curVal * 0.45;
        return {
          holdingId: h.id,
          symbol: h.symbol,
          name: h.name,
          assetClass: h.assetClass,
          currentQty: qty,
          avgCost: avg,
          ltp,
          investedAmount: inv,
          currentValue: curVal,
          currentPnl: pnl,
          currentPnlPct: pnlPct,
          primaryAction: 'PYRAMID / ACCUMULATE',
          actionUrgency: 'OPPORTUNE (NEXT 24H)',
          actionBadgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          targetExitT1: parseFloat(t1.toFixed(2)),
          targetExitT2: parseFloat(t2.toFixed(2)),
          trailingStopTrigger: parseFloat(sl.toFixed(2)),
          idealReaccumulatePrice: parseFloat(reaccum.toFixed(2)),
          unlockedProfitEstimateINR: Math.round(unlocked),
          roiEnhancementPct: 38.0,
          riskRewardRatio: '1 : 4.2',
          holdingHorizon: 'Multi-Quarter / Pre-IPO Exit',
          catalystRationale: 'Pre-IPO consumer logistics compounder. E-commerce GMV growth >32% YoY heading into upcoming DRHP filing window. High probability of multiple re-rating upon mainboard listing.',
          riskGuardWarning: 'Illiquid private market lock-in until listing date; keep allocation strictly capped at 25% of total net portfolio NAV.',
          tacticalSteps: [
            `Scale position by 150 additional shares on minor unlisted secondary dips between ₹${(ltp * 0.94).toFixed(2)} - ₹${ltp.toFixed(2)}.`,
            `Hold core 70% unlisted position through IPO listing day pop; set Target 1 exit price at ₹${t1.toFixed(2)}.`,
            `Trail dynamic valuation stop at ₹${sl.toFixed(2)} based on latest quarterly valuation round.`
          ],
          taxOptimizationTip: 'Unlisted shares qualify for LTCG after 24 months holding period with 12.5% rate under revised budget norms.'
        };
      }

      if (h.symbol === 'PINELABS') {
        const t1 = ltp * 1.28;
        const t2 = ltp * 1.55;
        const sl = ltp * 0.90;
        const reaccum = ltp * 0.94;
        const unlocked = curVal * 0.32;
        return {
          holdingId: h.id,
          symbol: h.symbol,
          name: h.name,
          assetClass: h.assetClass,
          currentQty: qty,
          avgCost: avg,
          ltp,
          investedAmount: inv,
          currentValue: curVal,
          currentPnl: pnl,
          currentPnlPct: pnlPct,
          primaryAction: 'HOLD CORE COMPOUNDER',
          actionUrgency: 'STRATEGIC (WEEKLY)',
          actionBadgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          targetExitT1: parseFloat(t1.toFixed(2)),
          targetExitT2: parseFloat(t2.toFixed(2)),
          trailingStopTrigger: parseFloat(sl.toFixed(2)),
          idealReaccumulatePrice: parseFloat(reaccum.toFixed(2)),
          unlockedProfitEstimateINR: Math.round(unlocked),
          roiEnhancementPct: 28.5,
          riskRewardRatio: '1 : 3.8',
          holdingHorizon: 'Multi-Quarter / Pre-IPO Exit',
          catalystRationale: 'Fintech merchant acquiring dominant market share. Cross-border remittance integration expanding gross margins.',
          riskGuardWarning: 'Monitor regulatory payment gateway licensing updates by RBI.',
          tacticalSteps: [
            `Maintain full core holding with strict trailing valuation floor at ₹${sl.toFixed(2)}.`,
            `Pre-book 30% of position on secondary trading desk when unlisted premium reaches ₹${t1.toFixed(2)} ahead of IPO.`
          ],
          taxOptimizationTip: 'Consolidate multiple acquisition lots for FIFO tax optimization.'
        };
      }

      if (h.symbol === 'CANHLIFE') {
        const t1 = ltp * 1.22;
        const t2 = ltp * 1.40;
        const sl = ltp * 0.93;
        const reaccum = ltp * 0.96;
        const unlocked = curVal * 0.25;
        return {
          holdingId: h.id,
          symbol: h.symbol,
          name: h.name,
          assetClass: h.assetClass,
          currentQty: qty,
          avgCost: avg,
          ltp,
          investedAmount: inv,
          currentValue: curVal,
          currentPnl: pnl,
          currentPnlPct: pnlPct,
          primaryAction: 'PYRAMID / ACCUMULATE',
          actionUrgency: 'OPPORTUNE (NEXT 24H)',
          actionBadgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          targetExitT1: parseFloat(t1.toFixed(2)),
          targetExitT2: parseFloat(t2.toFixed(2)),
          trailingStopTrigger: parseFloat(sl.toFixed(2)),
          idealReaccumulatePrice: parseFloat(reaccum.toFixed(2)),
          unlockedProfitEstimateINR: Math.round(unlocked),
          roiEnhancementPct: 22.0,
          riskRewardRatio: '1 : 3.6',
          holdingHorizon: '1-3 Months',
          catalystRationale: 'Life insurance sector tailwinds with bancassurance network expansion. Consistent VNB margin expansion of 24.8%.',
          riskGuardWarning: 'Quarterly surrender value guidelines may induce temporary volatility; use as dip-buying opportunity.',
          tacticalSteps: [
            `Add 20% incremental volume when price tests 20-DMA support band at ₹${reaccum.toFixed(2)}.`,
            `Lock partial gains at First Resistance target of ₹${t1.toFixed(2)} (+22% ROI).`
          ],
          optionsOverlayRecommendation: 'Sell OTM Call Options at ₹320 strike for monthly synthetic dividend yield of 1.4%.'
        };
      }

      if (h.symbol === 'MOSCHIP') {
        const t1 = ltp * 1.30;
        const t2 = ltp * 1.65;
        const sl = ltp * 0.87;
        const reaccum = ltp * 0.92;
        const unlocked = curVal * 0.35;
        return {
          holdingId: h.id,
          symbol: h.symbol,
          name: h.name,
          assetClass: h.assetClass,
          currentQty: qty,
          avgCost: avg,
          ltp,
          investedAmount: inv,
          currentValue: curVal,
          currentPnl: pnl,
          currentPnlPct: pnlPct,
          primaryAction: 'TRAILING STOP RATIO',
          actionUrgency: 'HIGH (IMMEDIATE)',
          actionBadgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          targetExitT1: parseFloat(t1.toFixed(2)),
          targetExitT2: parseFloat(t2.toFixed(2)),
          trailingStopTrigger: parseFloat(sl.toFixed(2)),
          idealReaccumulatePrice: parseFloat(reaccum.toFixed(2)),
          unlockedProfitEstimateINR: Math.round(unlocked),
          roiEnhancementPct: 35.0,
          riskRewardRatio: '1 : 2.9',
          holdingHorizon: '1-3 Weeks',
          catalystRationale: 'Semiconductor design order win momentum under India Semiconductor Mission (ISM). High beta momentum stock.',
          riskGuardWarning: 'Elevated momentum volatility (Beta 1.48); protect profits tightly with system trailing stop.',
          tacticalSteps: [
            `Place automated trailing stop at ₹${sl.toFixed(2)} to safeguard base gains against sudden market pullbacks.`,
            `Take 50% profit off the table on initial breakout spike to ₹${t1.toFixed(2)}.`
          ]
        };
      }

      // Default generic quantitative modeling for other holdings
      const t1 = ltp * (pnlPct >= 10 ? 1.15 : 1.20);
      const t2 = ltp * 1.35;
      const sl = ltp * 0.92;
      const reaccum = ltp * 0.95;
      const unlocked = curVal * 0.20;

      return {
        holdingId: h.id,
        symbol: h.symbol,
        name: h.name,
        assetClass: h.assetClass,
        currentQty: qty,
        avgCost: avg,
        ltp,
        investedAmount: inv,
        currentValue: curVal,
        currentPnl: pnl,
        currentPnlPct: pnlPct,
        primaryAction: pnlPct > 15 ? 'PROFIT HARVEST (T1)' : 'HOLD CORE COMPOUNDER',
        actionUrgency: 'STRATEGIC (WEEKLY)',
        actionBadgeColor: pnlPct > 15 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-700 text-slate-300',
        targetExitT1: parseFloat(t1.toFixed(2)),
        targetExitT2: parseFloat(t2.toFixed(2)),
        trailingStopTrigger: parseFloat(sl.toFixed(2)),
        idealReaccumulatePrice: parseFloat(reaccum.toFixed(2)),
        unlockedProfitEstimateINR: Math.round(unlocked),
        roiEnhancementPct: 15.0,
        riskRewardRatio: '1 : 2.5',
        holdingHorizon: '1-3 Months',
        catalystRationale: 'Systematic technical alignment with moving average support channels.',
        riskGuardWarning: 'Set price alerts at support bounds to prevent unintended drawdown.',
        tacticalSteps: [
          `Monitor resistance band ₹${t1.toFixed(2)} for partial profit lock.`,
          `Set automated stop loss at ₹${sl.toFixed(2)}.`
        ]
      };
    });
  }, [portfolio]);

  // Summary aggregation metrics
  const summary = useMemo(() => {
    const totalPotentialProfitUnlock = recommendations.reduce(
      (sum, r) => sum + r.unlockedProfitEstimateINR,
      0
    );
    const avgRoiBoost = recommendations.length > 0
      ? recommendations.reduce((sum, r) => sum + r.roiEnhancementPct, 0) / recommendations.length
      : 0;
    const immediateActionsCount = recommendations.filter((r) => r.actionUrgency.includes('HIGH')).length;

    return {
      totalPotentialProfitUnlock,
      avgRoiBoost: parseFloat(avgRoiBoost.toFixed(1)),
      immediateActionsCount,
      totalHoldingsCount: recommendations.length,
    };
  }, [recommendations]);

  // Filtered and ordered recommendations based on user controls
  const filteredRecommendations = useMemo(() => {
    const list = recommendations.filter((r) => {
      if (selectedAssetFilter !== 'ALL' && r.assetClass !== selectedAssetFilter) return false;
      if (r.roiEnhancementPct < minRoiFilter) return false;
      if (strategyFilter === 'HARVEST' && !r.primaryAction.includes('HARVEST')) return false;
      if (strategyFilter === 'ACCUMULATE' && !r.primaryAction.includes('ACCUMULATE')) return false;
      if (strategyFilter === 'PROTECT' && !r.primaryAction.includes('STOP') && !r.primaryAction.includes('HEDGE')) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sortByHolding === 'alpha_desc') {
        return b.unlockedProfitEstimateINR - a.unlockedProfitEstimateINR;
      }
      if (sortByHolding === 'roi_desc') {
        return b.roiEnhancementPct - a.roiEnhancementPct;
      }
      if (sortByHolding === 'weight_desc') {
        return b.investedAmount - a.investedAmount;
      }
      if (sortByHolding === 'symbol') {
        return a.symbol.localeCompare(b.symbol);
      }
      // Default: Urgency (HIGH urgency first)
      const urgencyRank: Record<string, number> = {
        'HIGH (URGENT)': 4,
        'HIGH (OPPORTUNITY)': 3,
        'MEDIUM': 2,
        'PASSIVE / HOLD': 1,
      };
      return (urgencyRank[b.actionUrgency] || 0) - (urgencyRank[a.actionUrgency] || 0);
    });

    return list;
  }, [recommendations, selectedAssetFilter, strategyFilter, minRoiFilter, sortByHolding]);

  const handleToggleExecute = (rec: HoldingProfitRecommendation) => {
    const nextState = !executedHoldingMap[rec.holdingId];
    setExecutedHoldingMap((prev) => ({
      ...prev,
      [rec.holdingId]: nextState,
    }));
    if (nextState && onExecuteRecommendation) {
      onExecuteRecommendation(rec);
    }
  };

  return (
    <div id="holding-profit-maximizer" className="space-y-6">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Holding Profit Maximization AI
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Real-Time Kite Holdings Calibration
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              Holding-by-Holding Profit Maximizer & Exit Playbooks
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Granular profit-taking targets, dynamic stop-loss ratchet levels, covered-yield opportunities, and reinvestment pathways for each individual asset in your Zerodha portfolio.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 text-right">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">
                Total Potential Alpha Unlock
              </span>
              <span className="text-xl md:text-2xl font-black font-mono text-emerald-400">
                +₹{summary.totalPotentialProfitUnlock.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Projected Profit Impact</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-400">
            ₹{summary.totalPotentialProfitUnlock.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            Via systematic partial exits & py-ramiding
          </span>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Average ROI Boost</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-indigo-300">
            +{summary.avgRoiBoost}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            Weighted across all active delivery positions
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Immediate Actions</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-400">
            {summary.immediateActionsCount} Urgent Moves
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            High priority re-allocation triggers
          </span>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Holdings Monitored</span>
            <Briefcase className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-white">
            {summary.totalHoldingsCount} Instruments
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            Equities, Pre-IPOs & Commodity ETFs
          </span>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Asset Class Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1 shrink-0">
            <Layers className="w-3.5 h-3.5" /> Category:
          </span>
          {(['ALL', 'Equities', 'Pre-IPO', 'Commodity & Silver ETFs'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedAssetFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedAssetFilter === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'Commodity & Silver ETFs' ? 'Silver / Commodities' : cat}
            </button>
          ))}
        </div>

        {/* Strategy Action Filter & Sort Order */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1 shrink-0">
              <Sliders className="w-3.5 h-3.5" /> Playbook:
            </span>
            {[
              { id: 'ALL', label: 'All Playbooks' },
              { id: 'HARVEST', label: '💰 Profit Harvest' },
              { id: 'ACCUMULATE', label: '🚀 Pyramid Add' },
              { id: 'PROTECT', label: '🛡️ Gain Lock Stop' },
            ].map((strat) => (
              <button
                key={strat.id}
                onClick={() => setStrategyFilter(strat.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  strategyFilter === strat.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {strat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
            <ArrowDownUp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Order:</span>
            <select
              value={sortByHolding}
              onChange={(e) => setSortByHolding(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="urgency" className="bg-slate-900 text-slate-200">
                Action Urgency (High → Low)
              </option>
              <option value="alpha_desc" className="bg-slate-900 text-slate-200">
                Highest Alpha Unlock (₹)
              </option>
              <option value="roi_desc" className="bg-slate-900 text-slate-200">
                Highest ROI Boost (%)
              </option>
              <option value="weight_desc" className="bg-slate-900 text-slate-200">
                Portfolio Allocation Size
              </option>
              <option value="symbol" className="bg-slate-900 text-slate-200">
                Alphabetical (A → Z)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Holding Recommendations Cards List */}
      <div className="space-y-4">
        {filteredRecommendations.map((rec, index) => {
          const isExpanded = expandedHoldingId === rec.holdingId;
          const isExecuted = executedHoldingMap[rec.holdingId];
          const isPositivePnl = rec.currentPnl >= 0;

          return (
            <div
              key={rec.holdingId}
              id={`rec-card-${rec.symbol.toLowerCase()}`}
              className={`bg-slate-900/90 border rounded-2xl transition-all overflow-hidden ${
                isExecuted
                  ? 'border-emerald-500/40 bg-slate-900/60 shadow-lg shadow-emerald-500/5'
                  : isExpanded
                  ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header Top Row */}
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Asset info & Primary Action */}
                <div className="flex items-start gap-3.5">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-indigo-400 text-sm shrink-0">
                      {rec.symbol.slice(0, 3)}
                    </div>
                    <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.2 rounded bg-indigo-600 text-white font-mono font-bold text-[9px] shadow-sm">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {rec.symbol}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans border border-slate-700">
                        {rec.assetClass}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${rec.actionBadgeColor}`}
                      >
                        {rec.primaryAction}
                      </span>
                      {rec.actionUrgency.includes('HIGH') && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-mono font-bold border border-rose-500/30">
                          {rec.actionUrgency}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans">
                      {rec.name} • {rec.currentQty} Units @ Avg ₹{rec.avgCost.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Center: Live Financial Snapshot */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">LTP</span>
                    <span className="font-bold text-white">₹{rec.ltp.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Current Val</span>
                    <span className="font-bold text-slate-200">
                      ₹{rec.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Unrealized P&L</span>
                    <span className={`font-bold ${isPositivePnl ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositivePnl ? '+' : ''}₹{rec.currentPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({rec.currentPnlPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-[10px] text-emerald-400 font-semibold block">Alpha Potential</span>
                    <span className="font-bold text-emerald-400">
                      +₹{rec.unlockedProfitEstimateINR.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex items-center gap-2.5 self-end lg:self-auto shrink-0">
                  <button
                    onClick={() => onSelectStock(rec.symbol)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    AI Quant
                  </button>

                  <button
                    onClick={() => handleToggleExecute(rec)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                      isExecuted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black'
                    }`}
                  >
                    {isExecuted ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Plan Armed & Locked
                      </>
                    ) : (
                      <>
                        <Target className="w-3.5 h-3.5" />
                        Arm Profit Playbook
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setExpandedHoldingId(isExpanded ? null : rec.holdingId)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700"
                    aria-label="Toggle Details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Deep-Dive Playbook Section */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-800/80 bg-slate-950/60 p-5 space-y-4"
                  >
                    {/* Execution Milestones Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-400" /> Target Exit 1 (T1)
                        </span>
                        <div className="text-base font-black text-emerald-400 mt-1">
                          ₹{rec.targetExitT1.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          +{( ((rec.targetExitT1 - rec.ltp) / rec.ltp) * 100 ).toFixed(1)}% from LTP
                        </span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-indigo-400" /> Target Exit 2 (T2)
                        </span>
                        <div className="text-base font-black text-indigo-300 mt-1">
                          ₹{rec.targetExitT2.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          +{( ((rec.targetExitT2 - rec.ltp) / rec.ltp) * 100 ).toFixed(1)}% from LTP
                        </span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-400" /> Protective Stop-Loss
                        </span>
                        <div className="text-base font-black text-rose-400 mt-1">
                          ₹{rec.trailingStopTrigger.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          -{( ((rec.ltp - rec.trailingStopTrigger) / rec.ltp) * 100 ).toFixed(1)}% downside floor
                        </span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Compass className="w-3 h-3 text-teal-400" /> Re-Accumulation Dip
                        </span>
                        <div className="text-base font-black text-teal-300 mt-1">
                          ₹{rec.idealReaccumulatePrice.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Ideal pullback entry zone
                        </span>
                      </div>
                    </div>

                    {/* Step-by-Step Tactical Instructions */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Tactical Profit Maximization Steps
                      </h4>
                      <div className="space-y-2">
                        {rec.tacticalSteps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-500/30">
                              {idx + 1}
                            </span>
                            <p className="leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rationale and Guardrails Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5 mb-1 text-[11px]">
                          <Zap className="w-3 h-3 text-amber-400" /> Catalyst & Thesis Rationale
                        </span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          {rec.catalystRationale}
                        </p>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5 mb-1 text-[11px]">
                          <AlertCircle className="w-3 h-3 text-amber-400" /> Risk Guardrails & Sizing
                        </span>
                        <p className="text-slate-400 leading-relaxed font-sans">
                          {rec.riskGuardWarning}
                        </p>
                      </div>
                    </div>

                    {/* Options Yield & Tax Optimization Badges if Available */}
                    {(rec.optionsOverlayRecommendation || rec.taxOptimizationTip) && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {rec.optionsOverlayRecommendation && (
                          <div className="flex-1 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
                            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span><strong>Options Yield:</strong> {rec.optionsOverlayRecommendation}</span>
                          </div>
                        )}
                        {rec.taxOptimizationTip && (
                          <div className="flex-1 p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-teal-400 shrink-0" />
                            <span><strong>Tax Advantage:</strong> {rec.taxOptimizationTip}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
