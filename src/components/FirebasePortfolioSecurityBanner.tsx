import React from 'react';
import {
  ShieldCheck,
  Lock,
  Cloud,
  CloudCheck,
  LogIn,
  LogOut,
  User as UserIcon,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Database,
  CheckCircle2
} from 'lucide-react';
import { User } from '../lib/firebase';
import { KitePortfolioOverview } from '../types';

interface FirebasePortfolioSecurityBannerProps {
  user: User | null;
  loading: boolean;
  isCloudSynced: boolean;
  lastCloudSyncTime: string | null;
  syncError: string | null;
  isSaving: boolean;
  portfolio: KitePortfolioOverview | null;
  onBackupNow: () => void;
  onGoogleSignIn: () => void;
  onAnonymousSignIn: () => void;
  onSignOut: () => void;
}

export const FirebasePortfolioSecurityBanner: React.FC<FirebasePortfolioSecurityBannerProps> = ({
  user,
  loading,
  isCloudSynced,
  lastCloudSyncTime,
  syncError,
  isSaving,
  portfolio,
  onBackupNow,
  onGoogleSignIn,
  onAnonymousSignIn,
  onSignOut,
}) => {
  return (
    <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm relative overflow-hidden">
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Security Status Description */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Firebase Cloud Security & Portfolio Isolation
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Firestore End-to-End User Security
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Your uploaded portfolio data is encrypted and bound to your private user document path{' '}
              <code className="text-[11px] text-emerald-300 bg-slate-900 px-1 py-0.5 rounded font-mono">
                /users/{user ? user.uid.slice(0, 8) + '...' : '{userId}'}/holdings
              </code>
              . No external or unauthorized user can read or alter your trade positions.
            </p>
          </div>
        </div>

        {/* Right: Auth Status & Cloud Backup Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-emerald-500/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
                {user.displayName || user.email || 'Authenticated User'}
              </span>
              <button
                onClick={onSignOut}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Sign out of Firebase"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onGoogleSignIn}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in with Google
              </button>
              <button
                onClick={onAnonymousSignIn}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                title="Anonymous Session with Isolated Firestore Rules"
              >
                Auto-Protect
              </button>
            </div>
          )}

          {/* Backup Button */}
          <button
            onClick={onBackupNow}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving to Cloud...
              </>
            ) : isCloudSynced ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                Protected in Firestore
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                Save & Lock to Firestore
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync timestamp and error messages */}
      {(lastCloudSyncTime || syncError) && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          {lastCloudSyncTime && (
            <div className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Last Secured in Firestore: {new Date(lastCloudSyncTime).toLocaleTimeString()} ({portfolio?.holdings.length || 0} holdings verified)
            </div>
          )}
          {syncError && (
            <div className="text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              {syncError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
