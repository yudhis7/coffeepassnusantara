import { useStore, livePromos, claimOf } from '../store';
import PromoCard from '../components/PromoCard';
import { IconTag } from '../components/Icons';

interface Props {
  onSubscribeVia: (outletId: string) => void;
  onOpenOutlet: (outletId: string) => void;
}

export default function Promos({ onSubscribeVia, onOpenOutlet }: Props) {
  const s = useStore();
  const all = livePromos(s);
  const rank = (outletId: string) => (outletId === s.homeOutletId ? 0 : s.favorites.includes(outletId) ? 1 : 2);
  const claimed = all.filter((p) => claimOf(s, p.id) && p.kind !== 'langganan');
  const others = all.filter((p) => !claimed.includes(p)).sort((a, b) => rank(a.outletId) - rank(b.outletId));

  return (
    <div className="page narrow" data-testid="promos">
      <h2>Promo dari kedai</h2>
      <p className="muted">Promo dipasang langsung oleh kedai mitra. Promo dari kedai andalan dan favoritmu tampil paling atas.</p>
      {claimed.length > 0 && (
        <>
          <h3>Promo saya</h3>
          <div className="promo-list">
            {claimed.map((p) => <PromoCard key={p.id} promo={p} onSubscribeVia={onSubscribeVia} onOpenOutlet={onOpenOutlet} />)}
          </div>
        </>
      )}
      <h3>Semua promo aktif</h3>
      {others.length === 0 && <div className="empty-state"><IconTag size={36} /><p>Belum ada promo lain saat ini.</p></div>}
      <div className="promo-list">
        {others.map((p) => <PromoCard key={p.id} promo={p} onSubscribeVia={onSubscribeVia} onOpenOutlet={onOpenOutlet} />)}
      </div>
    </div>
  );
}
