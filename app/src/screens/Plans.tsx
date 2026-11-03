import { useState } from 'react';
import { PLANS, rupiah, type Plan } from '../data/plans';
import { OUTLETS, getOutlet } from '../data/outlets';
import { subscribe, subscribePromo, useStore } from '../store';
import { IconBack, IconCheck, IconHome, IconGift } from '../components/Icons';

const AVG_MENU_PRICE = 25000;
const METHODS = ['GoPay', 'OVO', 'DANA', 'Kartu debit/kredit'];

interface Props {
  userName: string;
  initialOutletId: string | null;
  onBack: () => void;
  onDone: () => void;
}

export default function Plans({ userName, initialOutletId, onBack, onDone }: Props) {
  const s = useStore();
  const [chosen, setChosen] = useState<Plan | null>(null);
  const [outletId, setOutletId] = useState<string | null>(initialOutletId ?? s.homeOutletId);
  const [method, setMethod] = useState(METHODS[0]);
  const [paying, setPaying] = useState(false);
  const outlet = outletId ? getOutlet(outletId) : null;
  const promo = subscribePromo(s, outletId);

  const homePicker = (
    <div className="card home-pick" data-testid="home-pick">
      <div className="hp-head"><IconHome size={18} /><b>Langganan lewat kedai andalan</b><span className="muted small">(opsional)</span></div>
      <p className="muted small">Kedai andalan memberimu stempel ganda, level member, dan promo khusus. Beberapa kedai juga memberi cup bonus.</p>
      <select data-testid="select-home" value={outletId ?? ''} onChange={(e) => setOutletId(e.target.value || null)}>
        <option value="">Tanpa kedai andalan</option>
        {OUTLETS.map((o) => {
          const p = subscribePromo(s, o.id);
          return <option key={o.id} value={o.id}>{o.name}{p?.bonusCups ? ` (bonus ${p.bonusCups} cup)` : ''}</option>;
        })}
      </select>
      {promo?.bonusCups && outlet && (
        <div className="bonus-note"><IconGift size={18} /><span><b>+{promo.bonusCups} cup bonus</b> dari {outlet.name}, khusus ditebus di kedai ini.</span></div>
      )}
    </div>
  );

  if (chosen) {
    return (
      <div className="page narrow" data-testid="checkout">
        <button className="icon-btn" onClick={() => setChosen(null)} aria-label="Kembali"><IconBack /></button>
        <h2>Konfirmasi langganan</h2>
        <div className="card summary">
          <div className="row"><span>Paket</span><b>{chosen.name}</b></div>
          <div className="row"><span>Kuota</span><b>{chosen.cups} cup / 30 hari</b></div>
          {outlet && <div className="row"><span>Kedai andalan</span><b>{outlet.name}</b></div>}
          {promo?.bonusCups && outlet && <div className="row ok"><span>Cup bonus kedai</span><b>+{promo.bonusCups} cup</b></div>}
          <div className="row"><span>Tagihan bulanan</span><b>{rupiah(chosen.price)}</b></div>
          <div className="row muted"><span>Harga efektif per cup</span><span>{rupiah(Math.round(chosen.price / (chosen.cups + (promo?.bonusCups ?? 0)) / 100) * 100)}</span></div>
        </div>
        <h3>Metode pembayaran (autodebit)</h3>
        <div className="method-list">
          {METHODS.map((m) => (
            <button key={m} className={`method ${method === m ? 'active' : ''}`} onClick={() => setMethod(m)}>
              <span className="radio">{method === m && <IconCheck size={14} />}</span>{m}
            </button>
          ))}
        </div>
        <ul className="terms">
          <li>Ditagih otomatis setiap 30 hari. Batalkan kapan saja sebelum tanggal tagihan.</li>
          <li>Sisa kuota bisa dibawa ke bulan berikutnya, maksimal 3 cup.</li>
          <li>Maksimal 2 cup per hari, 1 cup per kedai setiap 3 jam.</li>
          {promo?.bonusCups && <li>Cup bonus kedai hanya bisa ditebus di {outlet?.name} selama langganan aktif.</li>}
        </ul>
        <button
          className="btn btn-primary btn-block"
          data-testid="btn-pay"
          disabled={paying}
          onClick={() => { setPaying(true); setTimeout(() => { subscribe(chosen.id, outletId); onDone(); }, 700); }}
        >
          {paying ? 'Memproses…' : `Bayar ${rupiah(chosen.price)} dengan ${method}`}
        </button>
        <div className="demo-note">Mode demo: tidak ada pembayaran sungguhan.</div>
      </div>
    );
  }

  return (
    <div className="page narrow" data-testid="plans">
      <button className="icon-btn" onClick={onBack} aria-label="Kembali"><IconBack /></button>
      <p className="eyebrow">Halo, {userName}</p>
      <h2>Pilih paket langgananmu</h2>
      <p className="muted">Tebus di semua kedai mitra KopiPass. Harga menu rata-rata Rp25.000 per cup.</p>
      {homePicker}
      <div className="plan-list">
        {PLANS.map((p) => {
          const perCup = p.price / p.cups;
          const save = Math.round((1 - perCup / AVG_MENU_PRICE) * 100);
          return (
            <button key={p.id} className={`plan ${p.popular ? 'popular' : ''}`} data-testid={`plan-${p.id}`} onClick={() => setChosen(p)}>
              {p.popular && <span className="badge">Paling populer</span>}
              <div className="plan-head">
                <div>
                  <h3>{p.name}</h3>
                  <span className="muted">{p.tagline}</span>
                </div>
                <div className="plan-price">
                  <b>{rupiah(p.price)}</b>
                  <span>/bulan</span>
                </div>
              </div>
              <div className="plan-meta">
                <span className="pill">{p.cups} cup{promo?.bonusCups ? ` + ${promo.bonusCups} bonus` : ''}</span>
                <span className="pill">{rupiah(Math.round(perCup / 100) * 100)}/cup</span>
                <span className="pill pill-green">Hemat ±{save}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
