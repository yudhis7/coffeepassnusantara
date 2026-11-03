// Mock backend + state untuk prototipe.
// Semua data disimpan di perangkat (localStorage). Di produksi, fungsi-fungsi di bawah
// diganti dengan panggilan ke API backend (lihat docs/FRAMEWORK.md bagian "API inti").
import { useSyncExternalStore } from 'react';
import { OUTLETS, getOutlet } from './data/outlets';
import {
  DEMO_MITRA_PIN,
  MAX_CUPS_PER_DAY,
  OUTLET_COOLDOWN_HOURS,
  PAYOUT_PER_CUP,
  TOKEN_TTL_SECONDS,
  getPlan,
} from './data/plans';

export type Role = 'pelanggan' | 'mitra';

export interface LedgerEntry {
  id: string;
  delta: number;
  kind: 'grant' | 'redeem' | 'rollover' | 'expire' | 'referral' | 'compensation';
  at: string;
  ref?: string;
}

export interface Redemption {
  id: string;
  outletId: string;
  menuItemId: string;
  at: string;
  rating?: number;
  tags?: string[];
}

export interface RedeemToken {
  code: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  redemptionId?: string;
}

export interface State {
  role: Role;
  user: { phone: string; name: string } | null;
  subscription: {
    planId: string;
    status: 'active' | 'paused' | 'cancelled';
    periodStart: string;
    periodEnd: string;
  } | null;
  ledger: LedgerEntry[];
  redemptions: Redemption[];
  tokens: RedeemToken[];
  mitra: {
    outletId: string | null;
    caps: Record<string, number>;
    paused: Record<string, boolean>;
  };
}

const KEY = 'kopipass-demo-v1';

const initial = (): State => ({
  role: 'pelanggan',
  user: null,
  subscription: null,
  ledger: [],
  redemptions: [],
  tokens: [],
  mitra: { outletId: null, caps: {}, paused: {} },
});

const load = (): State => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
  } catch {
    /* storage tidak tersedia: pakai state di memori */
  }
  return initial();
};

let state: State = load();
const listeners = new Set<() => void>();

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* abaikan */
  }
};

const set = (patch: Partial<State> | ((s: State) => Partial<State>)) => {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  save();
  listeners.forEach((l) => l());
};

// Sinkron antar-tab (versi web): perubahan di tab kasir terlihat di tab pelanggan
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

export const useStore = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );

export const getState = () => state;

const uid = () => Math.random().toString(36).slice(2, 10);
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

// ---------- Selector ----------
export const quotaLeft = (s: State) => s.ledger.reduce((sum, e) => sum + e.delta, 0);
export const cupsToday = (s: State, now = new Date()) =>
  s.redemptions.filter((r) => isSameDay(new Date(r.at), now)).length;
export const outletCap = (s: State, outletId: string) =>
  s.mitra.caps[outletId] ?? getOutlet(outletId)?.dailyCap ?? 30;
export const outletToday = (s: State, outletId: string, now = new Date()) =>
  s.redemptions.filter((r) => r.outletId === outletId && isSameDay(new Date(r.at), now));
export const outletWeek = (s: State, outletId: string, now = new Date()) => {
  const start = new Date(now);
  const day = (start.getDay() + 6) % 7; // Senin = 0
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  const list = s.redemptions.filter((r) => r.outletId === outletId && new Date(r.at) >= start);
  return { count: list.length, payout: list.length * PAYOUT_PER_CUP, since: start };
};

// ---------- Aksi pelanggan ----------
export const setRole = (role: Role) => set({ role });

export const login = (phone: string, name: string) => set({ user: { phone, name } });

export const subscribe = (planId: string) => {
  const plan = getPlan(planId);
  if (!plan) return;
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  set((s) => ({
    subscription: {
      planId,
      status: 'active',
      periodStart: now.toISOString(),
      periodEnd: end.toISOString(),
    },
    ledger: [...s.ledger, { id: uid(), delta: plan.cups, kind: 'grant', at: now.toISOString(), ref: planId }],
  }));
};

export const togglePause = () =>
  set((s) =>
    s.subscription
      ? {
          subscription: {
            ...s.subscription,
            status: s.subscription.status === 'paused' ? 'active' : 'paused',
          },
        }
      : {},
  );

export const cancelSubscription = () =>
  set((s) => (s.subscription ? { subscription: { ...s.subscription, status: 'cancelled' } } : {}));

/** Pemeriksaan sebelum token dibuat (sisi pelanggan). */
export const canRedeem = (s: State): string | null => {
  if (!s.subscription) return 'Kamu belum berlangganan.';
  if (s.subscription.status === 'paused') return 'Langganan sedang di-pause.';
  if (s.subscription.status === 'cancelled') return 'Langganan sudah dibatalkan.';
  if (quotaLeft(s) <= 0) return 'Kuota cup bulan ini sudah habis.';
  if (cupsToday(s) >= MAX_CUPS_PER_DAY) return `Batas ${MAX_CUPS_PER_DAY} cup per hari sudah tercapai.`;
  return null;
};

export const createToken = (): RedeemToken => {
  const now = Date.now();
  const token: RedeemToken = {
    code: String(Math.floor(100000 + Math.random() * 900000)),
    createdAt: now,
    expiresAt: now + TOKEN_TTL_SECONDS * 1000,
    used: false,
  };
  // simpan token baru, buang token kedaluwarsa > 5 menit
  set((s) => ({ tokens: [...s.tokens.filter((t) => t.expiresAt > now - 300000), token] }));
  return token;
};

export const rate = (redemptionId: string, rating: number, tags: string[]) =>
  set((s) => ({
    redemptions: s.redemptions.map((r) => (r.id === redemptionId ? { ...r, rating, tags } : r)),
  }));

// ---------- Aksi mitra (kasir) ----------
export const mitraLogin = (outletId: string, pin: string): string | null => {
  if (!getOutlet(outletId)) return 'Pilih kedai terlebih dahulu.';
  if (pin !== DEMO_MITRA_PIN) return 'PIN salah. (PIN demo: 1234)';
  set((s) => ({ mitra: { ...s.mitra, outletId }, role: 'mitra' }));
  return null;
};

export const mitraLogout = () => set((s) => ({ mitra: { ...s.mitra, outletId: null } }));

export const setOutletCap = (outletId: string, cap: number) =>
  set((s) => ({ mitra: { ...s.mitra, caps: { ...s.mitra.caps, [outletId]: Math.max(0, cap) } } }));

export const toggleOutletPause = (outletId: string) =>
  set((s) => ({ mitra: { ...s.mitra, paused: { ...s.mitra.paused, [outletId]: !s.mitra.paused[outletId] } } }));

export interface ConfirmResult {
  ok: boolean;
  message: string;
  redemption?: Redemption;
}

/** Validasi tebus di kasir — meniru POST /redeem/confirm di backend. */
export const confirmRedeem = (code: string, outletId: string, menuItemId: string): ConfirmResult => {
  const s = state;
  const now = Date.now();
  const outlet = getOutlet(outletId);
  if (!outlet) return { ok: false, message: 'Kedai tidak dikenal.' };
  if (s.mitra.paused[outletId]) return { ok: false, message: 'KopiPass sedang dinonaktifkan di kedai ini.' };
  const menu = outlet.menu.find((x) => x.id === menuItemId);
  if (!menu || !menu.core) return { ok: false, message: 'Pilih salah satu menu inti KopiPass.' };

  const token = s.tokens.find((t) => t.code === code.trim());
  if (!token) return { ok: false, message: 'Kode tidak ditemukan. Minta pelanggan menampilkan kode terbaru.' };
  if (token.used) return { ok: false, message: 'Kode ini sudah dipakai.' };
  if (token.expiresAt < now) return { ok: false, message: 'Kode sudah kedaluwarsa (berlaku 30 detik).' };

  const blocked = canRedeem(s);
  if (blocked) return { ok: false, message: blocked };

  const last = [...s.redemptions].reverse().find((r) => r.outletId === outletId);
  if (last && now - new Date(last.at).getTime() < OUTLET_COOLDOWN_HOURS * 3600 * 1000)
    return { ok: false, message: `Pelanggan sudah menebus di kedai ini dalam ${OUTLET_COOLDOWN_HOURS} jam terakhir.` };

  if (outletToday(s, outletId).length >= outletCap(s, outletId))
    return { ok: false, message: 'Kuota harian KopiPass kedai ini sudah penuh.' };

  const redemption: Redemption = { id: uid(), outletId, menuItemId, at: new Date(now).toISOString() };
  set((st) => ({
    redemptions: [...st.redemptions, redemption],
    ledger: [...st.ledger, { id: uid(), delta: -1, kind: 'redeem', at: redemption.at, ref: redemption.id }],
    tokens: st.tokens.map((t) => (t.code === token.code ? { ...t, used: true, redemptionId: redemption.id } : t)),
  }));
  return { ok: true, message: `Berhasil! ${menu.name} ditebus. Sisa kuota pelanggan: ${quotaLeft(state)} cup.`, redemption };
};

// ---------- Utilitas demo ----------
export const seedDemoHistory = () => {
  const picks: [string, number, number, string[]][] = [
    ['o02', 6, 5, ['Mantap']],
    ['o04', 5, 4, ['Pas manisnya']],
    ['o08', 4, 5, ['Mantap']],
    ['o01', 3, 4, []],
    ['o11', 2, 3, ['Terlalu manis']],
    ['o06', 1, 5, ['Mantap', 'Enak buat kerja']],
  ];
  const reds: Redemption[] = picks.map(([outletId, daysAgo, rating, tags]) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(8 + (daysAgo % 4), 15, 0, 0);
    const outlet = getOutlet(outletId)!;
    return { id: uid(), outletId, menuItemId: outlet.menu[daysAgo % 3].id, at: d.toISOString(), rating, tags };
  });
  set((s) => ({
    redemptions: [...reds, ...s.redemptions].sort((a, b) => a.at.localeCompare(b.at)),
    ledger: [...s.ledger, ...reds.map((r) => ({ id: uid(), delta: -1, kind: 'redeem' as const, at: r.at, ref: r.id }))],
  }));
};

export const resetDemo = () => {
  state = initial();
  save();
  listeners.forEach((l) => l());
};

export const ALL_OUTLETS = OUTLETS;
