import { useMemo, useState } from 'react';
import {
  useStore, mitraLogin, mitraLogout, setRole, confirmRedeem, outletToday, outletWeek, outletCap,
  setOutletCap, toggleOutletPause, type ConfirmResult,
} from '../store';
import { OUTLETS, getOutlet } from '../data/outlets';
import { PAYOUT_PER_CUP, rupiah, DEMO_MITRA_PIN } from '../data/plans';
import { IconQr, IconChart, IconSettings, IconCheck, IconX, IconBack, Logo, IconStar } from '../components/Icons';

type Tab = 'tebus' | 'laporan' | 'atur';

export default function Mitra() {
  const s = useStore();
  const outlet = s.mitra.outletId ? getOutlet(s.mitra.outletId) : null;
  const [tab, setTab] = useState<Tab>('tebus');

  if (!outlet) return <MitraLogin />;

  return (
    <div className="app mitra">
      <header className="topbar mitra-bar">
        <div className="brand"><Logo size={28} /><div><b>KopiPass Mitra</b><span>{outlet.name}</span></div></div>
      </header>
      <nav className="nav">
        <button data-testid="mtab-tebus" className={tab === 'tebus' ? 'on' : ''} onClick={() => setTab('tebus')}><IconQr /><span>Tebus</span></button>
        <button data-testid="mtab-laporan" className={tab === 'laporan' ? 'on' : ''} onClick={() => setTab('laporan')}><IconChart /><span>Laporan</span></button>
        <button data-testid="mtab-atur" className={tab === 'atur' ? 'on' : ''} onClick={() => setTab('atur')}><IconSettings /><span>Pengaturan</span></button>
      </nav>
      <main className="content">
        {tab === 'tebus' && <MitraRedeem outletId={outlet.id} />}
        {tab === 'laporan' && <MitraReport outletId={outlet.id} />}
        {tab === 'atur' && <MitraSettings outletId={outlet.id} />}
      </main>
    </div>
  );
}

function MitraLogin() {
  const [outletId, setOutletId] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="onboard" data-testid="mitra-login">
      <button className="icon-btn" onClick={() => setRole('pelanggan')} aria-label="Kembali"><IconBack /></button>
      <div className="onboard-hero left"><Logo size={56} /><h2>Masuk sebagai Mitra</h2><p className="muted">Untuk pemilik dan barista kedai mitra KopiPass.</p></div>
      <label className="field"><span>Kedai</span>
        <select data-testid="mitra-outlet" value={outletId} onChange={(e) => setOutletId(e.target.value)}>
          <option value="">Pilih kedai…</option>
          {OUTLETS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </label>
      <label className="field"><span>PIN staf</span>
        <input data-testid="mitra-pin" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" />
      </label>
      {err && <p className="error">{err}</p>}
      <button className="btn btn-primary btn-block" data-testid="btn-mitra-login" onClick={() => setErr(mitraLogin(outletId, pin) ?? '')}>Masuk</button>
      <div className="demo-note">Mode demo: pilih kedai mana saja, PIN <b>{DEMO_MITRA_PIN}</b></div>
    </div>
  );
}

function MitraRedeem({ outletId }: { outletId: string }) {
  const s = useStore();
  const outlet = getOutlet(outletId)!;
  const core = useMemo(() => outlet.menu.filter((m) => m.core), [outlet]);
  const [code, setCode] = useState('');
  const [menuId, setMenuId] = useState(core[0].id);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const today = outletToday(s, outletId).length;
  const cap = outletCap(s, outletId);

  const submit = () => {
    const r = confirmRedeem(code, outletId, menuId);
    setResult(r);
    if (r.ok) setCode('');
  };

  return (
    <div className="page narrow" data-testid="mitra-redeem">
      <div className="quota-card">
        <div><span className="muted">Tebus hari ini</span><b>{today} / {cap}</b></div>
        <div><span className="muted">Payout per cup</span><b>{rupiah(PAYOUT_PER_CUP)}</b></div>
      </div>
      {s.mitra.paused[outletId] && <div className="result err">KopiPass sedang dinonaktifkan untuk kedai ini. Aktifkan di Pengaturan.</div>}
      <div className="card">
        <h3>Konfirmasi tebus</h3>
        <p className="muted small">Ketik 6 digit kode di bawah QR pelanggan. (Pindai kamera tersedia di versi berikutnya.)</p>
        <input className="otp-input" data-testid="mitra-code" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setResult(null); }} />
        <label className="field"><span>Menu inti yang dipesan</span>
          <select data-testid="mitra-menu" value={menuId} onChange={(e) => setMenuId(e.target.value)}>
            {core.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <button className="btn btn-primary btn-block" data-testid="btn-mitra-confirm" disabled={code.length !== 6} onClick={submit}>Konfirmasi</button>
      </div>
      {result && (
        <div className={`result big ${result.ok ? 'ok' : 'err'}`} data-testid="mitra-result">
          {result.ok ? <IconCheck size={28} /> : <IconX size={28} />}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}

function MitraReport({ outletId }: { outletId: string }) {
  const s = useStore();
  const outlet = getOutlet(outletId)!;
  const today = outletToday(s, outletId);
  const week = outletWeek(s, outletId);
  const cap = outletCap(s, outletId);
  const recent = s.redemptions.filter((r) => r.outletId === outletId).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
  const rated = s.redemptions.filter((r) => r.outletId === outletId && r.rating);
  const avg = rated.length ? rated.reduce((a, r) => a + (r.rating ?? 0), 0) / rated.length : null;
  const nextMonday = new Date(week.since);
  nextMonday.setDate(nextMonday.getDate() + 7);

  return (
    <div className="page narrow" data-testid="mitra-report">
      <h2>Laporan</h2>
      <div className="stat-grid">
        <div className="stat"><span className="muted">Hari ini</span><b>{today.length} cup</b><div className="bar"><span style={{ width: `${Math.min(100, (today.length / cap) * 100)}%` }} /></div><span className="muted small">dari kuota {cap}</span></div>
        <div className="stat"><span className="muted">Minggu ini</span><b>{week.count} cup</b><span className="muted small">sejak {week.since.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span></div>
        <div className="stat accent"><span className="muted">Estimasi payout</span><b>{rupiah(week.payout)}</b><span className="muted small">ditransfer {nextMonday.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span></div>
        <div className="stat"><span className="muted">Rating rasa</span><b>{avg ? avg.toFixed(1) : '–'}</b><span className="muted small">{rated.length} rating dari pelanggan</span></div>
      </div>
      <h3>Tebus terakhir</h3>
      {recent.length === 0 && <p className="muted">Belum ada tebus di {outlet.name}.</p>}
      <ul className="history-list">
        {recent.map((r) => {
          const mi = outlet.menu.find((m) => m.id === r.menuItemId);
          const d = new Date(r.at);
          return (
            <li key={r.id} className="history-item">
              <div><b>{mi?.name}</b><span className="muted small">{d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>
              <span>{r.rating ? <span className="rating"><IconStar size={14} filled /> {r.rating}</span> : <span className="muted small">belum dirating</span>} <b className="small">+{rupiah(PAYOUT_PER_CUP)}</b></span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MitraSettings({ outletId }: { outletId: string }) {
  const s = useStore();
  const outlet = getOutlet(outletId)!;
  const cap = outletCap(s, outletId);
  const paused = !!s.mitra.paused[outletId];
  return (
    <div className="page narrow" data-testid="mitra-settings">
      <h2>Pengaturan kedai</h2>
      <div className="card">
        <div className="row"><div><b>Kuota KopiPass harian</b><span className="muted small">Batas cup KopiPass yang dilayani per hari</span></div>
          <div className="stepper">
            <button onClick={() => setOutletCap(outletId, cap - 5)} aria-label="Kurangi">−</button>
            <b data-testid="cap-value">{cap}</b>
            <button onClick={() => setOutletCap(outletId, cap + 5)} aria-label="Tambah">+</button>
          </div>
        </div>
        <div className="row"><div><b>Terima KopiPass</b><span className="muted small">Matikan sementara saat kedai sangat ramai</span></div>
          <button className={`switch ${paused ? '' : 'on'}`} data-testid="toggle-active" onClick={() => toggleOutletPause(outletId)} aria-label="Terima KopiPass"><span /></button>
        </div>
        <div className="row"><div><b>Jam operasional</b><span className="muted small">Diatur oleh tim KopiPass saat onboarding</span></div><b>{outlet.open}–{outlet.close}</b></div>
      </div>
      <h3>Menu inti</h3>
      <ul className="menu-list card">
        {outlet.menu.map((m) => <li key={m.id} className={m.core ? '' : 'non-core'}><span>{m.name}</span><span>{m.core ? 'Menu inti' : rupiah(m.price)}</span></li>)}
      </ul>
      <div className="btn-row">
        <button className="btn btn-outline" onClick={mitraLogout}>Ganti kedai / keluar</button>
        <button className="btn btn-ghost" data-testid="btn-to-pelanggan" onClick={() => setRole('pelanggan')}>Ke mode pelanggan</button>
      </div>
    </div>
  );
}
