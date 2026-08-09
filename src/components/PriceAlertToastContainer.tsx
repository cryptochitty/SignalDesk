import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Settings2,
  Music,
} from "lucide-react";
import { ToastAlert } from "../types";

export type AlertSoundType = "chime" | "digital_beep" | "soft_bell" | "marimba";

export interface SoundOption {
  id: AlertSoundType;
  label: string;
  description: string;
}

const SOUND_OPTIONS: SoundOption[] = [
  { id: "chime", label: "Gentle Chime", description: "Ascending triple crystal tone" },
  { id: "digital_beep", label: "Digital Beep", description: "Terminal high-freq pulse" },
  { id: "soft_bell", label: "Soft Bell", description: "Harmonic resonant ring" },
  { id: "marimba", label: "Marimba Pulse", description: "Warm wooden percussive acoustic" },
];

/**
 * Synthesizes subtle audio notifications using browser Web Audio API
 */
export const playAlertSoundEffect = (
  type: AlertSoundType = "chime",
  volume: number = 0.7
) => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const masterGain = ctx.createGain();
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "chime") {
      // 3-note ascending crystalline chime (C5, E5, G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.55);
      });
    } else if (type === "digital_beep") {
      // 2 rapid high tech terminal beeps (880Hz, 1046.5Hz)
      const freqs = [880, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.08);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.09);
      });
    } else if (type === "soft_bell") {
      // Harmonic bell (fundamental + octave harmonic)
      [523.25, 1046.5].forEach((freq, hIdx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        const volFactor = hIdx === 0 ? 0.3 : 0.1;
        gain.gain.setValueAtTime(volFactor, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.85);
      });
    } else if (type === "marimba") {
      // Marimba wood pulse (440Hz -> 554.37Hz)
      [440, 554.37].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.35, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.28);
      });
    }
  } catch (_e) {
    // Ignore audio errors silently
  }
};

interface PriceAlertToastContainerProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export const PriceAlertToastContainer: React.FC<PriceAlertToastContainerProps> = ({
  toasts,
  onDismiss,
  onClearAll,
}) => {
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("alert_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });

  const [selectedSound, setSelectedSound] = useState<AlertSoundType>(() => {
    const saved = localStorage.getItem("alert_sound_type") as AlertSoundType;
    return saved && SOUND_OPTIONS.some((s) => s.id === saved) ? saved : "chime";
  });

  const [soundVolume, setSoundVolume] = useState<number>(() => {
    const saved = localStorage.getItem("alert_sound_volume");
    return saved !== null ? parseFloat(saved) : 0.7;
  });

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const prevToastsLengthRef = useRef<number>(toasts.length);

  // Save audio preferences
  useEffect(() => {
    localStorage.setItem("alert_sound_enabled", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("alert_sound_type", selectedSound);
  }, [selectedSound]);

  useEffect(() => {
    localStorage.setItem("alert_sound_volume", String(soundVolume));
  }, [soundVolume]);

  // Trigger audio on new incoming alert toast
  useEffect(() => {
    if (toasts.length > prevToastsLengthRef.current && soundEnabled) {
      playAlertSoundEffect(selectedSound, soundVolume);
    }
    prevToastsLengthRef.current = toasts.length;
  }, [toasts.length, soundEnabled, selectedSound, soundVolume]);

  const handleTestSound = (soundType = selectedSound) => {
    playAlertSoundEffect(soundType, soundVolume);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 space-y-3 pointer-events-none">
      {/* Audio Control Bar Overlay */}
      <div className="pointer-events-auto bg-slate-900/95 border border-slate-800 backdrop-blur-md rounded-xl p-2.5 shadow-xl flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const nextState = !soundEnabled;
              setSoundEnabled(nextState);
              if (nextState) playAlertSoundEffect(selectedSound, soundVolume);
            }}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              soundEnabled
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30"
                : "bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800"
            }`}
            title={soundEnabled ? "Mute alert audio" : "Enable alert audio"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
            <span className="font-bold text-[11px]">
              {soundEnabled ? "Audio On" : "Audio Muted"}
            </span>
          </button>

          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            Sound: <strong className="text-slate-200">{SOUND_OPTIONS.find((s) => s.id === selectedSound)?.label}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Test Sound Button */}
          <button
            onClick={() => handleTestSound()}
            disabled={!soundEnabled}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 border border-slate-700 transition-colors flex items-center gap-1 text-[11px] font-medium"
            title="Preview selected notification sound effect"
          >
            <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
            <span>Test Sound</span>
          </button>

          {/* Sound Settings Toggle */}
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showSettings
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
            title="Configure alert sound effect & volume"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Audio Settings Panel */}
      {showSettings && (
        <div className="pointer-events-auto bg-slate-950/95 border border-indigo-500/30 rounded-xl p-3 shadow-2xl space-y-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Music className="w-4 h-4 text-indigo-400" />
              Alert Audio Configuration
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sound Effect Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sound Effect Profile
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {SOUND_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedSound(opt.id);
                    playAlertSoundEffect(opt.id, soundVolume);
                  }}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedSound === opt.id
                      ? "bg-indigo-600/20 border-indigo-500 text-white font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="text-[11px] font-bold">{opt.label}</div>
                  <div className="text-[9px] text-slate-400 truncate">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Volume Control Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Notification Volume</span>
              <span className="text-indigo-400 font-mono">{Math.round(soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={soundVolume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                setSoundVolume(vol);
              }}
              onMouseUp={() => playAlertSoundEffect(selectedSound, soundVolume)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Toasts Stack */}
      {toasts.map((toast) => {
        const isExceeded = toast.type === "exceeded";
        const isDropped = toast.type === "dropped";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all transform animate-in slide-in-from-bottom-5 duration-300 ${
              isExceeded
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50"
                : isDropped
                ? "bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50"
                : "bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-indigo-950/50"
            }`}
          >
            {/* Icon Badge */}
            <div
              className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
                isExceeded
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ring-2 ring-emerald-500/10"
                  : isDropped
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 ring-2 ring-rose-500/10"
                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              }`}
            >
              {isExceeded ? (
                <ArrowUpRight className="w-6 h-6 animate-bounce" />
              ) : isDropped ? (
                <ArrowDownRight className="w-6 h-6 animate-bounce" />
              ) : (
                <Bell className="w-6 h-6" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/10 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {toast.symbol} ALERT
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {toast.timestamp}
                </span>
              </div>

              <h4 className="text-sm font-bold mt-1 text-white leading-tight">
                {toast.title}
              </h4>

              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {toast.message}
              </p>

              {/* Price comparison detail tag */}
              <div className="mt-2 flex items-center gap-3 text-xs font-mono pt-2 border-t border-white/10">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">Predicted Next Close:</span>
                  <span className="font-bold text-white bg-slate-950/60 px-2 py-0.5 rounded border border-white/10">
                    {toast.currency}{toast.predictedPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">Target Threshold:</span>
                  <span className="font-medium text-slate-300">
                    {toast.currency}{toast.targetThreshold.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {toasts.length > 1 && (
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={onClearAll}
            className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900/90 border border-slate-700 px-3 py-1 rounded-lg shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            Clear All Notifications ({toasts.length})
          </button>
        </div>
      )}
    </div>
  );
};

