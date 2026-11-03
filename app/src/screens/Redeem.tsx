import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  useStore, canRedeem, createToken, quotaLeft, totalBonus, cupsToday, confirmRedeem, customerContext, levelAt, stampsAt,
  type RedeemToken, type ConfirmResult,
} from '../store';
import { OUTLETS, getOutlet } from '../data/outlets';
import { MAX_CUPS_PER_DAY, TOKEN_TTL_SECONDS } from '../data/plans';
import { IconCheck, IconX, IconStore, IconGift, IconHome } from '../components/Icons';
import { LevelProgress, StampCard } from '../components/Loyalty';
import RatingModal from '../components/RatingModal';

interface Props {
  outletHint: string | null;
  onOpenPlans: () => void;
}

export default function Redeem({ outletHint, onOpenPlans }: Props) {
  const s = useStore();
  const blocked = canRedeem(s);
  const [token, setToken] = useState<RedeemToken | null>(null);
  const [now, setNow] = useState(Date.now());
  const [showKasir, setShowKasir] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [ratingFor, setRatingFor] = useState<string | null>(null);

  useEffect(() => {
    if (blocked || doneId) return;
    if (!token || token.expiresAt <= now) setToken(createToken());
  }, [blocked, token, now, doneId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const live = token ? s.tokens.find((t) => t.code === token.code) : undefined;
  useEffect(() => {
    if (live?.used && live.redemptionId && !doneId) setDoneId(live.redemptionId);
  }, [live, doneId]);

  const remaining = token ? Math.max(0, Math.ceil((token.expiresAt - now) / 1000)) : 0;
  const pct = remaining / TOKEN_TTL_SECONDS;
  const quota = quotaLeft(s);
  const bonus = totalBonus(s);
  const today = cupsToday(s);

  const done = doneId ? s.redemptions.find((r) => r.id === doneId) : null;
  const doneOutlet = done ? getOutlet(done.outletId) : null;
  const doneMenu = doneOutlet?.menu.find((m) => m.id === done?.menuItemId);

  if (!s.subscription || s.subscription.status === 'cancelled') {
    return (
      <div className="page narrow center-col" data-testid="redeem-nosub">
        <div className="success-ic warm"><IconGift size={40} /></div>
        <h2>Mulai langganan untuk menebus</h2>
        <p className="muted">Dengan KopiPass, kopi harianmu di kedai-kedai lokal mulai Rp15.000 per cup. Pilih kedai andalan saat berlangganan untuk stempel ganda dan cup bonus.</p>
        <button className="btn btn-primary btn-block" data-testid="btn-open-plans" onClick={onOpenPlans}>Lihat paket langganan</button>
      </div>
    );
  }

  if (done && doneOutlet) {
    const lvl = levelAt(s, done.outletId);
    const st = stampsAt(s, done.outletId);
    return (
      <div className="page narrow center-col" data-testid="redeem-success">
        <div className="success-ic"><IconCheck size={44} /></div>
        <h2>Cup berhasil ditebus</h2>
        <p className="lead">{doneMenu?.name}</p>
        <p className="muted">
          {doneOutlet.name} · {new Date(done.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          {done.scoped ? ' · cup bonus kedai' : ''}
        </p>
        <div className="stat-row">
          <div><b>+{done.stamps}</b><span>stempel</span></div>
          <div><b>{quota}{bonus ? `+${bonus}` : ''}</b><span>sisa cup</span></div>
          <div><b>{today}/{MAX_CUPS_PER_DAY}</b><span>cup hari ini</span></div>
        </div>
        <div className="card">
          {s.homeOutletId === done.outletId && <p className="ok small"><IconHome size={14} /> Kedai andalan: stempel ganda</p>}
          <LevelProgress {...lvl} />
          <StampCard {...st} />
          {done.rewardUsed && <p className="ok small">Hadiah stempel sudah diberikan kasir.</p>}
          {done.promoId && <p className="ok small">Promo kedai diterapkan pada transaksi ini.</p>}
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
        <div><span className="muted">Sisa kuota</span><b data-testid="quota-left">{quota} cup</b>{bonus > 0 && <span className="ok small">+{bonus} cup bonus kedai</span>}</div>
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
              <li>Promo yang sudah kamu klaim dan hadiah stempel akan muncul di layar kasir.</li>
            </ul>
            <button className="btn btn-outline btn-block" data-testid="btn-sim-kasir" onClick={() => setShowKasir(true)}>
              <IconStore size={18} /> Demo: simulasikan kasir
            </button>
          </>
        )
      )}

      {showKasir && token && <KasirSim code={token.code} outletHint={outletHint ?? s.homeOutletId} onClose={() => setShowKasir(false)} />}
    </div>
  );
}

function KasirSim({ code, outletHint, onClose }: { code: string; outletHint: string | null; onClose: () => void }) {
  const [outletId, setOutletId] = useState(outletHint ?? OUTLETS[0].id);
  const outlet = getOutlet(outletId)!;
  const coreMenu = useMemo(() => outlet.menu.filter((m) => m.core), [outlet]);
  const [menuId, setMenuId] = useState(coreMenu[0].id);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  useStore();
  const ctx = customerContext(code, outletId);
  const [useReward, setUseReward] = useState(false);
  const [promoId, setPromoId] = useState<string | undefined>(undefined);

  useEffect(() => { setMenuId(coreMenu[0].id); setPromoId(undefined); setUseReward(false); }, [coreMenu]);

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
        {ctx && <CustomerPanel ctx={ctx} useReward={useReward} setUseReward={setUseReward} promoId={promoId} setPromoId={setPromoId} />}
        {result && <div className={`result ${result.ok ? 'ok' : 'err'}`}>{result.message}</div>}
        <button className="btn btn-primary btn-block" data-testid="btn-sim-confirm" onClick={() => { const r = confirmRedeem(code, outletId, menuId, { promoId, useReward }); setResult(r); if (r.ok) setTimeout(onClose, 900); }}>
          Konfirmasi tebus
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose}>Batal</button>
      </div>
    </div>
  );
}

/** Panel info pelanggan di layar kasir: level, kedai andalan, cup bonus, hadiah stempel, promo diklaim. */
export function CustomerPanel({ ctx, useReward, setUseReward, promoId, setPromoId }: {
  ctx: NonNullable<ReturnType<typeof customerContext>>;
  useReward: boolean; setUseReward: (v: boolean) => void;
  promoId?: string; setPromoId: (v: string | undefined) => void;
}) {
  return (
    <div className="cust-panel" data-testid="customer-panel">
      <div className="cp-head">
        <b>{ctx.name}</b>
        <span className={`level level-${ctx.level.index}`}>{ctx.level.name}</span>
        {ctx.isHome && <span className="level level-2"><IconHome size={12} /> Andalan</span>}
      </div>
      <p className="muted small">{ctx.level.cups} cup di kedai ini · {ctx.stamps.progress}/{ctx.stamps.target} stempel{ctx.bonus > 0 ? ` · ${ctx.bonus} cup bonus kedai (dipakai dulu, tanpa payout)` : ''}</p>
      {ctx.stamps.available && (
        <label className="check"><input type="checkbox" data-testid="chk-reward" checked={useReward} onChange={(e) => setUseReward(e.target.checked)} /><span>Berikan hadiah stempel: <b>{ctx.stamps.reward}</b></span></label>
      )}
      {ctx.claims.map((p) => (
        <label className="check" key={p.id}><input type="checkbox" data-testid={`chk-promo-${p.id}`} checked={promoId === p.id} onChange={(e) => setPromoId(e.target.checked ? p.id : undefined)} /><span>Terapkan promo: <b>{p.title}</b></span></label>
      ))}
    </div>
  );
}
