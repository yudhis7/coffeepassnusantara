import { useEffect, useMemo, useState } from 'react';
import {
  useStore, mitraLogin, mitraLogout, setRole, confirmRedeem, outletToday, outletWeek, outletCap, customerContext,
  setOutletCap, toggleOutletPause, savePromo, togglePromoActive, deletePromo, loyaltyOf, setLoyalty, levelAt,
  type ConfirmResult,
} from '../store';
import { OUTLETS, getOutlet } from '../data/outlets';
import { PAYOUT_PER_CUP, REFERRAL_BONUS, rupiah, DEMO_MITRA_PIN, LEVELS } from '../data/plans';
import { PROMO_KINDS, AUDIENCE_LABEL, KIND_LABEL, type Promo, type PromoKind, type PromoAudience } from '../data/promos';
import { sampleMembers } from '../data/members';
import {
  IconQr, IconChart, IconSettings, IconCheck, IconX, IconBack, Logo, IconStar, IconMegaphone, IconUsers, IconGift, IconHome,
} from '../components/Icons';
import { CustomerPanel } from './Redeem';
import { fmtDate } from '../components/PromoCard';

type Tab = 'tebus' | 'promo' | 'pelanggan' | 'laporan' | 'atur';

export default function Mitra() {
  const s = useStore();
  const outlet = s.mitra.outletId ? getOutlet(s.mitra.outletId) : null;
  const [tab, setTab] = useState<Tab>('tebus');
  useEffect(() => { document.querySelector('.content')?.scrollTo(0, 0); }, [tab]);

  if (!outlet) return <MitraLogin />;

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: 'tebus', label: 'Tebus', icon: <IconQr /> },
    { key: 'promo', label: 'Promo', icon: <IconMegaphone /> },
    { key: 'pelanggan', label: 'Pelanggan', icon: <IconUsers /> },
    { key: 'laporan', label: 'Laporan', icon: <IconChart /> },
    { key: 'atur', label: 'Atur', icon: <IconSettings /> },
  ];

  return (
    <div className="app mitra">
      <header className="topbar mitra-bar">
        <div className="brand"><Logo size={28} /><div><b>KopiPass Mitra</b><span>{outlet.name}</span></div></div>
      </header>
      <nav className="nav">
        {tabs.map((t) => (
          <button key={t.key} data-testid={`mtab-${t.key}`} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.icon}<span>{t.label}</span></button>
        ))}
      </nav>
      <main className="content">
        {tab === 'tebus' && <MitraRedeem outletId={outlet.id} />}
        {tab === 'promo' && <MitraPromo outletId={outlet.id} />}
        {tab === 'pelanggan' && <MitraCustomers outletId={outlet.id} />}
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

// ---------------- Tebus ----------------
function MitraRedeem({ outletId }: { outletId: string }) {
  const s = useStore();
  const outlet = getOutlet(outletId)!;
  const core = useMemo(() => outlet.menu.filter((m) => m.core), [outlet]);
  const [code, setCode] = useState('');
  const [menuId, setMenuId] = useState(core[0].id);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [useReward, setUseReward] = useState(false);
  const [promoId, setPromoId] = useState<string | undefined>(undefined);
  const today = outletToday(s, outletId).length;
  const cap = outletCap(s, outletId);
  const ctx = code.length === 6 ? customerContext(code, outletId) : null;

  const submit = () => {
    const r = confirmRedeem(code, outletId, menuId, { promoId, useReward });
    setResult(r);
    if (r.ok) { setCode(''); setUseReward(false); setPromoId(undefined); }
  };

  return (
    <div className="page narrow" data-testid="mitra-redeem">
      <div className="quota-card">
        <div><span className="muted">Tebus hari ini</span><b>{today} / {cap}</b></div>
        <div><span className="muted">Payout per cup</span><b>{rupiah(PAYOUT_PER_CUP)}</b></div>
      </div>
      {s.mitra.paused[outletId] && <div className="result err">KopiPass sedang dinonaktifkan untuk kedai ini. Aktifkan di Atur.</div>}
      <div className="card">
        <h3>Konfirmasi tebus</h3>
        <p className="muted small">Ketik 6 digit kode di bawah QR pelanggan. Info level, kedai andalan, hadiah stempel, dan promo pelanggan muncul otomatis.</p>
        <input className="otp-input" data-testid="mitra-code" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setResult(null); }} />
        {ctx && <CustomerPanel ctx={ctx} useReward={useReward} setUseReward={setUseReward} promoId={promoId} setPromoId={setPromoId} />}
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

// ---------------- Promo ----------------
const in30 = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };

function MitraPromo({ outletId }: { outletId: string }) {
  const s = useStore();
  const outlet = getOutlet(outletId)!;
  const mine = s.promos.filter((p) => p.outletId === outletId);
  const [editing, setEditing] = useState<Partial<Promo> | null>(null);

  if (editing) return <PromoForm outletId={outletId} initial={editing} onDone={() => setEditing(null)} />;

  return (
    <div className="page narrow" data-testid="mitra-promo">
      <h2>Promo kedai</h2>
      <p className="muted">Buat promo untuk menarik pelanggan berlangganan lewat {outlet.name}, mengisi jam sepi, atau memanjakan pelanggan andalan. Promo bisa tampil sebagai pop-up di aplikasi pelanggan.</p>
      <button className="btn btn-primary btn-block" data-testid="btn-new-promo" onClick={() => setEditing({ kind: 'langganan', audience: 'baru', popup: true, active: true, validUntil: in30(), bonusCups: 2 })}>
        <IconMegaphone size={18} /> Buat promo baru
      </button>
      <h3>Promo aktif & draf</h3>
      {mine.length === 0 && <p className="muted">Belum ada promo. Mulai dengan bonus langganan: cara paling efektif mengikat pelanggan ke kedaimu.</p>}
      <ul className="mpromo-list">
        {mine.map((p) => (
          <li key={p.id} className="mpromo" data-testid={`mpromo-${p.id}`}>
            <div className="mp-top">
              <span className="pc-kind">{KIND_LABEL[p.kind]}</span>
              <button className={`switch ${p.active ? 'on' : ''}`} onClick={() => togglePromoActive(p.id)} aria-label="Aktif"><span /></button>
            </div>
            <b>{p.title}</b>
            <div className="mp-meta">
              {p.popup && <span className="pill">Pop-up</span>}
              <span className="pill">{p.audience === 'semua' ? 'Semua' : p.audience === 'andalan' ? 'Pelanggan andalan' : 'Calon pelanggan'}</span>
              <span className="muted small">s/d {fmtDate(p.validUntil)}</span>
            </div>
            <div className="mp-stats">
              <span><b>{p.views}</b> dilihat</span>
              <span><b>{p.claims}</b> {p.kind === 'langganan' ? 'langganan' : 'diklaim'}</span>
              <span className={p.active ? 'ok' : 'muted'}>{p.active ? 'Aktif' : 'Nonaktif'}</span>
            </div>
            <div className="btn-row">
              <button className="btn btn-sm btn-outline" onClick={() => setEditing(p)}>Ubah</button>
              <button className="btn btn-sm btn-ghost danger" onClick={() => deletePromo(p.id)}>Hapus</button>
            </div>
          </li>
        ))}
      </ul>
      <p className="muted small">Aturan: promo ditanggung kedai, minuman tetap sesuai standar, dan maksimal 1 pop-up aktif per kedai. Tim KopiPass meninjau promo baru dalam 1 hari kerja (lihat SOP-11).</p>
    </div>
  );
}

function PromoForm({ outletId, initial, onDone }: { outletId: string; initial: Partial<Promo>; onDone: () => void }) {
  const s = useStore();
  const outlet = getOutlet(outletId)!;
  const [kind, setKind] = useState<PromoKind>(initial.kind ?? 'langganan');
  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [audience, setAudience] = useState<PromoAudience>(initial.audience ?? 'semua');
  const [popup, setPopup] = useState(initial.popup ?? false);
  const [validUntil, setValidUntil] = useState(initial.validUntil ?? in30());
  const [bonusCups, setBonusCups] = useState(initial.bonusCups ?? 2);
  const [startHour, setStartHour] = useState(initial.startHour ?? 14);
  const [endHour, setEndHour] = useState(initial.endHour ?? 17);
  const help = PROMO_KINDS.find((k) => k.kind === kind)!.help;
  const otherPopup = s.promos.some((p) => p.outletId === outletId && p.popup && p.active && p.id !== initial.id);

  const suggestions: Record<PromoKind, [string, string]> = {
    langganan: [`Langganan lewat ${outlet.name}, bonus ${bonusCups} cup`, `Pilih ${outlet.name} sebagai kedai andalan saat berlangganan dan dapatkan ${bonusCups} cup bonus di kedai kami.`],
    diskon: ['Diskon 20% pastry untuk member', 'Tunjukkan promo ini saat membeli pastry atau biji kopi.'],
    happyhour: [`Stempel ganda jam ${startHour}.00–${endHour}.00`, `Tebus di ${outlet.name} pada jam ini untuk stempel tambahan.`],
    gratis: ['Gratis size up', 'Upgrade ukuran minuman tanpa biaya tambahan saat menebus di kedai kami.'],
  };
  const valid = title.trim().length >= 5 && validUntil >= new Date().toISOString().slice(0, 10);

  const submit = () => {
    savePromo({
      id: initial.id, outletId, kind, title: title.trim(), description: description.trim(),
      audience: kind === 'langganan' ? 'baru' : audience,
      popup: popup && !otherPopup, active: initial.active ?? true, validUntil,
      bonusCups: kind === 'langganan' ? bonusCups : undefined,
      startHour: kind === 'happyhour' ? startHour : undefined,
      endHour: kind === 'happyhour' ? endHour : undefined,
    });
    onDone();
  };

  return (
    <div className="page narrow" data-testid="promo-form">
      <button className="icon-btn" onClick={onDone} aria-label="Kembali"><IconBack /></button>
      <h2>{initial.id ? 'Ubah promo' : 'Promo baru'}</h2>
      <label className="field"><span>Jenis promo</span>
        <select data-testid="pf-kind" value={kind} onChange={(e) => setKind(e.target.value as PromoKind)}>
          {PROMO_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
        </select>
      </label>
      <p className="muted small">{help}</p>
      {kind === 'langganan' && (
        <div className="row"><div><b>Cup bonus</b><span className="muted small">Hanya bisa ditebus di kedaimu, tanpa payout</span></div>
          <div className="stepper"><button onClick={() => setBonusCups(Math.max(1, bonusCups - 1))}>−</button><b data-testid="pf-bonus">{bonusCups}</b><button onClick={() => setBonusCups(Math.min(5, bonusCups + 1))}>+</button></div>
        </div>
      )}
      {kind === 'happyhour' && (
        <div className="row"><b>Jam berlaku</b>
          <div className="hours">
            <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}.00</option>)}</select>
            <span>–</span>
            <select value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h + 1}>{String(h + 1).padStart(2, '0')}.00</option>)}</select>
          </div>
        </div>
      )}
      <label className="field"><span>Judul</span>
        <input data-testid="pf-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder={suggestions[kind][0]} />
      </label>
      <label className="field"><span>Deskripsi</span>
        <textarea data-testid="pf-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder={suggestions[kind][1]} />
      </label>
      <button className="link small" onClick={() => { setTitle(suggestions[kind][0]); setDescription(suggestions[kind][1]); }}>Isi dengan contoh</button>
      {kind !== 'langganan' && (
        <label className="field"><span>Ditujukan untuk</span>
          <select data-testid="pf-audience" value={audience} onChange={(e) => setAudience(e.target.value as PromoAudience)}>
            {(['semua', 'andalan'] as PromoAudience[]).map((a) => <option key={a} value={a}>{AUDIENCE_LABEL[a]}</option>)}
          </select>
        </label>
      )}
      <label className="field"><span>Berlaku sampai</span>
        <input type="date" data-testid="pf-until" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
      </label>
      <div className="row"><div><b>Tampilkan sebagai pop-up</b><span className="muted small">{otherPopup ? 'Kedaimu sudah punya pop-up aktif lain' : 'Muncul sekali saat pelanggan membuka aplikasi'}</span></div>
        <button className={`switch ${popup && !otherPopup ? 'on' : ''}`} data-testid="pf-popup" disabled={otherPopup} onClick={() => setPopup(!popup)} aria-label="Pop-up"><span /></button>
      </div>

      <h4>Pratinjau di aplikasi pelanggan</h4>
      <div className="preview" data-testid="pf-preview">
        <div className="popup-hero sm"><IconGift size={26} /><span>{KIND_LABEL[kind]}</span></div>
        <p className="eyebrow center">Dari {outlet.name}</p>
        <b>{title || suggestions[kind][0]}</b>
        <p className="muted small">{description || suggestions[kind][1]}</p>
      </div>
      <button className="btn btn-primary btn-block" data-testid="pf-save" disabled={!valid} onClick={submit}>{initial.id ? 'Simpan perubahan' : 'Terbitkan promo'}</button>
    </div>
  );
}

// ---------------- Pelanggan ----------------
function MitraCustomers({ outletId }: { outletId: string }) {
  const s = useStore();
  const samples = sampleMembers(outletId);
  const real = s.user && (s.homeOutletId === outletId || s.redemptions.some((r) => r.outletId === outletId))
    ? [{ name: s.user.name + ' (akun demo)', cups: levelAt(s, outletId).cups, home: s.homeOutletId === outletId, viaOutlet: s.subscription?.viaOutletId === outletId, lastVisitDaysAgo: 0 }]
    : [];
  const members = [...real, ...samples].sort((a, b) => b.cups - a.cups);
  const lvlIdx = (c: number) => LEVELS.reduce((idx, l, i) => (c >= l.min ? i : idx), 0);
  const homeCount = members.filter((m) => m.home).length;
  const viaCount = members.filter((m) => m.viaOutlet).length;

  return (
    <div className="page narrow" data-testid="mitra-customers">
      <h2>Pelanggan kedai</h2>
      <div className="stat-grid">
        <div className="stat"><span className="muted">Pelanggan andalan</span><b>{homeCount}</b><span className="muted small">memilih kedaimu sebagai andalan</span></div>
        <div className="stat accent"><span className="muted">Direkrut kedaimu</span><b>{viaCount}</b><span className="muted small">bonus rekrut {rupiah(REFERRAL_BONUS)}/orang</span></div>
        {LEVELS.slice(1).map((l, i) => (
          <div className="stat" key={l.name}><span className="muted">Level {l.name}</span><b>{members.filter((m) => lvlIdx(m.cups) === i + 1).length}</b><span className="muted small">≥ {l.min} cup di kedaimu</span></div>
        ))}
      </div>
      <h3>Daftar pelanggan</h3>
      <ul className="history-list">
        {members.map((m, i) => {
          const idx = lvlIdx(m.cups);
          return (
            <li key={i} className="history-item">
              <div>
                <b>{m.name}</b>
                <span className="muted small">{m.cups} cup · terakhir {m.lastVisitDaysAgo === 0 ? 'hari ini' : `${m.lastVisitDaysAgo} hari lalu`}{m.viaOutlet ? ' · direkrut kedaimu' : ''}</span>
              </div>
              <span className="cust-tags">
                {m.home && <span className="level level-2"><IconHome size={12} /> Andalan</span>}
                <span className={`level level-${idx}`}>{LEVELS[idx].name}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="demo-note small">Nama selain akun demo adalah contoh fiktif.</p>
    </div>
  );
}

// ---------------- Laporan ----------------
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
        <div className="stat"><span className="muted">Minggu ini</span><b>{week.count} cup</b><span className="muted small">{week.bonusCount} cup bonus kedai · sejak {week.since.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>
        <div className="stat accent"><span className="muted">Estimasi payout</span><b>{rupiah(week.payout)}</b><span className="muted small">{week.referral ? `termasuk bonus rekrut ${rupiah(week.referral)} · ` : ''}ditransfer {nextMonday.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span></div>
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
              <div><b>{mi?.name}</b><span className="muted small">{d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · +{r.stamps ?? 1} stempel{r.promoId ? ' · promo' : ''}{r.rewardUsed ? ' · hadiah' : ''}</span></div>
              <span>{r.rating ? <span className="rating"><IconStar size={14} filled /> {r.rating}</span> : null} <b className="small">{r.scoped ? 'cup bonus' : `+${rupiah(r.payout ?? PAYOUT_PER_CUP)}`}</b></span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------- Pengaturan ----------------
function MitraSettings({ outletId }: { outletId: string }) {
  const s = useStore();
  const outlet = getOutlet(outletId)!;
  const cap = outletCap(s, outletId);
  const paused = !!s.mitra.paused[outletId];
  const loy = loyaltyOf(s, outletId);
  const [reward, setReward] = useState(loy.reward);
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

      <h3>Kartu stempel kedai</h3>
      <div className="card" data-testid="loyalty-settings">
        <div className="row"><div><b>Stempel untuk 1 hadiah</b><span className="muted small">Pelanggan andalan mendapat 2 stempel per tebus</span></div>
          <div className="stepper">
            <button onClick={() => setLoyalty(outletId, loy.target - 1, loy.reward)} aria-label="Kurangi">−</button>
            <b>{loy.target}</b>
            <button onClick={() => setLoyalty(outletId, loy.target + 1, loy.reward)} aria-label="Tambah">+</button>
          </div>
        </div>
        <label className="field"><span>Hadiah (ditanggung kedai)</span>
          <input value={reward} onChange={(e) => setReward(e.target.value)} onBlur={() => setLoyalty(outletId, loy.target, reward.trim() || loy.reward)} maxLength={40} />
        </label>
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
