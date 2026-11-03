// Membuat ikon aplikasi (Windows + Android) dan splash Android dari desain logo KopiPass.
// Jalankan: node scripts/make-icons.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readdirSync, existsSync } from 'node:fs';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const res = path.join(appDir, 'android', 'app', 'src', 'main', 'res');

const cup = `
  <path d="M16 26h26v9a11 11 0 0 1-11 11h-4a11 11 0 0 1-11-11v-9Z" fill="#f6efe6"/>
  <path d="M42 29h3a5 5 0 0 1 0 10h-3" stroke="#f6efe6" stroke-width="3.5" fill="none"/>
  <path d="M24 14c-2 3 2 5 0 8M31 14c-2 3 2 5 0 8" stroke="#e0a458" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M22 33h14" stroke="#c47f3c" stroke-width="3" stroke-linecap="round"/>`;

const full = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%"><rect width="64" height="64" rx="${rx}" fill="#3b2a20"/>${cup}</svg>`;
const round = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%"><circle cx="32" cy="32" r="32" fill="#3b2a20"/>${cup}</svg>`;
// Foreground adaptive icon: konten di zona aman (66/108) dengan latar transparan
const fg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-22 -22 108 108" width="100%" height="100%"><g transform="translate(32 32) scale(0.82) translate(-32 -32)">${cup}</g></svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();

async function render(svg, w, h, out, bg = 'transparent', logoSize = null) {
  await page.setViewportSize({ width: w, height: h });
  const inner = logoSize
    ? `<div style="width:${logoSize}px;height:${logoSize}px">${svg}</div><div style="margin-top:${Math.round(logoSize * 0.18)}px;font:700 ${Math.round(logoSize * 0.2)}px system-ui,sans-serif;color:#3b2a20">KopiPass Nusantara</div>`
    : svg;
  await page.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center">${inner}</body></html>`);
  await page.screenshot({ path: out, omitBackground: bg === 'transparent' });
  console.log('icon', path.relative(appDir, out), `${w}x${h}`);
}

await render(full(14), 512, 512, path.join(appDir, 'build', 'icon.png'));
await render(full(14), 512, 512, path.join(appDir, 'public', 'icon-512.png'));

if (existsSync(res)) {
  const dens = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [d, s] of Object.entries(dens)) {
    await render(full(14), s, s, path.join(res, `mipmap-${d}`, 'ic_launcher.png'));
    await render(round, s, s, path.join(res, `mipmap-${d}`, 'ic_launcher_round.png'));
    await render(fg, Math.round(s * 2.25), Math.round(s * 2.25), path.join(res, `mipmap-${d}`, 'ic_launcher_foreground.png'));
  }
  const splashDirs = readdirSync(res).filter((d) => d.startsWith('drawable'));
  const sizes = {
    'drawable': [480, 320], 'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480],
    'drawable-land-xhdpi': [1280, 720], 'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280],
    'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280],
    'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
  };
  for (const d of splashDirs) {
    if (!sizes[d] || !existsSync(path.join(res, d, 'splash.png'))) continue;
    const [w, h] = sizes[d];
    await render(full(14), w, h, path.join(res, d, 'splash.png'), '#f6efe6', Math.round(Math.min(w, h) * 0.28));
  }
}
await browser.close();
