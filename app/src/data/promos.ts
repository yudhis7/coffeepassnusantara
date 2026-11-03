// Jenis promo yang bisa dibuat kedai mitra + promo contoh (fiktif) untuk prototipe.

export type PromoKind = 'langganan' | 'diskon' | 'happyhour' | 'gratis';
export type PromoAudience = 'semua' | 'andalan' | 'baru';

export interface Promo {
  id: string;
  outletId: string;
  kind: PromoKind;
  title: string;
  description: string;
  audience: PromoAudience;
  popup: boolean;
  active: boolean;
  validUntil: string; // YYYY-MM-DD
  bonusCups?: number; // kind 'langganan': cup bonus khusus kedai ini
  startHour?: number; // kind 'happyhour'
  endHour?: number;
  views: number;
  claims: number;
  createdBy: 'seed' | 'mitra';
}

export const PROMO_KINDS: { kind: PromoKind; label: string; help: string }[] = [
  {
    kind: 'langganan',
    label: 'Bonus langganan lewat kedai',
    help: 'Pelanggan yang berlangganan lewat kedaimu mendapat cup bonus yang hanya bisa ditebus di kedaimu. Kedaimu otomatis menjadi kedai andalannya.',
  },
  {
    kind: 'diskon',
    label: 'Diskon tambahan member',
    help: 'Diskon untuk pembelian tambahan (pastry, biji kopi, menu non-inti) yang dibayar normal.',
  },
  {
    kind: 'happyhour',
    label: 'Jam sepi: stempel ganda',
    help: 'Pada jam yang kamu pilih, setiap tebus di kedaimu memberi stempel tambahan. Cocok untuk mengisi jam sepi.',
  },
  {
    kind: 'gratis',
    label: 'Upgrade / item gratis',
    help: 'Gratis upgrade (size up, oat milk, extra shot) atau item kecil saat menebus di kedaimu.',
  },
];

export const AUDIENCE_LABEL: Record<PromoAudience, string> = {
  semua: 'Semua pelanggan KopiPass',
  andalan: 'Hanya pelanggan yang menjadikan kedaimu kedai andalan',
  baru: 'Calon pelanggan (belum berlangganan)',
};

export const KIND_LABEL = Object.fromEntries(PROMO_KINDS.map((k) => [k.kind, k.label])) as Record<PromoKind, string>;

export const SEED_PROMOS: Promo[] = [
  {
    id: 'p-seed-1', outletId: 'o02', kind: 'langganan', audience: 'baru', popup: true, active: true,
    title: 'Langganan lewat Seduh Senja, bonus 3 cup',
    description: 'Pilih Seduh Senja Melawai sebagai kedai andalan saat berlangganan dan dapatkan 3 cup bonus untuk manual brew atau kopi susu di kedai kami.',
    validUntil: '2026-12-31', bonusCups: 3, views: 128, claims: 17, createdBy: 'seed',
  },
  {
    id: 'p-seed-2', outletId: 'o06', kind: 'diskon', audience: 'semua', popup: false, active: true,
    title: 'Diskon 20% semua pastry',
    description: 'Khusus member KopiPass: diskon 20% untuk croissant, banana bread, dan kue harian. Tunjukkan promo saat membayar.',
    validUntil: '2026-12-15', views: 86, claims: 22, createdBy: 'seed',
  },
  {
    id: 'p-seed-3', outletId: 'o08', kind: 'happyhour', audience: 'semua', popup: true, active: true,
    title: 'Stempel ganda jam 14.00–17.00',
    description: 'Tebus di Tumbuh Coffee Lab antara pukul 14.00 dan 17.00 untuk mendapat stempel tambahan di kartu stempelmu.',
    validUntil: '2026-11-30', startHour: 14, endHour: 17, views: 64, claims: 9, createdBy: 'seed',
  },
  {
    id: 'p-seed-4', outletId: 'o11', kind: 'gratis', audience: 'andalan', popup: false, active: true,
    title: 'Gratis upgrade oat milk',
    description: 'Untuk pelanggan yang menjadikan Seruput Rasuna kedai andalan: ganti susu ke oat milk tanpa biaya tambahan.',
    validUntil: '2026-12-31', views: 41, claims: 6, createdBy: 'seed',
  },
];

// Hadiah kartu stempel bawaan per kedai (bisa diubah mitra di Pengaturan)
export const DEFAULT_LOYALTY: Record<string, { target: number; reward: string }> = {
  o02: { target: 5, reward: 'Manual brew gratis' },
  o06: { target: 5, reward: 'Pastry gratis' },
  o08: { target: 6, reward: '200 g biji kopi diskon 50%' },
  o11: { target: 5, reward: 'Size up gratis' },
};
export const FALLBACK_LOYALTY = { target: 5, reward: 'Size up gratis' };
