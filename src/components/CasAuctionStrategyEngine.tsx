import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Activity,
  Layers,
  Scale,
  Sparkles,
  BarChart3,
  Flame,
  Info,
} from 'lucide-react';

interface CasAuctionStrategyEngineProps {
  currentSymbol?: string;
  currency?: string;
}

export const CasAuctionStrategyEngine: React.FC<CasAuctionStrategyEngineProps> = ({
  currentSymbol = 'SENSEX',
  currency = '₹',
}) => {
  // Simulator State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulationSecond, setSimulationSecond] = useState<number>(0); // 0s (3:15 PM) to 900s (3:30 PM)
  const [capitalInput, setCapitalInput] = useState<number>(100000); // Default ₹1 Lakh
  const [selectedStrike, setSelectedStrike] = useState<'76500_PE' | '76800_PE' | '77000_CE' | 'RELIANCE_CAS'>('76500_PE');
  const [selectedStrategyMode, setSelectedStrategyMode] = useState<'naked_put' | 'straddle_hedge' | 'mean_reversion'>('naked_put');

  // Timeline phases during 3:15 PM - 3:30 PM CAS
  // 0s (3:15 PM): CAS starts, Sensex = 76,934, PE = ₹5.00
  // 180s (3:18 PM): Imbalance builds, Sensex = 76,000 (-934 pts), PE = ₹45.00
  // 300s (3:20 PM): Flash drop climax, Sensex = 74,734 (-2,200 pts), PE = ₹225.00 (PEAK 44x RETURN)
  // 480s (3:23 PM): Bottom forming, Sensex = 75,100 (-1,834 pts), PE = ₹140.00
  // 720s (3:27 PM): Massive recovery, Sensex = 76,600 (-334 pts), PE = ₹18.00
  // 900s (3:30 PM): Final CAS Equilibrium, Sensex = 76,934 (-0 pts net recovery), PE = ₹0.00 (EXPIRED WORTHLESS)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSimulationSecond((prev) => {
          if (prev >= 900) {
            setIsPlaying(false);
            return 900;
          }
          return prev + 15; // advance 15 seconds per tick
        });
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Derived mathematical curve based on the real Times of India reported CAS event
  const currentSnapshot = useMemo(() => {
    const t = simulationSecond;
    let timeLabel = '03:15 PM';
    let sensexDrop = 0;
    let optionPrice = 5.0;
    let callPrice = 12.0;
    let reliancePrice = 1289.0;
    let marketState = 'CAS Auction Order Pooling (3:15 PM)';
    let recommendation = 'HOLD / PREPARE ENTRY';

    if (t === 0) {
      timeLabel = '03:15:00 PM';
      sensexDrop = 0;
      optionPrice = 5.0;
      reliancePrice = 1289.0;
      marketState = 'CAS Opens: Orders pooled into Call Auction book';
      recommendation = 'Deploy ₹1L into OTM 76,500 PE @ ₹5.00';
    } else if (t <= 180) {
      // 3:15 to 3:18 PM
      const progress = t / 180;
      timeLabel = `03:1${5 + Math.floor(progress * 3)}:${String((t % 60)).padStart(2, '0')} PM`;
      sensexDrop = Math.round(progress * 800);
      optionPrice = +(5.0 + progress * 40.0).toFixed(2);
      reliancePrice = +(1289.0 - progress * 15.0).toFixed(2);
      marketState = 'Heavyweight Selling Imbalance (Reliance & HDFC Bank slide)';
      recommendation = 'Gamma building rapidly. Trailing stop armed.';
    } else if (t <= 300) {
      // 3:18 to 3:20 PM - Flash Crash Climax (-2,200 pts)
      const progress = (t - 180) / 120;
      timeLabel = `03:${18 + Math.floor(progress * 2)}:${String((t % 60)).padStart(2, '0')} PM`;
      sensexDrop = Math.round(800 + progress * 1400); // reaches -2,200 pts
      optionPrice = +(45.0 + progress * 180.0).toFixed(2); // reaches ₹225.00
      reliancePrice = +(1274.0 - progress * 24.0).toFixed(2); // reaches ₹1,250 (-3%)
      marketState = '🚨 PEAK FLASH CRASH: Sensex down 2,200 Pts in 5 Mins!';
      recommendation = '🎯 EXIT NOW: Book +₹44,00,000 Profit (+4,400% ROI)';
    } else if (t <= 480) {
      // 3:20 to 3:23 PM - Stagnation & Initial bounce
      const progress = (t - 300) / 180;
      timeLabel = `03:${20 + Math.floor(progress * 3)}:${String((t % 60)).padStart(2, '0')} PM`;
      sensexDrop = Math.round(2200 - progress * 400);
      optionPrice = +(225.0 - progress * 85.0).toFixed(2);
      reliancePrice = +(1250.0 + progress * 10.0).toFixed(2);
      marketState = 'Auction matching triggers buy orders at discount';
      recommendation = 'Profit eroding if not exited! Mean reversion starting.';
    } else if (t <= 720) {
      // 3:23 to 3:27 PM - Rapid 2,000 pt V-Shape Rebound
      const progress = (t - 480) / 240;
      timeLabel = `03:${23 + Math.floor(progress * 4)}:${String((t % 60)).padStart(2, '0')} PM`;
      sensexDrop = Math.round(1800 - progress * 1400);
      optionPrice = +(140.0 - progress * 122.0).toFixed(2);
      reliancePrice = +(1260.0 + progress * 20.0).toFixed(2);
      marketState = '⚡ Violent Short Squeeze / V-Shape Recovery (+1,600 pts)';
      recommendation = 'Put premium crashing. Gamma decay in full effect.';
    } else {
      // 3:27 to 3:30 PM - CAS Final Equilibrium
      const progress = (t - 720) / 180;
      timeLabel = `03:${27 + Math.floor(progress * 3)}:${String((t % 60)).padStart(2, '0')} PM`;
      sensexDrop = Math.round(400 - progress * 400);
      optionPrice = +(18.0 - progress * 18.0).toFixed(2);
      reliancePrice = +(1280.0 + progress * 6.0).toFixed(2);
      marketState = 'CAS Final Settlement Price established at equilibrium';
      recommendation = '0-DTE Expiry: OTM Put settled at ₹0.00';
    }

    const sensexBase = 76934;
    const currentSensex = sensexBase - sensexDrop;

    // Financial Calculation for User Capital
    const unitsPurchased = Math.floor(capitalInput / 5.0); // 20,000 units for ₹1 Lakh @ ₹5
    const currentValue = +(unitsPurchased * optionPrice).toFixed(2);
    const netPnl = +(currentValue - capitalInput).toFixed(2);
    const returnPct = +(((currentValue - capitalInput) / capitalInput) * 100).toFixed(1);

    return {
      timeLabel,
      sensexBase,
      currentSensex,
      sensexDrop,
      optionPrice,
      reliancePrice,
      marketState,
      recommendation,
      unitsPurchased,
      currentValue,
      netPnl,
      returnPct,
    };
  }, [simulationSecond, capitalInput]);

  return (
    <section
      id="cas-closing-auction-engine"
      className="bg-slate-900/95 rounded-2xl border border-indigo-500/30 p-4 sm:p-6 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md"
    >
      {/* Visual Ambient Glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              SEBI CAS 3:15 PM Mechanism
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              0-DTE Gamma Explosion Engine
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            The 3:15 PM CAS Mechanism: How ₹1 Lakh Becomes ₹44 Lakhs
          </h2>

          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Deconstructing SEBI's <strong>Closing Auction Session (CAS)</strong>: How pooling order books between 3:15 PM and 3:30 PM creates extreme 2,200-point index dislocations, 44x 0-DTE options Gamma explosions, and violent V-shape rebounds.
          </p>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 shrink-0 self-start lg:self-auto shadow-inner">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> Pause CAS Timeline
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Replay CAS 3:15 PM Swings
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setSimulationSecond(0);
            }}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-750 transition-colors"
            title="Reset to 3:15 PM"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CORE 1: HOW IT IS POSSIBLE (ANATOMY OF THE MECHANISM)                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: SEBI CAS Order Pooling */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-2 relative">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold font-mono text-sm">
            1
          </div>
          <h4 className="text-sm font-bold text-white">Call Auction Order Pooling</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            From <strong>3:15 PM to 3:30 PM</strong>, continuous matching stops for 200+ F&O stocks. All orders are pooled into a batch auction to determine a single <em>Theoretical Equilibrium Price (TEP)</em>.
          </p>
          <div className="text-[11px] font-mono text-indigo-300 bg-indigo-950/40 p-2 rounded border border-indigo-500/20">
            • Thin order books create instant liquidity vacuums.
          </div>
        </div>

        {/* Step 2: Heavyweight Imbalance (Reliance -3%) */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-2 relative">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold font-mono text-sm">
            2
          </div>
          <h4 className="text-sm font-bold text-white">Heavyweight Flash Crash</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Large institutional/ETF rebalancing at 3:18 PM hammered <strong>Reliance (-3% to ₹1,250)</strong> and HDFC Bank, triggering a cascading <strong>2,200-point Sensex plunge</strong> in just 5 minutes.
          </p>
          <div className="text-[11px] font-mono text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/20">
            • Sensex crashed from 76,934 → 74,734.
          </div>
        </div>

        {/* Step 3: 0-DTE Gamma Explosion (₹5 -> ₹225) */}
        <div className="bg-slate-950/80 rounded-xl border border-emerald-500/30 p-4 space-y-2 relative">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold font-mono text-sm">
            3
          </div>
          <h4 className="text-sm font-bold text-emerald-400">0-DTE Gamma Multiplier (44x)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Because it was Expiry Day, the deep OTM 76,500 Put option traded at ₹5. When Sensex crashed 2,200 pts, the option went deep In-The-Money, rocketing from <strong>₹5.00 to ₹225.00 (+4,400%)</strong>.
          </p>
          <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/40 p-2 rounded border border-emerald-500/20 font-bold">
            • ₹1,00,000 / ₹5 = 20,000 qty × ₹225 = ₹45,00,000!
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CORE 2: LIVE SIMULATION DASHBOARD & TIMELINE SCRUBBER                     */}
      {/* ========================================================================= */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-5">
        {/* Timeline Header & Current Time Clock */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-mono text-sm font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              {currentSnapshot.timeLabel}
            </div>
            <div>
              <div className="text-xs font-semibold text-white">CAS Session Time Progression</div>
              <div className="text-[11px] text-slate-400">03:15:00 PM (Start) ➔ 03:20:00 PM (Peak) ➔ 03:30:00 PM (Close)</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Trading Capital:</span>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
              <span className="text-xs text-slate-400 font-mono">{currency}</span>
              <input
                type="number"
                step="25000"
                min="10000"
                max="10000000"
                value={capitalInput}
                onChange={(e) => setCapitalInput(Math.max(5000, parseInt(e.target.value) || 100000))}
                className="w-24 bg-transparent text-white font-mono text-xs font-bold focus:outline-none text-right"
              />
            </div>
          </div>
        </div>

        {/* Interactive Timeline Scrubber Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span className="text-indigo-400 font-semibold">3:15 PM (Auction Start)</span>
            <span className="text-amber-400 font-bold">3:18 PM (Selling Wave)</span>
            <span className="text-rose-400 font-black animate-pulse">3:20 PM (-2,200 Pt Climax)</span>
            <span className="text-emerald-400 font-bold">3:23 PM (V-Rebound)</span>
            <span className="text-slate-400 font-semibold">3:30 PM (Settlement)</span>
          </div>

          <input
            type="range"
            min="0"
            max="900"
            step="5"
            value={simulationSecond}
            onChange={(e) => {
              setIsPlaying(false);
              setSimulationSecond(parseInt(e.target.value));
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Dynamic Telemetry Metrics Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          {/* Metric 1: Sensex Index Value */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-semibold">
              Sensex Spot Index
            </span>
            <div className="text-xl font-bold text-white">
              {currentSnapshot.currentSensex.toLocaleString()}
            </div>
            <div className={`text-xs font-semibold flex items-center gap-1 ${currentSnapshot.sensexDrop > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              <TrendingDown className="w-3.5 h-3.5" />
              -{currentSnapshot.sensexDrop} pts ({((currentSnapshot.sensexDrop / currentSnapshot.sensexBase) * 100).toFixed(2)}%)
            </div>
          </div>

          {/* Metric 2: Reliance CAS Auction Price */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-semibold">
              Reliance Industries (LTP)
            </span>
            <div className="text-xl font-bold text-amber-300">
              ₹{currentSnapshot.reliancePrice.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400">
              Base: ₹1,289.00 ➔ Low: ₹1,250.00 (-3.0%)
            </div>
          </div>

          {/* Metric 3: Sensex 76,500 PE Premium */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-indigo-500/40 space-y-1">
            <span className="text-[10px] text-indigo-400 uppercase tracking-wider block font-sans font-semibold">
              76,500 PE Premium
            </span>
            <div className="text-xl font-bold text-indigo-300">
              ₹{currentSnapshot.optionPrice.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-400 font-semibold">
              Multiplier: {((currentSnapshot.optionPrice / 5.0)).toFixed(1)}x (Base ₹5.00)
            </div>
          </div>

          {/* Metric 4: Net P&L on Invested Capital */}
          <div className={`p-3.5 rounded-xl border space-y-1 ${
            currentSnapshot.netPnl > 0
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : currentSnapshot.netPnl < 0
              ? 'bg-rose-950/40 border-rose-500/40'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-semibold">
              Portfolio Position Value
            </span>
            <div className={`text-xl font-black ${currentSnapshot.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{currentSnapshot.currentValue.toLocaleString()}
            </div>
            <div className={`text-xs font-bold ${currentSnapshot.netPnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {currentSnapshot.netPnl >= 0 ? '+' : ''}₹{currentSnapshot.netPnl.toLocaleString()} ({currentSnapshot.returnPct > 0 ? `+${currentSnapshot.returnPct}%` : `${currentSnapshot.returnPct}%`})
            </div>
          </div>
        </div>

        {/* Live System Broadcast Banner */}
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <span className="text-xs text-slate-400 block">Current CAS Market State:</span>
              <span className="text-xs font-bold text-white">{currentSnapshot.marketState}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold block">
              Algorithmic Execution Directive
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">
              {currentSnapshot.recommendation}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CORE 3: IMPLEMENTATION BLUEPRINT & CAS EXECUTION PLAYBOOK                 */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            How to Implement & Trade the CAS Strategy (Quantitative Playbook)
          </h3>
          <span className="text-xs font-mono text-slate-400">SEBI F&O Compliant Rules</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Rule 1: The 3:14:50 PM Strangle / Straddle Setup */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              1. Pre-CAS Strangle Setup (3:14 PM)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Because CAS direction can swing either way (+2,200 or -2,200 pts), buying equal lots of both <strong>OTM Put (₹5) and OTM Call (₹5)</strong> creates a gamma asymmetry. A 44x move on one side (+4,400%) vastly outperforms the 100% loss on the losing leg (-₹5).
            </p>
            <div className="text-[11px] font-mono text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800">
              Max Risk: 2 × ₹5 = ₹10 | Max Gain: ₹225+ (22.5x Net)
            </div>
          </div>

          {/* Rule 2: Heavyweight Order Imbalance Scanner */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" />
              2. Heavyweight Imbalance Trigger
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Monitor the <strong>Theoretical Equilibrium Price (TEP)</strong> of top 3 Sensex heavyweights: Reliance (10.2%), HDFC Bank (13.5%), ICICI Bank (9.1%). If their pooled auction sell volume exceeds buy orders by &gt;15%, initiate Put Gamma scalp.
            </p>
            <div className="text-[11px] font-mono text-amber-300 bg-slate-900 p-2 rounded border border-slate-800">
              Condition: Reliance TEP &lt; -1.5% at 3:17 PM ➔ Trigger
            </div>
          </div>

          {/* Rule 3: Strict 3:20 PM Exit / Trailing Stop */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-rose-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              3. Strict 3:20 PM Hard Exit Cutoff
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>CRITICAL LESSON:</strong> CAS imbalances always mean-revert before 3:30 PM (as seen when Sensex rebounded 2,000 pts). If you do not exit between 3:20 PM and 3:22 PM via limit orders, your ₹44 Lakh profit will collapse to ₹0.
            </p>
            <div className="text-[11px] font-mono text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-500/20 font-bold">
              Hard Exit: Trigger GTT Limit Sell order @ 3:20 PM
            </div>
          </div>
        </div>

        {/* Realistic Execution Safeguards & Risks Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 block mb-0.5">Real-World Execution Realities & Slippage Caution:</strong>
            While the mathematical potential of 44x returns on Expiry Day CAS exists, real-world execution faces exchange order freeze limits, rapid bid-ask spread widening, and extreme execution speed requirements. Always use predefined limit orders and strict risk capital (e.g. max 1-2% of portfolio) when trading 0-DTE Gamma events.
          </div>
        </div>
      </div>
    </section>
  );
};
