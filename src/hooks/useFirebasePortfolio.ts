import { useState, useEffect } from "react";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  serverTimestamp,
  User
} from "../lib/firebase";
import { KitePortfolioOverview } from "../types";

export interface FirebaseSyncState {
  user: User | null;
  loading: boolean;
  isCloudSynced: boolean;
  lastCloudSyncTime: string | null;
  syncError: string | null;
  isSaving: boolean;
}

export function useFirebasePortfolio(localPortfolio: KitePortfolioOverview | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Monitor Auth state
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        setLoading(false);

        if (currentUser && db) {
          // Record user profile in Firestore
          try {
            const userRef = doc(db, "users", currentUser.uid);
            await setDoc(
              userRef,
              {
                uid: currentUser.uid,
                email: currentUser.email || "anonymous_user",
                displayName: currentUser.displayName || "Trader",
                photoURL: currentUser.photoURL || "",
                lastLoginAt: new Date().toISOString(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          } catch (err: any) {
            console.warn("Notice: Firestore user sync:", err?.message || err);
          }
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Auth state observer setup notice:", err);
      setLoading(false);
    }
  }, []);

  // Save / Backup portfolio to user's secure Firestore subcollection
  const backupPortfolioToCloud = async (portfolioToSave?: KitePortfolioOverview) => {
    const target = portfolioToSave || localPortfolio;
    if (!target) return false;

    if (!db) {
      setSyncError("Firestore database service is currently connecting. Please retry in a moment.");
      return false;
    }

    setIsSaving(true);
    setSyncError(null);

    try {
      let activeUid = user?.uid;

      // Auto-authenticate anonymously if user hasn't signed in yet so their data is protected
      if (!activeUid && auth) {
        try {
          const userCred = await signInAnonymously(auth);
          activeUid = userCred.user.uid;
        } catch (authErr: any) {
          console.warn("Anonymous auth warning:", authErr);
        }
      }

      const effectiveUid = activeUid || "local_secure_user";
      const timestamp = new Date().toISOString();

      // 1. Save user portfolio master snapshot
      const userRef = doc(db, "users", effectiveUid);
      await setDoc(
        userRef,
        {
          totalInvested: target.totalInvested,
          currentValue: target.currentValue,
          totalPnl: target.totalPnl,
          totalPnlPct: target.totalPnlPct,
          daysPnl: target.daysPnl,
          holdingsCount: target.holdings?.length || 0,
          lastSyncedAt: timestamp,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Save individual holdings to user's private collection
      if (target.holdings && target.holdings.length > 0) {
        for (const holding of target.holdings) {
          const holdingDocId = holding.id || `h_${holding.symbol.toLowerCase()}`;
          const holdingRef = doc(db, "users", effectiveUid, "holdings", holdingDocId);
          await setDoc(
            holdingRef,
            {
              id: holdingDocId,
              userId: effectiveUid,
              symbol: holding.symbol,
              name: holding.name || holding.symbol,
              companyName: holding.companyName || "",
              exchange: holding.exchange || "NSE",
              quantity: holding.quantity || 0,
              t1Quantity: holding.t1Quantity || 0,
              averagePrice: holding.averagePrice || 0,
              investedAmount: holding.investedAmount || 0,
              ltp: holding.ltp || 0,
              dayChange: holding.dayChange || 0,
              dayChangePct: holding.dayChangePct || 0,
              pnl: holding.pnl || 0,
              pnlPct: holding.pnlPct || 0,
              assetClass: holding.assetClass || "Equities",
              kiteToken: holding.kiteToken || "",
              aiSignal: holding.aiSignal || "HOLD",
              keySupport: holding.keySupport || 0,
              keyTarget: holding.keyTarget || 0,
              updatedAt: timestamp,
            },
            { merge: true }
          );
        }
      }

      // 3. Save snapshot history log
      const snapshotDocId = `snap_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}`;
      const snapshotRef = doc(db, "users", effectiveUid, "snapshots", snapshotDocId);
      await setDoc(snapshotRef, {
        id: snapshotDocId,
        userId: effectiveUid,
        totalInvested: target.totalInvested,
        currentValue: target.currentValue,
        totalPnl: target.totalPnl,
        totalPnlPct: target.totalPnlPct,
        holdingsCount: target.holdings?.length || 0,
        syncedAt: timestamp,
        createdAt: serverTimestamp(),
      });

      setIsCloudSynced(true);
      setLastCloudSyncTime(timestamp);
      return true;
    } catch (err: any) {
      console.error("Firestore backup error:", err);
      setSyncError(err?.message || "Failed to sync portfolio with Firebase Firestore");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Sign in with Google Popup
  const handleGoogleSignIn = async () => {
    if (!auth) {
      setSyncError("Authentication is initializing. Please try again.");
      return;
    }
    try {
      setSyncError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn("Google sign-in warning:", err?.message || err);
      if (err?.code !== "auth/popup-closed-by-user") {
        setSyncError(err?.message || "Google sign-in canceled or blocked by browser popup settings.");
      }
    }
  };

  // Sign in Anonymously
  const handleAnonymousSignIn = async () => {
    if (!auth) {
      setSyncError("Authentication is initializing. Please try again.");
      return;
    }
    try {
      setSyncError(null);
      await signInAnonymously(auth);
    } catch (err: any) {
      console.warn("Anonymous sign-in warning:", err?.message || err);
      setSyncError(err?.message || "Anonymous sign-in failed.");
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setIsCloudSynced(false);
    } catch (err: any) {
      console.error("Sign out error:", err);
    }
  };

  return {
    user,
    loading,
    isCloudSynced,
    lastCloudSyncTime,
    syncError,
    isSaving,
    backupPortfolioToCloud,
    handleGoogleSignIn,
    handleAnonymousSignIn,
    handleSignOut,
  };
}
