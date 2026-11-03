// Anggota contoh (FIKTIF) untuk tab Pelanggan di aplikasi mitra.
// Di produksi, daftar ini datang dari backend (pelanggan yang menebus / menjadikan kedai ini andalan).

export interface SampleMember {
  name: string;
  cups: number;
  home: boolean;
  viaOutlet: boolean;
  lastVisitDaysAgo: number;
}

const NAMES = ['Rina S.', 'Bagas P.', 'Dewi A.', 'Fajar N.', 'Sari W.', 'Aldo K.', 'Maya R.', 'Tegar H.', 'Intan L.', 'Raka D.'];

export const sampleMembers = (outletId: string): SampleMember[] => {
  const seed = Number(outletId.replace(/\D/g, '')) || 1;
  return Array.from({ length: 6 }, (_, i) => {
    const k = (seed * 7 + i * 13) % 23;
    return {
      name: NAMES[(seed + i * 3) % NAMES.length],
      cups: [21, 16, 11, 8, 4, 2][i] + (k % 3),
      home: i < 3,
      viaOutlet: i === 0 || i === 2,
      lastVisitDaysAgo: (k % 6) + i,
    };
  });
};
