// Mock backend + state untuk prototipe.
// Semua data disimpan di perangkat (localStorage). Di produksi, fungsi-fungsi di bawah
// diganti dengan panggilan ke API backend (lihat docs/FRAMEWORK.md bagian "API inti").
import { useSyncExternalStore } from 'react';
import { OUTLETS, getOutlet } from './data/outlets';
import {
  DEMO_MITRA_PIN, LEVELS, MAX_CUPS_PER_DAY, OUTLET_COOLDOWN_HOURS, PAYOUT_PER_CUP, REFERRAL_BONUS,
  TOKEN_TTL_SECONDS, getPlan,
} from './data/plans';
import { DEFAULT_LOYALTY, FALLBACK_LOYALTY, SEED_PROMOS, type Promo } from './data/promos';

export type Role = 'pelanggan' | 'mitra';

export interface LedgerEntry {
  id: string;
  delta: number;
  kind: 'grant' | 'redeem' | 'rollover' | 'expire' | 'referral' | 'compensation' | 'promo';
  at: string;
  ref?: string;
  /** Diisi untuk cup bonus kedai: hanya bisa ditebus di kedai ini, ditanggung kedai (tanpa payout). */
  outletId?: string;
}

export interface Redemption {
  id: string;
  outletId: string;
  menuItemId: string;
  at: string;
  stamps: number;
  payout: number;
  scoped: boolean; // memakai cup bonus kedai
  promoId?: string;
  rewardUsed?: boolean;
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

export interface PromoClaim {
  promoId: string;
  at: string;
  usedAt?: string;
}

export interface State {
  role: Role;
  user: { phone: string; name: string } | null;
  subscription: {
    planId: string;
    status: 'active' | 'paused' | 'cancelled';
    periodStart: string;
    periodEnd: string;
    viaOutletId?: string;
  } | null;
  homeOutletId: string | null;
  favorites: string[];
  ledger: LedgerEntry[];
  redemptions: Redemption[];
  tokens: RedeemToken[];
  promos: Promo[];
  claims: PromoClaim[];
  seenPopups: string[];
  loyalty: Record<string, { target: number; reward: string }>;
  mitra: {
    outletId: string | null;
    caps: Record<string, number>;
    paused: Record<string, boolean>;
  };
}

const KEY = 'kopipass-demo-v2';

const initial = (): State => ({
  role: 'pelanggan',
  user: null,
  subscription: null,
  homeOutletId: null,
  favorites: [],
  ledger: [],
  redemptions: [],
  tokens: [],
  promos: SEED_PROMOS.map((p) => ({ ...p })),
  claims: [],
  seenPopups: [],
  loyalty: {},
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
const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ================= Selector: kuota =================
/** Kuota umum (bisa ditebus di semua kedai). */
export const quotaLeft = (s: State) => s.ledger.filter((e) => !e.outletId).reduce((sum, e) => sum + e.delta, 0);
/** Cup bonus khusus satu kedai. */
export const bonusCups = (s: State, outletId: string) =>
  s.ledger.filter((e) => e.outletId === outletId).reduce((sum, e) => sum + e.delta, 0);
export const allBonus = (s: State) => {
  const map: Record<string, number> = {};
  s.ledger.forEach((e) => { if (e.outletId) map[e.outletId] = (map[e.outletId] ?? 0) + e.delta; });
  return Object.entries(map).filter(([, n]) => n > 0);
};
export const totalBonus = (s: State) => allBonus(s).reduce((sum, [, n]) => sum + n, 0);
export const cupsToday = (s: State, now = new Date()) =>
  s.redemptions.filter((r) => isSameDay(new Date(r.at), now)).length;

// ================= Selector: ikatan pelanggan–kedai =================
export const cupsAt = (s: State, outletId: string) => s.redemptions.filter((r) => r.outletId === outletId).length;

export const levelAt = (s: State, outletId: string) => {
  const cups = cupsAt(s, outletId);
  let idx = 0;
  LEVELS.forEach((l, i) => { if (cups >= l.min) idx = i; });
  const next = LEVELS[idx + 1];
  return { name: LEVELS[idx].name, index: idx, cups, next: next?.name ?? null, toNext: next ? next.min - cups : 0 };
};

export const loyaltyOf = (s: State, outletId: string) =>
  s.loyalty[outletId] ?? DEFAULT_LOYALTY[outletId] ?? FALLBACK_LOYALTY;

export const stampsAt = (s: State, outletId: string) => {
  const { target, reward } = loyaltyOf(s, outletId);
  const list = s.redemptions.filter((r) => r.outletId === outletId);
  const earned = list.reduce((sum, r) => sum + (r.stamps ?? 1), 0);
  const used = list.filter((r) => r.rewardUsed).length;
  const balance = Math.max(0, earned - used * target);
  return { balance, target, reward, available: balance >= target, progress: Math.min(balance, target) };
};

// ================= Selector: promo =================
export const isPromoLive = (p: Promo, now = new Date()) => p.active && p.validUntil >= todayStr(now);
export const isHappyHourNow = (p: Promo, now = new Date()) =>
  p.kind === 'happyhour' && p.startHour != null && p.endHour != null && now.getHours() >= p.startHour && now.getHours() < p.endHour;

export const promoEligible = (s: State, p: Promo) => {
  if (p.audience === 'andalan') return s.homeOutletId === p.outletId;
  if (p.audience === 'baru') return !s.subscription || s.subscription.status === 'cancelled';
  return true;
};

export const livePromos = (s: State, outletId?: string) =>
  s.promos.filter((p) => isPromoLive(p) && (!outletId || p.outletId === outletId));

/** Promo bonus langganan yang berlaku untuk kedai tertentu (dipakai di layar paket). */
export const subscribePromo = (s: State, outletId: string | null) =>
  outletId ? livePromos(s, outletId).find((p) => p.kind === 'langganan' && p.audience !== 'andalan') : undefined;

/** Pop-up berikutnya untuk pelanggan: promo aktif ber-pop-up yang belum dilihat, kedai andalan & favorit didahulukan. */
export const nextPopup = (s: State) => {
  const rank = (p: Promo) => (p.outletId === s.homeOutletId ? 0 : s.favorites.includes(p.outletId) ? 1 : 2);
  return livePromos(s)
    .filter((p) => p.popup && promoEligible(s, p) && !s.seenPopups.includes(p.id))
    .sort((a, b) => rank(a) - rank(b))[0];
};

export const claimOf = (s: State, promoId: string) => s.claims.find((c) => c.promoId === promoId);
export const openClaimsAt = (s: State, outletId: string) =>
  s.claims
    .filter((c) => !c.usedAt)
    .map((c) => s.promos.find((p) => p.id === c.promoId))
    .filter((p): p is Promo => !!p && p.outletId === outletId && isPromoLive(p) && p.kind !== 'langganan');

// ================= Selector: mitra =================
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
  const referral = s.subscription?.viaOutletId === outletId && new Date(s.subscription.periodStart) >= start ? REFERRAL_BONUS : 0;
  return {
    count: list.length,
    bonusCount: list.filter((r) => r.scoped).length,
    payout: list.reduce((sum, r) => sum + (r.payout ?? PAYOUT_PER_CUP), 0) + referral,
    referral,
    since: start,
  };
};

// ================= Aksi pelanggan =================
export const setRole = (role: Role) => set({ role });
export const login = (phone: string, name: string) => set({ user: { phone, name } });

export const subscribe = (planId: string, viaOutletId: string | null = null) => {
  const plan = getPlan(planId);
  if (!plan) return;
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  const promo = subscribePromo(state, viaOutletId);
  set((s) => {
    const ledger: LedgerEntry[] = [...s.ledger, { id: uid(), delta: plan.cups, kind: 'grant', at: now.toISOString(), ref: planId }];
    if (promo && viaOutletId && promo.bonusCups)
      ledger.push({ id: uid(), delta: promo.bonusCups, kind: 'promo', at: now.toISOString(), ref: promo.id, outletId: viaOutletId });
    return {
      subscription: { planId, status: 'active', periodStart: now.toISOString(), periodEnd: end.toISOString(), viaOutletId: viaOutletId ?? undefined },
      homeOutletId: viaOutletId ?? s.homeOutletId,
      favorites: viaOutletId && !s.favorites.includes(viaOutletId) ? [...s.favorites, viaOutletId] : s.favorites,
      ledger,
      promos: promo ? s.promos.map((p) => (p.id === promo.id ? { ...p, claims: p.claims + 1 } : p)) : s.promos,
      claims: promo ? [...s.claims, { promoId: promo.id, at: now.toISOString(), usedAt: now.toISOString() }] : s.claims,
    };
  });
};

export const setHomeOutlet = (outletId: string | null) =>
  set((s) => ({
    homeOutletId: outletId,
    favorites: outletId && !s.favorites.includes(outletId) ? [...s.favorites, outletId] : s.favorites,
  }));

export const toggleFavorite = (outletId: string) =>
  set((s) => ({
    favorites: s.favorites.includes(outletId) ? s.favorites.filter((x) => x !== outletId) : [...s.favorites, outletId],
  }));

export const claimPromo = (promoId: string) =>
  set((s) =>
    s.claims.some((c) => c.promoId === promoId)
      ? {}
      : {
          claims: [...s.claims, { promoId, at: new Date().toISOString() }],
          promos: s.promos.map((p) => (p.id === promoId ? { ...p, claims: p.claims + 1 } : p)),
        },
  );

export const markPopupSeen = (promoId: string) =>
  set((s) => ({
    seenPopups: s.seenPopups.includes(promoId) ? s.seenPopups : [...s.seenPopups, promoId],
    promos: s.promos.map((p) => (p.id === promoId ? { ...p, views: p.views + 1 } : p)),
  }));

export const togglePause = () =>
  set((s) =>
    s.subscription
      ? { subscription: { ...s.subscription, status: s.subscription.status === 'paused' ? 'active' : 'paused' } }
      : {},
  );

export const cancelSubscription = () =>
  set((s) => (s.subscription ? { subscription: { ...s.subscription, status: 'cancelled' } } : {}));

/** Pemeriksaan sebelum token dibuat (sisi pelanggan). */
export const canRedeem = (s: State): string | null => {
  if (!s.subscription) return 'Kamu belum berlangganan.';
  if (s.subscription.status === 'paused') return 'Langganan sedang di-pause.';
  if (s.subscription.status === 'cancelled') return 'Langganan sudah dibatalkan.';
  if (quotaLeft(s) + totalBonus(s) <= 0) return 'Kuota cup bulan ini sudah habis.';
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
  set((s) => ({ tokens: [...s.tokens.filter((t) => t.expiresAt > now - 300000), token] }));
  return token;
};

export const rate = (redemptionId: string, rating: number, tags: string[]) =>
  set((s) => ({ redemptions: s.redemptions.map((r) => (r.id === redemptionId ? { ...r, rating, tags } : r)) }));

// ================= Aksi mitra (kasir) =================
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

export const setLoyalty = (outletId: string, target: number, reward: string) =>
  set((s) => ({ loyalty: { ...s.loyalty, [outletId]: { target: Math.max(2, Math.min(20, target)), reward } } }));

export const savePromo = (promo: Omit<Promo, 'id' | 'views' | 'claims' | 'createdBy'> & { id?: string }) =>
  set((s) => {
    if (promo.id && s.promos.some((p) => p.id === promo.id))
      return { promos: s.promos.map((p) => (p.id === promo.id ? { ...p, ...promo, id: p.id } : p)) };
    const created: Promo = { ...promo, id: 'p-' + uid(), views: 0, claims: 0, createdBy: 'mitra' };
    return { promos: [created, ...s.promos] };
  });

export const togglePromoActive = (promoId: string) =>
  set((s) => ({ promos: s.promos.map((p) => (p.id === promoId ? { ...p, active: !p.active } : p)) }));

export const deletePromo = (promoId: string) =>
  set((s) => ({ promos: s.promos.filter((p) => p.id !== promoId), claims: s.claims.filter((c) => c.promoId !== promoId) }));

/** Info pelanggan untuk kasir saat kode dimasukkan (level, kedai andalan, promo diklaim, hadiah stempel). */
export const customerContext = (code: string, outletId: string) => {
  const s = state;
  const token = s.tokens.find((t) => t.code === code.trim() && !t.used && t.expiresAt > Date.now());
  if (!token || !s.user) return null;
  return {
    name: s.user.name,
    level: levelAt(s, outletId),
    isHome: s.homeOutletId === outletId,
    bonus: bonusCups(s, outletId),
    stamps: stampsAt(s, outletId),
    claims: openClaimsAt(s, outletId),
  };
};

export interface ConfirmResult {
  ok: boolean;
  message: string;
  redemption?: Redemption;
}

/** Validasi tebus di kasir — meniru POST /redeem/confirm di backend. */
export const confirmRedeem = (
  code: string,
  outletId: string,
  menuItemId: string,
  opts: { promoId?: string; useReward?: boolean } = {},
): ConfirmResult => {
  const s = state;
  const now = Date.now();
  const nowDate = new Date(now);
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

  const scoped = bonusCups(s, outletId) > 0;
  if (!scoped && quotaLeft(s) <= 0)
    return { ok: false, message: 'Kuota umum habis. Cup bonus pelanggan hanya berlaku di kedai lain.' };

  const last = [...s.redemptions].reverse().find((r) => r.outletId === outletId);
  if (last && now - new Date(last.at).getTime() < OUTLET_COOLDOWN_HOURS * 3600 * 1000)
    return { ok: false, message: `Pelanggan sudah menebus di kedai ini dalam ${OUTLET_COOLDOWN_HOURS} jam terakhir.` };

  if (outletToday(s, outletId).length >= outletCap(s, outletId))
    return { ok: false, message: 'Kuota harian KopiPass kedai ini sudah penuh.' };

  const isHome = s.homeOutletId === outletId;
  const happy = livePromos(s, outletId).some((p) => isHappyHourNow(p, nowDate));
  const stamps = 1 + (isHome ? 1 : 0) + (happy ? 1 : 0);
  const rewardUsed = !!opts.useReward && stampsAt(s, outletId).available;
  const promoId = opts.promoId && openClaimsAt(s, outletId).some((p) => p.id === opts.promoId) ? opts.promoId : undefined;

  const redemption: Redemption = {
    id: uid(), outletId, menuItemId, at: nowDate.toISOString(),
    stamps, payout: scoped ? 0 : PAYOUT_PER_CUP, scoped, promoId, rewardUsed,
  };
  set((st) => ({
    redemptions: [...st.redemptions, redemption],
    ledger: [...st.ledger, { id: uid(), delta: -1, kind: 'redeem', at: redemption.at, ref: redemption.id, outletId: scoped ? outletId : undefined }],
    tokens: st.tokens.map((t) => (t.code === token.code ? { ...t, used: true, redemptionId: redemption.id } : t)),
    claims: promoId ? st.claims.map((c) => (c.promoId === promoId ? { ...c, usedAt: redemption.at } : c)) : st.claims,
  }));
  const extras = [
    scoped ? 'memakai cup bonus kedai' : null,
    `+${stamps} stempel`,
    rewardUsed ? 'hadiah stempel diberikan' : null,
    promoId ? 'promo diterapkan' : null,
  ].filter(Boolean).join(' · ');
  return { ok: true, message: `Berhasil! ${menu.name} ditebus (${extras}).`, redemption };
};

// ================= Utilitas demo =================
export const seedDemoHistory = () => {
  const picks: [string, number, number, string[]][] = [
    ['o02', 9, 5, ['Mantap']],
    ['o02', 7, 4, ['Pas manisnya']],
    ['o04', 6, 4, ['Pas manisnya']],
    ['o02', 5, 5, ['Mantap']],
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
    const home = state.homeOutletId === outletId;
    return {
      id: uid(), outletId, menuItemId: outlet.menu[daysAgo % 3].id, at: d.toISOString(),
      stamps: home ? 2 : 1, payout: PAYOUT_PER_CUP, scoped: false, rating, tags,
    };
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
