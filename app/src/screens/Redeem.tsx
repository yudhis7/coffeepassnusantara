import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore, canRedeem, createToken, quotaLeft, cupsToday, confirmRedeem, type RedeemToken, type ConfirmResult } from '../store';
import { OUTLETS, getOutlet } from '../data/outlets';
import { MAX_CUPS_PER_DAY, TOKEN_TTL_SECONDS } from '../data/plans';
import { IconCheck, IconX, IconStore } from '../components/Icons';
import RatingModal from '../components/RatingModal';

export default function Redeem({ outletHint }: { outletHint: string | null }) {
  const s = useStore();
  const blocked = canRedeem(s);
  const [token, setToken] = useState<RedeemToken | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showKasir, setShowKasir] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [ratingFor, setRatingFor] = useState<string | null>(null);

  // QR dinamis: buat token baru setiap 30 detik
  useEffect(() => {
    if (blocked || doneId) return;
    if (!token || token.expiresAt <= now) setToken(createToken());
  }, [blocked, token, now, doneId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Deteksi token yang sudah ditebus (oleh kasir di tab/perangkat lain atau simulasi)
  const live = token ? s.tokens.find((t) => t.code === token.code) : undefined;
  useEffect(() => {
    if (live?.used && live.redemptionId && !doneId) setDoneId(live.redemptionId);
  }, [live, doneId]);

  const remaining = token ? Math.max(0, Math.ceil((token.expiresAt - now) / 1000)) : 0;
  const pct = remaining / TOKEN_TTL_SECONDS;
  const quota = quotaLeft(s);
  const today = cupsToday(s);

  const done = doneId ? s.redemptions.find((r) => r.id === doneId) : null;
  const doneOutlet = done ? getOutlet(done.outletId) : null;
  const doneMenu = doneOutlet?.menu.find((m) => m.id === done?.menuItemId);

  if (done && doneOutlet) {
    return (
      <div className="page narrow center-col" data-testid="redeem-success">
        <div className="success-ic"><IconCheck size={44} /></div>
        <h2>Cup berhasil ditebus</h2>
        <p className="lead">{doneMenu?.name}</p>
        <p className="muted">{doneOutlet.name} · {new Date(done.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
        <div className="stat-row">
          <div><b>{quota}</b><span>sisa cup</span></div>
          <div><b>{today}/{MAX_CUPS_PER_DAY}</b><span>cup hari ini</span></div>
        </div>
        {!done.rating && (
          <button className="btn btn-primary btn-block" data-testid="btn-rate-now" onClick={() => setRatingFor(done.id)}>Beri rating rasa</button>
        )}
        {done.rating && <p className="ok">Terima kasih atas ratingnya!</p>}
        <button className="btn btn-ghost btn-block" onClick={() => { setDoneId(null); setToken(null); }}>Selesai</button>
        {ratingFor && <RatingModal redemptionId={ratingFor} outletName={doneOutlet.name} onClose={() => setRatingFor(null)} />}
      </div>
    );
  }

  return (
    <div className="page narrow center-col" data-testid="redeem">
      <div className="quota-card">
        <div><span className="muted">Sisa kuota</span><b data-testid="quota-left">{quota} cup</b></div>
        <div><span className="muted">Hari ini</span><b>{today}/{MAX_CUPS_PER_DAY} cup</b></div>
      </div>

      {blocked ? (
        <div className="card blocked" data-testid="redeem-blocked">
          <IconX size={28} />
          <p><b>Belum bisa menebus</b></p>
          <p className="muted">{blocked}</p>
        </div>
      ) : (
        token && (
          <>
            <p className="muted">Tunjukkan ke kasir kedai mitra</p>
            <div className="qr-wrap" data-testid="qr">
              <QRCodeSVG value={JSON.stringify({ app: 'kopipass', code: token.code })} size={208} level="M" bgColor="#ffffff" fgColor="#2a1d15" />
            </div>
            <div className="code" data-testid="redeem-code">{token.code.slice(0, 3)} {token.code.slice(3)}</div>
            <div className="countdown">
              <div className="bar"><span style={{ width: `${pct * 100}%` }} /></div>
              <span>Kode berganti dalam {remaining} dtk</span>
            </div>
            <ul className="terms small">
              <li>Kasir memindai QR atau mengetik 6 digit kode.</li>
              <li>Tambahan (size up, pastry) dibayar langsung ke kedai.</li>
            </ul>
            <button className="btn btn-outline btn-block" data-testid="btn-sim-kasir" onClick={() => setShowKasir(true)}>
              <IconStore size={18} /> Demo: simulasikan kasir
            </button>
          </>
        )
      )}

      {showKasir && token && (
        <KasirSim code={token.code} outletHint={outletHint} onClose={() => setShowKasir(false)} />
      )}
    </div>
  );
}

function KasirSim({ code, outletHint, onClose }: { code: string; outletHint: string | null; onClose: () => void }) {
  const [outletId, setOutletId] = useState(outletHint ?? OUTLETS[0].id);
  const outlet = getOutlet(outletId)!;
  const coreMenu = useMemo(() => outlet.menu.filter((m) => m.core), [outlet]);
  const [menuId, setMenuId] = useState(coreMenu[0].id);
  const [result, setResult] = useState<ConfirmResult | null>(null);

  useEffect(() => setMenuId(coreMenu[0].id), [coreMenu]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" data-testid="kasir-sim" onClick={(e) => e.stopPropagation()}>
        <span className="badge">Simulasi aplikasi kasir</span>
        <h3>Konfirmasi tebus</h3>
        <label className="field"><span>Kedai</span>
          <select value={outletId} onChange={(e) => { setOutletId(e.target.value); setResult(null); }}>
            {OUTLETS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Menu inti</span>
          <select data-testid="sim-menu" value={menuId} onChange={(e) => setMenuId(e.target.value)}>
            {coreMenu.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Kode pelanggan</span><input value={code} readOnly /></label>
        {result && <div className={`result ${result.ok ? 'ok' : 'err'}`}>{result.message}</div>}
        <button className="btn btn-primary btn-block" data-testid="btn-sim-confirm" onClick={() => { const r = confirmRedeem(code, outletId, menuId); setResult(r); if (r.ok) setTimeout(onClose, 900); }}>
          Konfirmasi tebus
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose}>Batal</button>
      </div>
    </div>
  );
}
