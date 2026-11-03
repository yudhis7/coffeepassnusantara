// DATA CONTOH (FIKTIF) untuk prototipe.
// Nama kedai dibuat-buat; koordinat diletakkan di klaster pilot Jakarta Selatan
// (Blok M, Senopati, SCBD, Kuningan, Kemang). Ganti dengan data mitra asli dari backend.

export type Flavor = 'fruity' | 'nutty' | 'cokelat';

export interface MenuItem {
  id: string;
  name: string;
  price: number; // harga normal (Rp)
  core: boolean; // termasuk menu inti KopiPass
}

export interface Outlet {
  id: string;
  name: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  open: string; // "07:00"
  close: string; // "22:00"
  flavors: Flavor[];
  lessSugar: boolean;
  wfc: { plug: boolean; wifi: boolean; quiet: boolean };
  rating: number;
  dailyCap: number;
  menu: MenuItem[];
}

const m = (id: string, name: string, price: number, core = true): MenuItem => ({ id, name, price, core });

const baseMenu = (p: string): MenuItem[] => [
  m(`${p}-ks`, 'Es Kopi Susu Gula Aren', 25000),
  m(`${p}-ksl`, 'Es Kopi Susu Kurang Manis', 25000),
  m(`${p}-am`, 'Americano (panas/es)', 22000),
  m(`${p}-lt`, 'Caffe Latte', 28000),
];

export const OUTLETS: Outlet[] = [
  {
    id: 'o01', name: 'Kopi Teras Blok M', area: 'Blok M', address: 'Jl. Melawai Raya, Blok M',
    lat: -6.2437, lng: 106.8003, open: '07:00', close: '22:00', flavors: ['cokelat', 'nutty'],
    lessSugar: true, wfc: { plug: true, wifi: true, quiet: false }, rating: 4.6, dailyCap: 30,
    menu: [...baseMenu('o01'), m('o01-v60', 'V60 Gayo Wine', 35000, false)],
  },
  {
    id: 'o02', name: 'Seduh Senja Melawai', area: 'Blok M', address: 'Jl. Melawai IX, Blok M',
    lat: -6.2452, lng: 106.7978, open: '08:00', close: '23:00', flavors: ['fruity'],
    lessSugar: true, wfc: { plug: true, wifi: true, quiet: true }, rating: 4.7, dailyCap: 25,
    menu: [...baseMenu('o02'), m('o02-mb', 'Manual Brew Kintamani', 30000)],
  },
  {
    id: 'o03', name: 'Ruang Tumbuk Panglima Polim', area: 'Blok M', address: 'Jl. Panglima Polim, Kebayoran Baru',
    lat: -6.2470, lng: 106.8030, open: '06:30', close: '21:00', flavors: ['nutty'],
    lessSugar: false, wfc: { plug: false, wifi: true, quiet: false }, rating: 4.4, dailyCap: 40,
    menu: baseMenu('o03'),
  },
  {
    id: 'o04', name: 'Kopi Lajur Senopati', area: 'Senopati', address: 'Jl. Senopati, Kebayoran Baru',
    lat: -6.2315, lng: 106.8095, open: '07:00', close: '22:00', flavors: ['fruity', 'cokelat'],
    lessSugar: true, wfc: { plug: true, wifi: true, quiet: false }, rating: 4.5, dailyCap: 30,
    menu: [...baseMenu('o04'), m('o04-cb', 'Cold Brew Toraja', 30000)],
  },
  {
    id: 'o05', name: 'Biji Sembilan Suryo', area: 'Senopati', address: 'Jl. Suryo, Kebayoran Baru',
    lat: -6.2338, lng: 106.8128, open: '08:00', close: '22:00', flavors: ['cokelat'],
    lessSugar: true, wfc: { plug: true, wifi: false, quiet: true }, rating: 4.3, dailyCap: 20,
    menu: baseMenu('o05'),
  },
  {
    id: 'o06', name: 'Rumah Rantau Gunawarman', area: 'Senopati', address: 'Jl. Gunawarman, Kebayoran Baru',
    lat: -6.2369, lng: 106.8072, open: '09:00', close: '23:00', flavors: ['fruity', 'nutty'],
    lessSugar: false, wfc: { plug: true, wifi: true, quiet: true }, rating: 4.8, dailyCap: 25,
    menu: [...baseMenu('o06'), m('o06-pp', 'Piccolo', 27000)],
  },
  {
    id: 'o07', name: 'Kopi Antara SCBD', area: 'SCBD', address: 'Kawasan SCBD, Senayan',
    lat: -6.2262, lng: 106.8086, open: '06:30', close: '20:00', flavors: ['nutty', 'cokelat'],
    lessSugar: true, wfc: { plug: true, wifi: true, quiet: false }, rating: 4.4, dailyCap: 50,
    menu: baseMenu('o07'),
  },
  {
    id: 'o08', name: 'Tumbuh Coffee Lab Sudirman', area: 'SCBD', address: 'Jl. Jend. Sudirman, Senayan',
    lat: -6.2228, lng: 106.8105, open: '07:00', close: '21:00', flavors: ['fruity'],
    lessSugar: true, wfc: { plug: true, wifi: true, quiet: true }, rating: 4.7, dailyCap: 35,
    menu: [...baseMenu('o08'), m('o08-mb', 'Manual Brew Flores Bajawa', 30000)],
  },
  {
    id: 'o09', name: 'Kedai Pagi Senayan', area: 'SCBD', address: 'Jl. Asia Afrika, Senayan',
    lat: -6.2275, lng: 106.8020, open: '06:00', close: '18:00', flavors: ['cokelat'],
    lessSugar: false, wfc: { plug: false, wifi: false, quiet: false }, rating: 4.2, dailyCap: 40,
    menu: baseMenu('o09'),
  },
  {
    id: 'o10', name: 'Kopi Halte Kuningan', area: 'Kuningan', address: 'Jl. H.R. Rasuna Said, Kuningan',
    lat: -6.2240, lng: 106.8290, open: '06:30', close: '21:00', flavors: ['nutty'],
    lessSugar: true, wfc: { plug: true, wifi: true, quiet: false }, rating: 4.3, dailyCap: 45,
    menu: baseMenu('o10'),
  },
  {
    id: 'o11', name: 'Seruput Rasuna', area: 'Kuningan', address: 'Jl. Epicentrum Tengah, Kuningan',
    lat: -6.2175, lng: 106.8310, open: '08:00', close: '22:00', flavors: ['fruity', 'cokelat'],
    lessSugar: true, wfc: { plug: true, wifi: true, quiet: true }, rating: 4.6, dailyCap: 30,
    menu: [...baseMenu('o11'), m('o11-cb', 'Cold Brew Java Preanger', 30000)],
  },
  {
    id: 'o12', name: 'Kopi Kebun Setiabudi', area: 'Kuningan', address: 'Jl. Setiabudi Tengah, Setiabudi',
    lat: -6.2140, lng: 106.8240, open: '07:00', close: '22:00', flavors: ['nutty', 'cokelat'],
    lessSugar: false, wfc: { plug: true, wifi: true, quiet: false }, rating: 4.4, dailyCap: 30,
    menu: baseMenu('o12'),
  },
  {
    id: 'o13', name: 'Racik Kemang', area: 'Kemang', address: 'Jl. Kemang Raya, Mampang',
    lat: -6.2610, lng: 106.8130, open: '09:00', close: '24:00', flavors: ['fruity'],
    lessSugar: true, wfc: { plug: true, wifi: true, quiet: false }, rating: 4.5, dailyCap: 30,
    menu: [...baseMenu('o13'), m('o13-mb', 'Manual Brew Aceh Gayo', 32000, false)],
  },
  {
    id: 'o14', name: 'Tanah Rasa Cipete', area: 'Kemang', address: 'Jl. Cipete Raya, Cilandak',
    lat: -6.2660, lng: 106.7990, open: '07:30', close: '22:00', flavors: ['cokelat', 'nutty'],
    lessSugar: true, wfc: { plug: true, wifi: true, quiet: true }, rating: 4.6, dailyCap: 25,
    menu: baseMenu('o14'),
  },
];

export const DEFAULT_CENTER: [number, number] = [-6.2365, 106.8120];

export const getOutlet = (id: string) => OUTLETS.find((o) => o.id === id);

export const isOpenNow = (o: Outlet, now = new Date()) => {
  const mins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = o.open.split(':').map(Number);
  const [ch, cm] = o.close.split(':').map(Number);
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
};

export const distanceKm = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
