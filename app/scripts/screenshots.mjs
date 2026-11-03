// Mengambil screenshot untuk docs/USER_GUIDE.md dengan menjalankan alur aplikasi dari awal.
// Jalankan: npm run build && npm run screenshots
// Opsi: MOCK_TILES=1 (ganti ubin peta dengan warna polos bila tidak ada internet)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, '..');
const outDir = path.resolve(appDir, '..', 'docs', 'images');
mkdirSync(outDir, { recursive: true });
// Hapus screenshot lama agar tidak ada gambar usang di panduan
for (const f of readdirSync(outDir)) if (f.endsWith('.png')) rmSync(path.join(outDir, f));

const PORT = 4173;
const URL = `http://localhost:${PORT}/`;
const MOCK = process.env.MOCK_TILES === '1';
// 1x1 PNG warna krem untuk mode tanpa internet
const TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN4/fQOAAVrAq3tBLstAAAAAElFTkSuQmCC', 'base64');

const viteBin = path.join(appDir, 'node_modules', 'vite', 'bin', 'vite.js');
const server = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort'], { cwd: appDir, stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('vite preview tidak menyala')), 30000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); resolve(); } });
});

const FIXED_TIME = new Date('2026-11-04T09:30:00+07:00');
const browser = await chromium.launch();

async function newContext(viewport, extra = {}) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    geolocation: { latitude: -6.2342, longitude: 106.8098 },
    permissions: ['geolocation'],
    ...extra,
  });
  if (MOCK) await ctx.route(/tile\.openstreetmap\.org/, (r) => r.fulfill({ contentType: 'image/png', body: TILE }));
  return ctx;
}

const settle = async (page, ms = 900) => {
  try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch { /* lanjut */ }
  await page.waitForTimeout(ms);
};
const shot = async (page, name, opts = {}) => {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), ...opts });
  console.log('📸', name);
};
const tid = (page, id) => page.getByTestId(id);
const top = (page) => page.evaluate(() => { document.querySelector('.content')?.scrollTo(0, 0); window.scrollTo(0, 0); });

try {
  // ================= Pelanggan (ponsel) =================
  const ctx = await newContext({ width: 390, height: 844 });
  const page = await ctx.newPage();
  await page.clock.setSystemTime(FIXED_TIME);
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // 1. Halaman awal: nilai KopiPass sebagai Coffee Culture Indonesia (satu halaman penuh)
  await tid(page, 'welcome').waitFor();
  await shot(page, '01-welcome', { fullPage: true });

  await tid(page, 'btn-start').click();
  await tid(page, 'input-name').fill('Yudhis');
  await tid(page, 'input-phone').fill('81234567890');
  await shot(page, '02-login');
  await tid(page, 'btn-send-otp').click();
  await tid(page, 'input-otp').fill('123456');
  await shot(page, '03-otp');
  await tid(page, 'btn-verify').click();

  // 2. Langsung menjelajah; pop-up promo dari kedai mitra muncul
  await tid(page, 'promo-popup').waitFor();
  await settle(page, 1200);
  await shot(page, '04-promo-popup');

  // 3. Langganan lewat kedai (dari pop-up) — kedai otomatis jadi kedai andalan + cup bonus
  await tid(page, 'popup-primary').click();
  await tid(page, 'plans').waitFor();
  await shot(page, '05-plans');
  await tid(page, 'plan-harian').click();
  await tid(page, 'checkout').waitFor();
  await shot(page, '06-checkout');
  await tid(page, 'btn-pay').click();
  await tid(page, 'kedaiku').waitFor();
  await shot(page, '07-kedaiku');

  // 4. Jelajah peta: promo, kedai andalan, filter
  await tid(page, 'tab-peta').click();
  await tid(page, 'home').waitFor();
  await tid(page, 'btn-locate').click();
  await settle(page, 1500);
  await shot(page, '08-map');

  await tid(page, 'outlet-o06').click();
  await tid(page, 'outlet-sheet').waitFor();
  await settle(page, 1200);
  await shot(page, '09-outlet-detail');
  await tid(page, 'promo-claim-p-seed-2').click();
  await tid(page, 'outlet-sheet').evaluate((el) => el.scrollTo(0, 0));

  // 5. Tab Promo
  await tid(page, 'tab-promo').click();
  await tid(page, 'promos').waitFor();
  await shot(page, '10-promos');

  // 6. Tebus di kedai (dengan promo yang sudah diklaim)
  await tid(page, 'tab-peta').click();
  await tid(page, 'outlet-o06').click();
  await tid(page, 'btn-redeem-here').click();
  await tid(page, 'qr').waitFor();
  await page.waitForTimeout(300);
  await shot(page, '11-redeem-qr');

  await tid(page, 'btn-sim-kasir').click();
  await tid(page, 'kasir-sim').waitFor();
  await tid(page, 'chk-promo-p-seed-2').check();
  await shot(page, '12-kasir-sim');
  await tid(page, 'btn-sim-confirm').click();
  await tid(page, 'redeem-success').waitFor({ timeout: 5000 });
  await page.waitForTimeout(300);
  await shot(page, '13-redeem-success', { fullPage: false });

  await tid(page, 'btn-rate-now').click();
  await tid(page, 'star-5').click();
  await page.getByRole('button', { name: 'Mantap' }).click();
  await shot(page, '14-rating');
  await tid(page, 'btn-send-rating').click();

  // 7. Kedaiku setelah beberapa kunjungan (riwayat contoh): level, stempel, hadiah siap
  await tid(page, 'tab-akun').click();
  await tid(page, 'btn-seed').click();
  await shot(page, '16-account');
  await tid(page, 'tab-kedaiku').click();
  await top(page);
  await shot(page, '15-kedaiku-stamps');

  // Kode tebus untuk didemokan di aplikasi kasir
  await tid(page, 'tab-tebus').click();
  await tid(page, 'redeem-code').waitFor();
  const code = (await tid(page, 'redeem-code').innerText()).replace(/\s/g, '');

  // ================= Mitra / kasir (ponsel) =================
  await tid(page, 'tab-akun').click();
  await tid(page, 'btn-switch-mitra').click();
  await tid(page, 'mitra-login').waitFor();
  await tid(page, 'mitra-outlet').selectOption('o02');
  await tid(page, 'mitra-pin').fill('1234');
  await shot(page, '17-mitra-login');

  await tid(page, 'btn-mitra-login').click();
  await tid(page, 'mitra-redeem').waitFor();
  await tid(page, 'mitra-code').fill(code);
  await tid(page, 'customer-panel').waitFor();
  await tid(page, 'chk-reward').check();
  await shot(page, '18-mitra-customer');
  await tid(page, 'btn-mitra-confirm').click();
  await tid(page, 'mitra-result').waitFor();
  await shot(page, '19-mitra-confirm');

  await tid(page, 'mtab-promo').click();
  await tid(page, 'mitra-promo').waitFor();
  await shot(page, '20-mitra-promo');

  await tid(page, 'btn-new-promo').click();
  await tid(page, 'pf-kind').selectOption('happyhour');
  await page.getByRole('button', { name: 'Isi dengan contoh' }).click();
  await tid(page, 'promo-form').evaluate(() => document.querySelector('.content')?.scrollTo(0, 99999));
  await page.waitForTimeout(200);
  await shot(page, '21-mitra-promo-form');
  await tid(page, 'pf-save').click();

  await tid(page, 'mtab-pelanggan').click();
  await tid(page, 'mitra-customers').waitFor();
  await shot(page, '22-mitra-customers');

  await tid(page, 'mtab-laporan').click();
  await shot(page, '23-mitra-report');

  await tid(page, 'mtab-atur').click();
  await tid(page, 'loyalty-settings').scrollIntoViewIfNeeded();
  await shot(page, '24-mitra-settings');

  await tid(page, 'btn-to-pelanggan').click();
  const storage = await ctx.storageState();
  await ctx.close();

  // ================= Desktop (tampilan Windows) =================
  const dctx = await newContext({ width: 1366, height: 820 }, { storageState: storage });
  const dpage = await dctx.newPage();
  await dpage.clock.setSystemTime(FIXED_TIME);
  await dpage.goto(URL);
  await tid(dpage, 'home').waitFor();
  await settle(dpage, 1200);
  if (await tid(dpage, 'promo-popup').isVisible()) {
    await shot(dpage, '25-desktop-popup');
    await tid(dpage, 'popup-later').click();
  }
  await tid(dpage, 'btn-locate').click();
  await settle(dpage, 1200);
  await tid(dpage, 'outlet-o02').click();
  await settle(dpage, 1500);
  await shot(dpage, '26-desktop-map');

  await tid(dpage, 'tab-kedaiku').click();
  await dpage.waitForTimeout(300);
  await shot(dpage, '27-desktop-kedaiku');
  await dctx.close();
} finally {
  await browser.close();
  server.kill();
}
process.exit(0);
