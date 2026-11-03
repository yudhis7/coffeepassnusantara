// Mengambil screenshot untuk docs/USER_GUIDE.md dengan menjalankan alur aplikasi dari awal.
// Jalankan: npm run build && npm run screenshots
// Opsi: MOCK_TILES=1 (ganti ubin peta dengan warna polos bila tidak ada internet)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, '..');
const outDir = path.resolve(appDir, '..', 'docs', 'images');
mkdirSync(outDir, { recursive: true });

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
const shot = async (page, name) => {
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  console.log('📸', name);
};
const tid = (page, id) => page.getByTestId(id);

try {
  // ================= Pelanggan (ponsel) =================
  const ctx = await newContext({ width: 390, height: 844 });
  const page = await ctx.newPage();
  await page.clock.setSystemTime(FIXED_TIME);
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await tid(page, 'welcome').waitFor();
  await shot(page, '01-welcome');

  await tid(page, 'btn-start').click();
  await tid(page, 'input-name').fill('Yudhis');
  await tid(page, 'input-phone').fill('81234567890');
  await shot(page, '02-login');

  await tid(page, 'btn-send-otp').click();
  await tid(page, 'input-otp').fill('123456');
  await shot(page, '03-otp');

  await tid(page, 'btn-verify').click();
  await tid(page, 'plans').waitFor();
  await shot(page, '04-plans');

  await tid(page, 'plan-harian').click();
  await tid(page, 'checkout').waitFor();
  await shot(page, '05-checkout');

  await tid(page, 'btn-pay').click();
  await tid(page, 'home').waitFor();
  await settle(page, 1500);
  await shot(page, '06-home-map');

  await tid(page, 'btn-locate').click();
  await settle(page, 1200);
  await tid(page, 'filter-fruity').click();
  await tid(page, 'filter-plug').click();
  await settle(page, 600);
  await shot(page, '07-filter');

  await tid(page, 'outlet-o02').click();
  await tid(page, 'outlet-sheet').waitFor();
  await settle(page, 1200);
  await shot(page, '08-outlet-detail');

  await tid(page, 'btn-redeem-here').click();
  await tid(page, 'qr').waitFor();
  await page.waitForTimeout(400);
  await shot(page, '09-redeem-qr');

  await tid(page, 'btn-sim-kasir').click();
  await tid(page, 'kasir-sim').waitFor();
  await shot(page, '10-kasir-sim');

  await tid(page, 'btn-sim-confirm').click();
  await tid(page, 'redeem-success').waitFor({ timeout: 5000 });
  await page.waitForTimeout(300);
  await shot(page, '11-redeem-success');

  await tid(page, 'btn-rate-now').click();
  await tid(page, 'star-5').click();
  await page.getByRole('button', { name: 'Mantap' }).click();
  await shot(page, '12-rating');
  await tid(page, 'btn-send-rating').click();

  await tid(page, 'tab-akun').click();
  await tid(page, 'btn-seed').click();
  await tid(page, 'tab-riwayat').click();
  await tid(page, 'history').waitFor();
  await shot(page, '13-history');

  await tid(page, 'tab-akun').click();
  await shot(page, '14-account');

  // Ambil kode tebus baru untuk didemokan di aplikasi kasir
  await tid(page, 'tab-tebus').click();
  await tid(page, 'redeem-code').waitFor();
  const code = (await tid(page, 'redeem-code').innerText()).replace(/\s/g, '');

  // ================= Mitra / kasir (ponsel) =================
  await tid(page, 'tab-akun').click();
  await tid(page, 'btn-switch-mitra').click();
  await tid(page, 'mitra-login').waitFor();
  await tid(page, 'mitra-outlet').selectOption('o08');
  await tid(page, 'mitra-pin').fill('1234');
  await shot(page, '15-mitra-login');

  await tid(page, 'btn-mitra-login').click();
  await tid(page, 'mitra-redeem').waitFor();
  await tid(page, 'mitra-code').fill(code);
  await tid(page, 'btn-mitra-confirm').click();
  await tid(page, 'mitra-result').waitFor();
  await shot(page, '16-mitra-confirm');

  await tid(page, 'mtab-laporan').click();
  await shot(page, '17-mitra-report');

  await tid(page, 'mtab-atur').click();
  await shot(page, '18-mitra-settings');

  await tid(page, 'btn-to-pelanggan').click();
  const storage = await ctx.storageState();
  await ctx.close();

  // ================= Desktop (tampilan Windows) =================
  const dctx = await newContext({ width: 1366, height: 820 }, { storageState: storage });
  const dpage = await dctx.newPage();
  await dpage.clock.setSystemTime(FIXED_TIME);
  await dpage.goto(URL);
  await tid(dpage, 'home').waitFor();
  await tid(dpage, 'btn-locate').click();
  await settle(dpage, 1200);
  await tid(dpage, 'outlet-o06').click();
  await settle(dpage, 1500);
  await shot(dpage, '19-desktop-map');

  await tid(dpage, 'tab-riwayat').click();
  await dpage.waitForTimeout(300);
  await shot(dpage, '20-desktop-history');
  await dctx.close();
} finally {
  await browser.close();
  server.kill();
}
process.exit(0);
