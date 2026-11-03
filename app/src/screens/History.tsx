import { useState } from 'react';
import { useStore } from '../store';
import { getOutlet } from '../data/outlets';
import { rupiah } from '../data/plans';
import { IconStar, IconCup } from '../components/Icons';
import RatingModal from '../components/RatingModal';

export default function History({ embedded }: { embedded?: boolean }) {
  const s = useStore();
  const [ratingFor, setRatingFor] = useState<string | null>(null);
  const list = [...s.redemptions].sort((a, b) => b.at.localeCompare(a.at));
  const saved = list.reduce((sum, r) => {
    const o = getOutlet(r.outletId);
    return sum + (o?.menu.find((m) => m.id === r.menuItemId)?.price ?? 0);
  }, 0);
  const visited = new Set(list.map((r) => r.outletId)).size;

  return (
    <div className={embedded ? '' : 'page narrow'} data-testid="history">
      <h3>Riwayat tebus</h3>
      <div className="stat-row">
        <div><b>{list.length}</b><span>cup ditebus</span></div>
        <div><b>{visited}</b><span>kedai dijelajahi</span></div>
        <div><b>{rupiah(saved)}</b><span>nilai menu</span></div>
      </div>
      {list.length === 0 && (
        <div className="empty-state"><IconCup size={40} /><p>Belum ada cup yang ditebus. Yuk cari kedai di peta!</p></div>
      )}
      <ul className="history-list">
        {list.map((r) => {
          const o = getOutlet(r.outletId);
          const mi = o?.menu.find((m) => m.id === r.menuItemId);
          const d = new Date(r.at);
          return (
            <li key={r.id} className="history-item">
              <div>
                <b>{mi?.name}</b>
                <span className="muted">{o?.name}</span>
                <span className="muted small">
                  {d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })} · {d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}+{r.stamps ?? 1} stempel{r.scoped ? ' · cup bonus' : ''}{r.rewardUsed ? ' · hadiah' : ''}
                </span>
              </div>
              {r.rating ? (
                <span className="rating"><IconStar size={14} filled /> {r.rating}{r.tags?.length ? <em> · {r.tags.join(', ')}</em> : null}</span>
              ) : (
                <button className="btn btn-sm btn-outline" onClick={() => setRatingFor(r.id)}>Beri rating</button>
              )}
            </li>
          );
        })}
      </ul>
      {ratingFor && (
        <RatingModal redemptionId={ratingFor} outletName={getOutlet(s.redemptions.find((r) => r.id === ratingFor)!.outletId)?.name ?? ''} onClose={() => setRatingFor(null)} />
      )}
    </div>
  );
}
