"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "frappify:accounts";

export interface StoredAccount {
  id: string; // `${siteId}:${username}`
  username: string;
  siteId: string;
  accessToken: string;
  accessTokenExpires: number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// ---------------------------------------------------------------------------
// External store so every hook instance re-renders on the same data.
// ---------------------------------------------------------------------------
let listeners: Array<() => void> = [];
let snapshot: StoredAccount[] = readFromStorage();

function readFromStorage(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(accounts: StoredAccount[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // quota exceeded – silently ignore
  }
  snapshot = accounts;
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return snapshot;
}

const EMPTY: StoredAccount[] = [];

function getServerSnapshot(): StoredAccount[] {
  return EMPTY;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAccountStore() {
  const accounts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep in sync with other tabs / windows.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        snapshot = readFromStorage();
        for (const l of listeners) l();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const saveAccount = useCallback((account: StoredAccount) => {
    // Read directly from the module-level snapshot so we never lose
    // accounts due to a stale React closure.
    const current = getSnapshot();
    const next = current.filter((a) => a.id !== account.id);
    next.unshift(account);
    writeToStorage(next);
  }, []);

  const removeAccount = useCallback((id: string) => {
    writeToStorage(getSnapshot().filter((a) => a.id !== id));
  }, []);

  const getAccount = useCallback(
    (id: string) => accounts.find((a) => a.id === id) ?? null,
    [accounts],
  );

  return { accounts, saveAccount, removeAccount, getAccount } as const;
}
