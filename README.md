<p align="center">
  <img src="app/public/icon-512.png" width="96" alt="Logo KopiPass Nusantara">
</p>

<h1 align="center">KopiPass Nusantara</h1>

<p align="center"><b>Satu langganan, ratusan kedai lokal, kopi harian lebih hemat.</b></p>

<p align="center">
  <a href="https://github.com/yudhis7/coffeepassnusantara/actions/workflows/build.yml"><img src="https://github.com/yudhis7/coffeepassnusantara/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20Windows-3b2a20" alt="Platform">
  <img src="https://img.shields.io/badge/status-prototipe-c47f3c" alt="Status">
</p>

<p align="center">
  <b>Project Ideation &amp; Lead: <a href="https://github.com/yudhis7">@yudhis7</a></b>
</p>

---

KopiPass Nusantara adalah langganan bulanan berisi kuota cup kopi yang bisa ditebus di jaringan kedai kopi lokal, dengan harga per cup 28–40% lebih murah dari harga menu. Kedai mitra dibayar Rp14.500 per cup yang ditebus setiap minggu, tanpa biaya bergabung.

| Masalah pelanggan | Jawaban KopiPass |
| --- | --- |
| Kopi harian mahal (Rp25 ribu × 22 hari = Rp550 ribu/bulan) | Paket Harian 22 cup Rp349.000 |
| Promo terpecah di banyak aplikasi brand | Satu aplikasi untuk banyak kedai |
| Sulit memilih di antara ratusan ribu gerai | Peta dengan filter rasa, kadar manis, dan fasilitas kerja |
| Kedai independen kalah promosi | Kedai tampil di peta dan mendapat pelanggan tanpa biaya iklan |

## Tampilan aplikasi

<p align="center">
  <img src="docs/images/01-welcome.png" width="200" alt="Halaman awal Coffee Culture Indonesia">
  <img src="docs/images/04-promo-popup.png" width="200" alt="Pop-up promo dari kedai">
  <img src="docs/images/15-kedaiku-stamps.png" width="200" alt="Kedai andalan, stempel, dan level">
  <img src="docs/images/21-mitra-promo-form.png" width="200" alt="Mitra membuat promo">
</p>
<p align="center">
  <img src="docs/images/26-desktop-map.png" width="820" alt="Tampilan Windows">
</p>

## Unduh

Buka **[Releases](https://github.com/yudhis7/coffeepassnusantara/releases)** dan pilih:

| Platform | File |
| --- | --- |
| Android | `KopiPass-Nusantara-x.y.z-android.apk` |
| Windows (instal) | `KopiPass-Nusantara-Setup-x.y.z.exe` |
| Windows (tanpa instal) | `KopiPass-Nusantara-Portable-x.y.z.exe` |

Cara memasang dan memakai aplikasi ada di **[Panduan Pengguna](docs/USER_GUIDE.md)**.

> Ini prototipe: data tersimpan di perangkat, nama kedai fiktif, dan tidak ada pembayaran sungguhan. OTP demo `123456`, PIN mitra demo `1234`.

## Fitur prototipe

**Pelanggan**
- Halaman awal berisi nilai KopiPass sebagai *coffee culture* Indonesia; jelajah kedai dulu, paket dipilih belakangan
- **Kedai andalan**: berlangganan lewat kedai tertentu, stempel ganda, level member per kedai (Pengunjung → Langganan → Sahabat Kedai), dan cup bonus khusus kedai
- Kartu stempel per kedai dengan hadiah yang diatur kedai
- Peta kedai mitra dengan pin (andalan, promo, tutup), lokasi pengguna, strip promo, pencarian, dan filter (promo, favorit, buka sekarang, rasa, kurang manis, colokan, Wi-Fi, tenang)
- Pop-up promo dari kedai, tab Promo, klaim promo, dan kedai favorit
- QR + kode tebus dinamis yang berganti setiap 30 detik
- Rating rasa, riwayat tebus, pause/batal langganan

**Mitra (kasir dan pemilik kedai)**
- Masuk dengan PIN staf per kedai
- Konfirmasi tebus dengan panel pelanggan: level, badge andalan, cup bonus, hadiah stempel, dan promo yang diklaim
- **Promo kedai**: bonus langganan lewat kedai, diskon member, jam sepi stempel ganda, upgrade gratis; bisa tampil sebagai pop-up, lengkap dengan pratinjau dan statistik
- Daftar pelanggan andalan, pelanggan yang direkrut kedai, dan sebaran level
- Laporan harian/mingguan, estimasi payout (termasuk cup bonus dan bonus rekrut)
- Atur kuota harian, kartu stempel kedai, dan matikan sementara penerimaan KopiPass

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [docs/SOP.md](docs/SOP.md) | SOP dan workflow operasional: onboarding kedai, tebus, payout, kualitas, fraud, CS, promo mitra, kedai andalan |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | Panduan pengguna bergambar untuk pelanggan dan mitra |
| [docs/FRAMEWORK.md](docs/FRAMEWORK.md) | Arsitektur target, model data, pemetaan prototipe ke API |
| [CONTRIBUTORS.md](CONTRIBUTORS.md) | Penggagas dan kontributor |

## Struktur repository

```
coffeepassnusantara/
├── app/                      # Aplikasi (satu basis kode untuk Android, Windows, web)
│   ├── src/                  # React + TypeScript
│   │   ├── screens/          # Layar pelanggan & mitra
│   │   ├── components/       # Peta, ikon, modal rating
│   │   ├── data/             # Data kedai contoh & paket
│   │   └── store.ts          # Mock backend (diganti API asli nanti)
│   ├── android/              # Proyek Android (Capacitor)
│   ├── electron/             # Pembungkus Windows (Electron)
│   └── scripts/              # Screenshot otomatis & pembuat ikon
├── docs/                     # SOP, panduan pengguna, framework, gambar
└── .github/workflows/        # Build APK + installer Windows, screenshot otomatis
```

## Menjalankan dari kode

Butuh Node.js 20+.

```bash
cd app
npm install
npm run dev            # versi web di http://localhost:5173
```

| Target | Perintah | Kebutuhan |
| --- | --- | --- |
| Windows installer | `npm run dist:win` | Dijalankan di Windows |
| Android APK | `npm run android:sync` lalu `cd android && ./gradlew assembleDebug` | Android SDK + Java 17 |
| Screenshot panduan | `npm run build && npm run screenshots` | Playwright Chromium |

Tanpa menyiapkan apa pun di komputer, GitHub Actions membangun APK dan installer Windows setiap ada perubahan di folder `app/`. Untuk membuat rilis baru, naikkan `version` di `app/package.json` (misalnya `0.1.1`) lalu push ke `main`. Rilis beserta file APK dan installer dibuat otomatis. Push tag `v*` juga memicu rilis.

## Roadmap singkat

1. Validasi pasar di klaster Jakarta Selatan (Blok M, Senopati, SCBD, Kuningan)
2. Backend API + integrasi payment gateway
3. Pindai QR dengan kamera dan validasi lokasi di aplikasi mitra
4. Pilot 50 kedai dan 1.000 pelanggan

## Kredit

- **Project Ideation & Lead:** [yudhis7](https://github.com/yudhis7)
- Peta: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ubin standar OSM untuk prototipe; untuk produksi set `VITE_TILE_URL` ke penyedia ubin berlisensi)

## Lisensi

Hak cipta © 2026 yudhis7. Seluruh hak dilindungi. Lisensi open source belum ditetapkan.
