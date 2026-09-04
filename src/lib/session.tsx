'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface SessionUser {
  id: string; uid: string; email: string; name: string; phone: string | null;
  country: string | null; role: 'CUSTOMER' | 'SUB_AGENT' | 'ADMIN' | 'SUPER_ADMIN';
  vipLevel: number; kycStatus: string; status: 'ACTIVE' | 'FROZEN';
  mustChangePassword: boolean; walletLocked: boolean; invitedById: string | null;
  invitationCode: string | null; createdAt: string;
}

export interface WalletInfo {
  balance: number; frozen: number;
}

interface SessionState {
  user: SessionUser | null;
  wallet: WalletInfo | null;
  unreadNotifs: number;
  unreadSupport: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [unreadNotifs, setUnread] = useState(0);
  const [unreadSupport, setUnreadSupport] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      const d = await r.json();
      setUser(d.user ?? null);
      setWallet(d.wallet ?? null);
      setUnread(d.unreadNotifs ?? 0);
      setUnreadSupport(Boolean(d.unreadSupport));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null); setWallet(null); setUnread(0);
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 12_000);
    return () => clearInterval(iv);
  }, [refresh]);

  const value = useMemo<SessionState>(() => ({
    user, wallet, unreadNotifs, unreadSupport, loading, refresh, logout,
  }), [user, wallet, unreadNotifs, unreadSupport, loading, refresh, logout]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSession outside SessionProvider');
  return c;
}

/* ------------------------------- helpers -------------------------------- */

export function fmtUsd(n: number, digits = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.001) return n.toFixed(5);
  return n.toPrecision(4);
}

export function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export function timeAgo(iso: string | number): string {
  const t = typeof iso === 'number' ? iso : new Date(iso).getTime();
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function countdown(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { error?: string }).error || `Request failed (${r.status})`);
  return data as T;
}
