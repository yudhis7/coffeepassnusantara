export interface Plan {
  id: 'hemat' | 'harian' | 'plus';
  name: string;
  cups: number;
  price: number;
  tagline: string;
  popular?: boolean;
}

export const PLANS: Plan[] = [
  { id: 'hemat', name: 'Hemat', cups: 10, price: 179000, tagline: 'Untuk 2–3 kali seminggu' },
  { id: 'harian', name: 'Harian', cups: 22, price: 349000, tagline: '1 cup tiap hari kerja', popular: true },
  { id: 'plus', name: 'Harian Plus', cups: 30, price: 449000, tagline: 'Setiap hari + 4 upgrade premium' },
];

export const PAYOUT_PER_CUP = 14500;
export const REFERRAL_BONUS = 20000; // bonus untuk kedai per pelanggan baru yang berlangganan lewat kedai itu (usulan)

// Level member per kedai, dihitung dari jumlah cup yang ditebus di kedai tersebut
export const LEVELS = [
  { name: 'Pengunjung', min: 0 },
  { name: 'Langganan', min: 5 },
  { name: 'Sahabat Kedai', min: 15 },
];
export const MAX_CUPS_PER_DAY = 2;
export const OUTLET_COOLDOWN_HOURS = 3;
export const ROLLOVER_MAX = 3;
export const TOKEN_TTL_SECONDS = 30;
export const DEMO_OTP = '123456';
export const DEMO_MITRA_PIN = '1234';

export const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID');
export const getPlan = (id: string) => PLANS.find((p) => p.id === id);
