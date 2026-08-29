import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  RotateCcw,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  BarChart3,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  KitePortfolioHolding,
  KitePortfolioPosition,
  KitePortfolioOverview,
} from '../types';

interface PortfolioManualEditorProps {
  portfolio: KitePortfolioOverview;
  onRefreshPortfolio: (msg?: string) => Promise<void>;
  onSelectStock: (symbol: string) => void;
  currentActiveStock?: string;
  formatCurrency: (val: number, includeDecimals?: boolean) => string;
}

export const PortfolioManualEditor: React.FC<PortfolioManualEditorProps> = ({
  portfolio,
  onRefreshPortfolio,
  onSelectStock,
  currentActiveStock,
  formatCurrency,
}) => {
  // Active subview in manual manager
  const [subView, setSubView] = useState<'holdings' | 'positions' | 'bulk_ltp' | 'import_export'>('holdings');

  // Modals state
  const [editingHolding, setEditingHolding] = useState<Partial<KitePortfolioHolding> | null>(null);
  const [isHoldingModalOpen, setIsHoldingModalOpen] = useState(false);
  const [isNewHolding, setIsNewHolding] = useState(false);

  const [editingPosition, setEditingPosition] = useState<Partial<KitePortfolioPosition> | null>(null);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [isNewPosition, setIsNewPosition] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'holding' | 'position';
    id: string;
    symbol: string;
  } | null>(null);

  // Bulk LTP state: map of holding id -> { ltp, dayChangePct }
  const [bulkLtpDrafts, setBulkLtpDrafts] = useState<Record<string, { ltp: number; dayChangePct: number }>>({});
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [csvParseError, setCsvParseError] = useState<string | null>(null);
  const [csvParsedHoldings, setCsvParsedHoldings] = useState<Partial<KitePortfolioHolding>[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // --- HOLDINGS CRUD ---
  const handleOpenAddHolding = () => {
    setIsNewHolding(true);
    setEditingHolding({
      symbol: '',
      name: '',
      companyName: '',
      exchange: 'NSE',
      quantity: 100,
      t1Quantity: 0,
      averagePrice: 100.0,
      ltp: 100.0,
      dayChange: 0,
      dayChangePct: 0,
      assetClass: 'Equities',
      aiSignal: 'HOLD',
      keySupport: 95.0,
      keyTarget: 110.0,
    });
    setIsHoldingModalOpen(true);
  };

  const handleOpenEditHolding = (h: KitePortfolioHolding) => {
    setIsNewHolding(false);
    setEditingHolding({ ...h });
    setIsHoldingModalOpen(true);
  };

  const handleSaveHolding = async () => {
    if (!editingHolding || !editingHolding.symbol?.trim()) {
      showStatus('Stock symbol is required.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/portfolio/holding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingHolding),
      });

      if (res.ok) {
        const data = await res.json();
        setIsHoldingModalOpen(false);
        setEditingHolding(null);
        showStatus(data.message || `Holding ${editingHolding.symbol} saved successfully!`);
        await onRefreshPortfolio();
      } else {
        const err = await res.json();
        showStatus(err.error || 'Failed to save holding.', 'error');
      }
    } catch (err) {
      console.warn("Notice: Holding save request issue:", err);
      showStatus('Network error while saving holding.', 'error');
    }
  };

  const handleDeleteHolding = async (id: string, symbol: string) => {
    try {
      const res = await fetch('/api/portfolio/holding/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, symbol }),
      });

      if (res.ok) {
        setConfirmDelete(null);
        showStatus(`Holding ${symbol} removed from portfolio.`);
        await onRefreshPortfolio();
      } else {
        showStatus('Failed to delete holding.', 'error');
      }
    } catch (err) {
      console.warn("Notice: Holding delete request issue:", err);
      showStatus('Network error while deleting holding.', 'error');
    }
  };

  // Quick adjust holding quantity or LTP
  const handleQuickAdjustHolding = async (
    h: KitePortfolioHolding,
    qtyDelta: number = 0,
    priceDelta: number = 0
  ) => {
    const updated: Partial<KitePortfolioHolding> = {
      ...h,
      quantity: Math.max(0, (h.quantity || 0) + qtyDelta),
      ltp: Math.max(0.01, Math.round(((h.ltp || h.averagePrice) + priceDelta) * 100) / 100),
      dayChange: Math.round(((h.dayChange || 0) + priceDelta) * 100) / 100,
    };

    try {
      const res = await fetch('/api/portfolio/holding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        await onRefreshPortfolio();
      }
    } catch (err) {
      console.warn("Notice: Quick adjust holding issue:", err);
    }
  };

  // --- POSITIONS CRUD ---
  const handleOpenAddPosition = () => {
    setIsNewPosition(true);
    setEditingPosition({
      symbol: '',
      name: '',
      exchange: 'NSE',
      quantity: 100,
      product: 'CNC',
      positionType: 'HOLDING',
      averagePrice: 150.0,
      ltp: 150.0,
      pnl: 0,
      pnlPct: 0,
      dayChangePct: 0,
    });
    setIsPositionModalOpen(true);
  };

  const handleOpenEditPosition = (p: KitePortfolioPosition) => {
    setIsNewPosition(false);
    setEditingPosition({ ...p });
    setIsPositionModalOpen(true);
  };

  const handleSavePosition = async () => {
    if (!editingPosition || !editingPosition.symbol?.trim()) {
      showStatus('Position symbol is required.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/portfolio/position/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPosition),
      });

      if (res.ok) {
        const data = await res.json();
        setIsPositionModalOpen(false);
        setEditingPosition(null);
        showStatus(data.message || `Position ${editingPosition.symbol} saved successfully!`);
        await onRefreshPortfolio();
      } else {
        const err = await res.json();
        showStatus(err.error || 'Failed to save position.', 'error');
      }
    } catch (err) {
      console.warn("Notice: Position save request issue:", err);
      showStatus('Network error while saving position.', 'error');
    }
  };

  const handleDeletePosition = async (id: string, symbol: string) => {
    try {
      const res = await fetch('/api/portfolio/position/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setConfirmDelete(null);
        showStatus(`Position ${symbol} removed.`);
        await onRefreshPortfolio();
      } else {
        showStatus('Failed to delete position.', 'error');
      }
    } catch (err) {
      console.warn("Notice: Position delete request issue:", err);
      showStatus('Network error while deleting position.', 'error');
    }
  };

  // --- BULK LTP RAPID UPDATER ---
  const initBulkLtpDrafts = () => {
    const drafts: Record<string, { ltp: number; dayChangePct: number }> = {};
    portfolio.holdings.forEach((h) => {
      drafts[h.id] = {
        ltp: h.ltp,
        dayChangePct: h.dayChangePct || 0,
      };
    });
    setBulkLtpDrafts(drafts);
  };

  const handleApplyBulkPreset = (percentDelta: number) => {
    const updated: Record<string, { ltp: number; dayChangePct: number }> = {};
    portfolio.holdings.forEach((h) => {
      const currentDraft = bulkLtpDrafts[h.id] || { ltp: h.ltp, dayChangePct: h.dayChangePct || 0 };
      const newLtp = Math.round(currentDraft.ltp * (1 + percentDelta / 100) * 100) / 100;
      const newDayPct = Math.round((currentDraft.dayChangePct + percentDelta) * 100) / 100;
      updated[h.id] = { ltp: newLtp, dayChangePct: newDayPct };
    });
    setBulkLtpDrafts(updated);
  };

  const handleSaveBulkLtp = async () => {
    setIsSavingBulk(true);
    try {
      const updatedHoldings = portfolio.holdings.map((h) => {
        const draft = bulkLtpDrafts[h.id];
        if (!draft) return h;
        const totalQty = (h.quantity || 0) + (h.t1Quantity || 0);
        const dayChange = (draft.ltp * draft.dayChangePct) / 100;
        return {
          ...h,
          ltp: draft.ltp,
          dayChangePct: draft.dayChangePct,
          dayChange,
        };
      });

      const res = await fetch('/api/portfolio/bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: updatedHoldings }),
      });

      if (res.ok) {
        showStatus('All holding LTP prices and daily returns updated successfully!');
        await onRefreshPortfolio();
      }
    } catch (err) {
      console.warn("Notice: Bulk price save issue:", err);
      showStatus('Failed to apply bulk price updates.', 'error');
    } finally {
      setIsSavingBulk(false);
    }
  };

  // --- CSV IMPORT / EXPORT ---
  const handleParseCsv = (text: string) => {
    setCsvText(text);
    setCsvParseError(null);
    if (!text.trim()) {
      setCsvParsedHoldings([]);
      return;
    }

    try {
      const lines = text.trim().split('\n');
      const parsed: Partial<KitePortfolioHolding>[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#') || (i === 0 && line.toLowerCase().includes('symbol'))) {
          continue;
        }

        const parts = line.split(',').map((p) => p.trim());
        if (parts.length < 3) continue;

        const symbol = parts[0].toUpperCase();
        const quantity = parseFloat(parts[1]) || 0;
        const averagePrice = parseFloat(parts[2]) || 0;
        const ltp = parts[3] ? parseFloat(parts[3]) : averagePrice;
        const exchange = parts[4]?.toUpperCase() === 'BSE' ? 'BSE' : 'NSE';
        const assetClass = (parts[5] as any) || 'Equities';
        const t1Quantity = parts[6] ? parseFloat(parts[6]) : 0;

        parsed.push({
          id: `h_${symbol.toLowerCase()}_${Date.now()}_${i}`,
          symbol,
          name: symbol,
          companyName: `${symbol} Ltd`,
          exchange,
          quantity,
          t1Quantity,
          averagePrice,
          ltp,
          dayChange: 0,
          dayChangePct: 0,
          assetClass,
        });
      }

      if (parsed.length === 0) {
        setCsvParseError('No valid holding rows found. Ensure format is: SYMBOL, QUANTITY, AVG_PRICE, LTP (optional), EXCHANGE (NSE/BSE).');
      } else {
        setCsvParsedHoldings(parsed);
      }
    } catch (err: any) {
      setCsvParseError('Error parsing CSV: ' + err.message);
    }
  };

  const handleApplyCsvImport = async () => {
    if (csvParsedHoldings.length === 0) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/portfolio/bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: csvParsedHoldings }),
      });

      if (res.ok) {
        showStatus(`Imported ${csvParsedHoldings.length} holdings into your live portfolio!`);
        setCsvText('');
        setCsvParsedHoldings([]);
        setSubView('holdings');
        await onRefreshPortfolio();
      } else {
        showStatus('Failed to import CSV portfolio.', 'error');
      }
    } catch (err) {
      console.warn("Notice: CSV import issue:", err);
      showStatus('Network error during CSV import.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = 'SYMBOL,NAME,EXCHANGE,QUANTITY,T1_QUANTITY,AVG_PRICE,LTP,INVESTED_AMOUNT,CURRENT_VALUE,PNL,PNL_PCT,ASSET_CLASS,AI_SIGNAL\n';
    const rows = portfolio.holdings
      .map((h) => {
        const totalQty = (h.quantity || 0) + (h.t1Quantity || 0);
        const curVal = totalQty * h.ltp;
        return `"${h.symbol}","${h.name}","${h.exchange}",${h.quantity},${h.t1Quantity || 0},${h.averagePrice},${h.ltp},${h.investedAmount},${curVal},${h.pnl},${h.pnlPct},"${h.assetClass}","${h.aiSignal || 'HOLD'}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Everyday_Portfolio_Holdings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showStatus('Exported portfolio CSV file.');
  };

  // --- RESET TO BASELINE SEED ---
  const handleResetToSeed = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/portfolio/reset', { method: 'POST' });
      if (res.ok) {
        showStatus('Portfolio reset to original Zerodha Kite baseline successfully.');
        await onRefreshPortfolio();
      }
    } catch (err) {
      console.warn("Notice: Reset to seed issue:", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Sub-Nav and Actions */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Edit3 className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Manual Everyday Portfolio & Holdings Editor
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
                Live Recalculation Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Add new stocks, modify delivered & T1 quantities, calibrate buy prices, update today's live LTPs, and customize AI signals.
            </p>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSubView('holdings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subView === 'holdings'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Holdings Manager ({portfolio.holdings.length})
            </button>

            <button
              onClick={() => setSubView('positions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subView === 'positions'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Positions Manager ({portfolio.positions.length})
            </button>

            <button
              onClick={() => {
                initBulkLtpDrafts();
                setSubView('bulk_ltp');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subView === 'bulk_ltp'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              Rapid LTP Ticker
            </button>

            <button
              onClick={() => setSubView('import_export')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                subView === 'import_export'
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
              CSV / Import
            </button>

            <button
              onClick={handleResetToSeed}
              disabled={isResetting}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 border border-slate-800 text-xs transition-all flex items-center gap-1"
              title="Reset to default Zerodha Kite data"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              Reset
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SUBVIEW 1: HOLDINGS MANAGER */}
      {subView === 'holdings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">
              Showing <span className="text-white font-bold">{portfolio.holdings.length}</span> Active Delivery & ETF Holdings
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                Export CSV
              </button>
              <button
                id="btn-add-new-holding"
                onClick={handleOpenAddHolding}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                Add New Holding
              </button>
            </div>
          </div>

          {/* Holdings Editable Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-sans text-[11px]">
                  <th className="py-3 px-3">Stock / Symbol</th>
                  <th className="py-3 px-3">Delivered / T1</th>
                  <th className="py-3 px-3">Avg Buy Price</th>
                  <th className="py-3 px-3">Live LTP / Return</th>
                  <th className="py-3 px-3">Current NAV</th>
                  <th className="py-3 px-3">Unrealized P&L</th>
                  <th className="py-3 px-3 text-center">AI Signal</th>
                  <th className="py-3 px-3 text-center">Quick Adjust</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolio.holdings.map((h) => {
                  const totalUnits = (h.quantity || 0) + (h.t1Quantity || 0);
                  const currentVal = totalUnits * h.ltp;
                  const isActive = currentActiveStock === h.symbol;

                  return (
                    <tr
                      key={h.id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isActive ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectStock(h.symbol)}
                            className="font-bold text-white hover:text-amber-400 transition-colors text-sm flex items-center gap-1 font-sans"
                          >
                            {h.symbol}
                            <Zap className="w-3 h-3 text-amber-400" />
                          </button>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            {h.exchange}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {h.assetClass}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">{h.name}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-white font-bold">{h.quantity} units</div>
                        {h.t1Quantity && h.t1Quantity > 0 ? (
                          <span className="text-[10px] text-amber-400 block font-sans">
                            +{h.t1Quantity} T1 Unsettled
                          </span>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-3 text-slate-300">
                        ₹{h.averagePrice.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-white font-bold">₹{h.ltp.toFixed(2)}</div>
                        <div className={`text-[10px] ${h.dayChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {h.dayChangePct >= 0 ? '+' : ''}{h.dayChangePct.toFixed(2)}%
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-white font-semibold">{formatCurrency(currentVal, true)}</div>
                        <div className="text-[10px] text-slate-400 font-sans">Cost: {formatCurrency(h.investedAmount, true)}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className={`font-bold ${h.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(h.pnl, true)}
                        </div>
                        <div className={`text-[10px] ${h.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            h.aiSignal === 'ACCUMULATE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : h.aiSignal === 'TAKE PROFIT'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : h.aiSignal === 'PROBE HEDGE'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : h.aiSignal === 'STOP LOSS INVAL'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {h.aiSignal || 'HOLD'}
                        </span>
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleQuickAdjustHolding(h, 10, 0)}
                            className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-800"
                            title="Add 10 Quantity"
                          >
                            +10 Q
                          </button>
                          <button
                            onClick={() => handleQuickAdjustHolding(h, -10, 0)}
                            className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-800"
                            title="Subtract 10 Quantity"
                          >
                            -10 Q
                          </button>
                          <button
                            onClick={() => handleQuickAdjustHolding(h, 0, 1)}
                            className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-emerald-400 border border-slate-800"
                            title="Increase LTP by ₹1"
                          >
                            +₹1
                          </button>
                          <button
                            onClick={() => handleQuickAdjustHolding(h, 0, -1)}
                            className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-rose-400 border border-slate-800"
                            title="Decrease LTP by ₹1"
                          >
                            -₹1
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditHolding(h)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
                            title="Edit Holding Details"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'holding', id: h.id, symbol: h.symbol })}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                            title="Delete Holding"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 2: POSITIONS MANAGER */}
      {subView === 'positions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">
              Showing <span className="text-white font-bold">{portfolio.positions.length}</span> Intraday / Delivery CNC Positions
            </div>
            <button
              onClick={handleOpenAddPosition}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              Add New Position
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-sans text-[11px]">
                  <th className="py-3 px-3">Position Symbol</th>
                  <th className="py-3 px-3">Product / Type</th>
                  <th className="py-3 px-3">Quantity</th>
                  <th className="py-3 px-3">Avg Price</th>
                  <th className="py-3 px-3">LTP</th>
                  <th className="py-3 px-3">Realized/Unrealized P&L</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolio.positions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-sans text-sm">{p.symbol}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {p.exchange}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">{p.name}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                        {p.product} • {p.positionType}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-bold text-white">
                      {p.quantity > 0 ? `+${p.quantity}` : p.quantity}
                    </td>

                    <td className="py-3.5 px-3 text-slate-300">
                      ₹{p.averagePrice.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-white">
                      ₹{p.ltp.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className={`font-bold ${p.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(p.pnl, true)}
                      </div>
                      {p.pnlPct !== undefined && (
                        <div className={`text-[10px] ${p.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditPosition(p)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
                          title="Edit Position"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: 'position', id: p.id, symbol: p.symbol })}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                          title="Delete Position"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 3: RAPID BULK LTP TICKER */}
      {subView === 'bulk_ltp' && (
        <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                Rapid Everyday LTP & Return Updater
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Quickly type in today's closing or live market prices across all holdings for instant portfolio re-calculation.
              </p>
            </div>

            {/* Market Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Quick Presets:</span>
              <button
                onClick={() => handleApplyBulkPreset(1.0)}
                className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold"
              >
                +1% Rally
              </button>
              <button
                onClick={() => handleApplyBulkPreset(-1.0)}
                className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold"
              >
                -1% Dip
              </button>
              <button
                onClick={() => handleApplyBulkPreset(3.5)}
                className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold"
              >
                +3.5% Surge
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans text-[11px]">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Total Qty</th>
                  <th className="py-2.5 px-3">Cost Avg</th>
                  <th className="py-2.5 px-3">New LTP (₹)</th>
                  <th className="py-2.5 px-3">Today Change %</th>
                  <th className="py-2.5 px-3">Projected P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {portfolio.holdings.map((h) => {
                  const draft = bulkLtpDrafts[h.id] || { ltp: h.ltp, dayChangePct: h.dayChangePct || 0 };
                  const totalUnits = (h.quantity || 0) + (h.t1Quantity || 0);
                  const projectedVal = totalUnits * draft.ltp;
                  const projectedPnl = projectedVal - h.investedAmount;
                  const projectedPnlPct = h.investedAmount > 0 ? (projectedPnl / h.investedAmount) * 100 : 0;

                  return (
                    <tr key={h.id}>
                      <td className="py-3 px-3 font-bold text-white font-sans text-sm">
                        {h.symbol}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {totalUnits}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        ₹{h.averagePrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="relative w-32">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-sans">₹</span>
                          <input
                            type="number"
                            step="0.05"
                            value={draft.ltp}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setBulkLtpDrafts((prev) => ({
                                ...prev,
                                [h.id]: { ...draft, ltp: val },
                              }));
                            }}
                            className="w-full pl-6 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="relative w-28">
                          <input
                            type="number"
                            step="0.1"
                            value={draft.dayChangePct}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setBulkLtpDrafts((prev) => ({
                                ...prev,
                                [h.id]: { ...draft, dayChangePct: val },
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:border-amber-500"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className={`font-bold ${projectedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(projectedPnl, true)}
                        </div>
                        <div className={`text-[10px] ${projectedPnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {projectedPnlPct >= 0 ? '+' : ''}{projectedPnlPct.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => initBulkLtpDrafts()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold transition-all"
            >
              Reset Drafts
            </button>
            <button
              onClick={handleSaveBulkLtp}
              disabled={isSavingBulk}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              {isSavingBulk ? 'Applying Prices...' : 'Save & Recalculate Portfolio'}
            </button>
          </div>
        </div>
      )}

      {/* SUBVIEW 4: CSV / TEXT IMPORT & EXPORT */}
      {subView === 'import_export' && (
        <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-purple-400" />
              Import or Bulk Paste Holdings
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste CSV or plain text with your stock symbols, quantities, and buy prices to instantly build or update your portfolio.
            </p>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
            <span className="text-amber-400 font-sans font-semibold block mb-1">Standard Format:</span>
            <code>SYMBOL, QUANTITY, AVG_PRICE, LTP, EXCHANGE, ASSET_CLASS, T1_QTY</code>
            <div className="text-[11px] text-slate-500 mt-1 font-sans">
              Example: <code>TATAMOTORS, 200, 940.50, 965.20, NSE, Equities, 0</code>
            </div>
          </div>

          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => handleParseCsv(e.target.value)}
            placeholder="Paste your stock lines here..."
            className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />

          {csvParseError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{csvParseError}</span>
            </div>
          )}

          {csvParsedHoldings.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Parsed {csvParsedHoldings.length} Valid Holdings Ready for Import:
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/50 p-2 text-xs font-mono">
                {csvParsedHoldings.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 px-2 border-b border-slate-800/40 text-slate-300">
                    <span className="font-bold text-white">{p.symbol} ({p.exchange})</span>
                    <span>Qty: {p.quantity}</span>
                    <span>Avg: ₹{p.averagePrice}</span>
                    <span>LTP: ₹{p.ltp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Current CSV
            </button>
            <button
              onClick={handleApplyCsvImport}
              disabled={csvParsedHoldings.length === 0 || isImporting}
              className={`px-5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                csvParsedHoldings.length > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              {isImporting ? 'Importing...' : `Import ${csvParsedHoldings.length} Holdings`}
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT HOLDING MODAL --- */}
      <AnimatePresence>
        {isHoldingModalOpen && editingHolding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    {isNewHolding ? 'Add New Portfolio Holding' : `Edit Holding: ${editingHolding.symbol}`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure stock quantities, buy cost, live LTP, and AI trade protection levels.
                  </p>
                </div>
                <button
                  onClick={() => setIsHoldingModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Symbol & Exchange */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1 font-semibold">Stock Symbol / Ticker *</label>
                    <input
                      type="text"
                      value={editingHolding.symbol || ''}
                      onChange={(e) =>
                        setEditingHolding({ ...editingHolding, symbol: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. TATAMOTORS, INFY, SILVERCASE"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Exchange</label>
                    <select
                      value={editingHolding.exchange || 'NSE'}
                      onChange={(e) =>
                        setEditingHolding({ ...editingHolding, exchange: e.target.value as 'NSE' | 'BSE' })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    >
                      <option value="NSE">NSE</option>
                      <option value="BSE">BSE</option>
                    </select>
                  </div>
                </div>

                {/* Company Name & Asset Class */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Company / Asset Name</label>
                    <input
                      type="text"
                      value={editingHolding.name || ''}
                      onChange={(e) =>
                        setEditingHolding({ ...editingHolding, name: e.target.value })
                      }
                      placeholder="e.g. Tata Motors Ltd"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Asset Class</label>
                    <select
                      value={editingHolding.assetClass || 'Equities'}
                      onChange={(e) =>
                        setEditingHolding({
                          ...editingHolding,
                          assetClass: e.target.value as 'Equities' | 'Pre-IPO' | 'Commodity & Silver ETFs',
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Equities">Equities</option>
                      <option value="Commodity & Silver ETFs">Commodity & Silver ETFs</option>
                      <option value="Pre-IPO">Pre-IPO / Unlisted</option>
                    </select>
                  </div>
                </div>

                {/* Quantities & Prices */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Delivered Qty</label>
                    <input
                      type="number"
                      value={editingHolding.quantity ?? 0}
                      onChange={(e) =>
                        setEditingHolding({ ...editingHolding, quantity: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">T1 Qty (Unsettled)</label>
                    <input
                      type="number"
                      value={editingHolding.t1Quantity ?? 0}
                      onChange={(e) =>
                        setEditingHolding({ ...editingHolding, t1Quantity: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Avg Buy Price (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editingHolding.averagePrice ?? 0}
                      onChange={(e) =>
                        setEditingHolding({ ...editingHolding, averagePrice: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Current LTP (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editingHolding.ltp ?? 0}
                      onChange={(e) =>
                        setEditingHolding({ ...editingHolding, ltp: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* AI Signal & Levels */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">AI Signal</label>
                    <select
                      value={editingHolding.aiSignal || 'HOLD'}
                      onChange={(e) =>
                        setEditingHolding({ ...editingHolding, aiSignal: e.target.value as any })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="ACCUMULATE">ACCUMULATE</option>
                      <option value="HOLD">HOLD</option>
                      <option value="PROBE HEDGE">PROBE HEDGE</option>
                      <option value="TAKE PROFIT">TAKE PROFIT</option>
                      <option value="STOP LOSS INVAL">STOP LOSS INVAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Key Support Floor (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editingHolding.keySupport ?? 0}
                      onChange={(e) =>
                        setEditingHolding({ ...editingHolding, keySupport: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Target Price (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editingHolding.keyTarget ?? 0}
                      onChange={(e) =>
                        setEditingHolding({ ...editingHolding, keyTarget: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Live Computed Preview Card */}
                {(() => {
                  const qty = (editingHolding.quantity || 0) + (editingHolding.t1Quantity || 0);
                  const avg = editingHolding.averagePrice || 0;
                  const ltp = editingHolding.ltp || avg;
                  const inv = qty * avg;
                  const cur = qty * ltp;
                  const pnl = cur - inv;
                  const pnlPct = inv > 0 ? (pnl / inv) * 100 : 0;

                  return (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Total Units</span>
                        <span className="text-sm font-bold text-white">{qty}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Total Invested</span>
                        <span className="text-sm font-bold text-slate-300">{formatCurrency(inv, true)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Current NAV</span>
                        <span className="text-sm font-bold text-white">{formatCurrency(cur, true)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Unrealized P&L</span>
                        <span className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(pnl, true)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="p-5 border-t border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setIsHoldingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHolding}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Save className="w-4 h-4" />
                  Save Holding
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: ADD / EDIT POSITION MODAL --- */}
      <AnimatePresence>
        {isPositionModalOpen && editingPosition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  {isNewPosition ? 'Add New Position' : `Edit Position: ${editingPosition.symbol}`}
                </h3>
                <button
                  onClick={() => setIsPositionModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Symbol *</label>
                    <input
                      type="text"
                      value={editingPosition.symbol || ''}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, symbol: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Exchange</label>
                    <select
                      value={editingPosition.exchange || 'NSE'}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, exchange: e.target.value as 'NSE' | 'BSE' })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    >
                      <option value="NSE">NSE</option>
                      <option value="BSE">BSE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Product</label>
                    <select
                      value={editingPosition.product || 'CNC'}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, product: e.target.value as any })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    >
                      <option value="CNC">CNC (Cash & Carry)</option>
                      <option value="MIS">MIS (Intraday)</option>
                      <option value="NRML">NRML (Derivatives)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Position Type</label>
                    <select
                      value={editingPosition.positionType || 'HOLDING'}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, positionType: e.target.value as any })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    >
                      <option value="HOLDING">HOLDING</option>
                      <option value="SOLD HOLDING">SOLD HOLDING</option>
                      <option value="INTRADAY">INTRADAY</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Quantity</label>
                    <input
                      type="number"
                      value={editingPosition.quantity ?? 0}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, quantity: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Avg Price (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editingPosition.averagePrice ?? 0}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, averagePrice: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">LTP (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editingPosition.ltp ?? 0}
                      onChange={(e) =>
                        setEditingPosition({ ...editingPosition, ltp: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setIsPositionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePosition}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Save className="w-4 h-4" />
                  Save Position
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM DELETE DIALOG --- */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-400 mb-3">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">Confirm Removal</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Are you sure you want to remove <span className="font-bold text-white">{confirmDelete.symbol}</span> from your {confirmDelete.type === 'holding' ? 'holdings portfolio' : 'positions book'}?
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete.type === 'holding') {
                      handleDeleteHolding(confirmDelete.id, confirmDelete.symbol);
                    } else {
                      handleDeletePosition(confirmDelete.id, confirmDelete.symbol);
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
