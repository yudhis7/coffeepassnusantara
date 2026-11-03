import { useStore, quotaLeft, totalBonus, togglePause, cancelSubscription, setRole, seedDemoHistory, resetDemo } from '../store';
import { getPlan, rupiah, ROLLOVER_MAX } from '../data/plans';
import { getOutlet } from '../data/outlets';
import { IconStore, IconChevron, Logo, IconHome } from '../components/Icons';

export default function Account({ onOpenPlans }: { onOpenPlans: () => void }) {
  const s = useStore();
  const sub = s.subscription;
  const plan = sub ? getPlan(sub.planId) : null;
  const home = s.homeOutletId ? getOutlet(s.homeOutletId) : null;
  const via = sub?.viaOutletId ? getOutlet(sub.viaOutletId) : null;
  const statusLabel = { active: 'Aktif', paused: 'Di-pause', cancelled: 'Dibatalkan' } as const;

  return (
    <div className="page narrow" data-testid="account">
      <div className="profile">
        <div className="avatar">{s.user?.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <b>{s.user?.name}</b>
          <span className="muted">{s.user?.phone}</span>
          {home && <span className="ok small"><IconHome size={13} /> Kedai andalan: {home.name}</span>}
        </div>
      </div>

      {sub && plan ? (
        <div className="card">
          <div className="row"><span>Paket</span><b>{plan.name} · {plan.cups} cup</b></div>
          <div className="row"><span>Status</span><b className={sub.status === 'active' ? 'ok' : 'warn'}>{statusLabel[sub.status]}</b></div>
          <div className="row"><span>Sisa kuota</span><b>{quotaLeft(s)} cup{totalBonus(s) ? ` + ${totalBonus(s)} bonus kedai` : ''}</b></div>
          {via && <div className="row"><span>Berlangganan lewat</span><b>{via.name}</b></div>}
          <div className="row"><span>Tagihan berikutnya</span><b>{new Date(sub.periodEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b></div>
          <div className="row"><span>Biaya</span><b>{rupiah(plan.price)}</b></div>
          <p className="muted small">Sisa kuota maksimal {ROLLOVER_MAX} cup dibawa ke periode berikutnya.</p>
          <div className="btn-row">
            {sub.status !== 'cancelled' && (
              <button className="btn btn-outline" data-testid="btn-pause" onClick={togglePause}>{sub.status === 'paused' ? 'Aktifkan lagi' : 'Pause 1 bulan'}</button>
            )}
            {sub.status !== 'cancelled' ? (
              <button className="btn btn-ghost danger" onClick={() => cancelSubscription()}>Batalkan langganan</button>
            ) : (
              <button className="btn btn-primary" onClick={onOpenPlans}>Berlangganan lagi</button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <b>Belum berlangganan</b>
          <p className="muted small">Kamu tetap bisa menjelajah kedai, menyimpan favorit, dan mengklaim promo. Berlangganan untuk mulai menebus cup.</p>
          <button className="btn btn-primary btn-block" data-testid="btn-account-plans" onClick={onOpenPlans}>Lihat paket langganan</button>
        </div>
      )}

      <h3>Lainnya</h3>
      <ul className="menu-links">
        <li><button data-testid="btn-switch-mitra" onClick={() => setRole('mitra')}><IconStore size={18} /> Buka mode Mitra (kasir kedai) <IconChevron size={16} /></button></li>
        <li><button data-testid="btn-seed" onClick={seedDemoHistory}>Isi riwayat contoh (demo) <IconChevron size={16} /></button></li>
        <li><button className="danger" data-testid="btn-reset" onClick={resetDemo}>Reset semua data demo <IconChevron size={16} /></button></li>
      </ul>

      <div className="about">
        <Logo size={36} />
        <div>
          <b>KopiPass Nusantara v0.2.0 (prototipe)</b>
          <span className="muted small">Ide &amp; pemilik proyek: yudhis7 · Data kedai fiktif · Peta © OpenStreetMap contributors</span>
        </div>
      </div>
    </div>
  );
}
