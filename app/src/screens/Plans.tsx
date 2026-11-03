import { useState } from 'react';
import { PLANS, rupiah, type Plan } from '../data/plans';
import { subscribe } from '../store';
import { IconBack, IconCheck } from '../components/Icons';

const AVG_MENU_PRICE = 25000;
const METHODS = ['GoPay', 'OVO', 'DANA', 'Kartu debit/kredit'];

export default function Plans({ userName }: { userName: string }) {
  const [chosen, setChosen] = useState<Plan | null>(null);
  const [method, setMethod] = useState(METHODS[0]);
  const [paying, setPaying] = useState(false);

  if (chosen) {
    return (
      <div className="page narrow" data-testid="checkout">
        <button className="icon-btn" onClick={() => setChosen(null)} aria-label="Kembali"><IconBack /></button>
        <h2>Konfirmasi langganan</h2>
        <div className="card summary">
          <div className="row"><span>Paket</span><b>{chosen.name}</b></div>
          <div className="row"><span>Kuota</span><b>{chosen.cups} cup / 30 hari</b></div>
          <div className="row"><span>Tagihan bulanan</span><b>{rupiah(chosen.price)}</b></div>
          <div className="row muted"><span>Harga efektif per cup</span><span>{rupiah(Math.round(chosen.price / chosen.cups / 100) * 100)}</span></div>
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
        </ul>
        <button
          className="btn btn-primary btn-block"
          data-testid="btn-pay"
          disabled={paying}
          onClick={() => { setPaying(true); setTimeout(() => subscribe(chosen.id), 700); }}
        >
          {paying ? 'Memproses…' : `Bayar ${rupiah(chosen.price)} dengan ${method}`}
        </button>
        <div className="demo-note">Mode demo: tidak ada pembayaran sungguhan.</div>
      </div>
    );
  }

  return (
    <div className="page narrow" data-testid="plans">
      <p className="eyebrow">Halo, {userName}</p>
      <h2>Pilih paket langgananmu</h2>
      <p className="muted">Tebus di semua kedai mitra KopiPass. Harga menu rata-rata Rp25.000 per cup.</p>
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
                <span className="pill">{p.cups} cup</span>
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
