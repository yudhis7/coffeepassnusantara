import { useStore, claimOf, claimPromo, promoEligible, setHomeOutlet } from '../store';
import { getOutlet } from '../data/outlets';
import { KIND_LABEL, type Promo } from '../data/promos';
import { IconTag, IconGift, IconSparkle, IconCheck } from './Icons';

const kindIcon = (k: Promo['kind']) => (k === 'langganan' ? <IconGift size={16} /> : k === 'happyhour' ? <IconSparkle size={16} /> : <IconTag size={16} />);

export const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

interface Props {
  promo: Promo;
  compact?: boolean;
  onSubscribeVia?: (outletId: string) => void;
  onOpenOutlet?: (outletId: string) => void;
}

export default function PromoCard({ promo, compact, onSubscribeVia, onOpenOutlet }: Props) {
  const s = useStore();
  const outlet = getOutlet(promo.outletId);
  const claim = claimOf(s, promo.id);
  const eligible = promoEligible(s, promo);
  const subscribed = !!s.subscription && s.subscription.status !== 'cancelled';

  let action: JSX.Element;
  if (promo.kind === 'langganan') {
    action = claim
      ? <span className="pill pill-green"><IconCheck size={13} /> Bonus {promo.bonusCups} cup sudah kamu dapat</span>
      : subscribed
      ? <span className="muted small">Untuk calon pelanggan baru</span>
      : <button className="btn btn-sm btn-primary" data-testid={`promo-sub-${promo.id}`} onClick={() => onSubscribeVia?.(promo.outletId)}>Langganan lewat kedai ini</button>;
  } else if (promo.kind === 'happyhour') {
    action = <span className="pill pill-green">Otomatis saat tebus {String(promo.startHour).padStart(2, '0')}.00–{String(promo.endHour).padStart(2, '0')}.00</span>;
  } else if (!eligible) {
    action = <button className="btn btn-sm btn-outline" onClick={() => setHomeOutlet(promo.outletId)}>Jadikan kedai andalan untuk membuka</button>;
  } else if (claim) {
    action = <span className={`pill ${claim.usedAt ? '' : 'pill-green'}`}><IconCheck size={13} /> {claim.usedAt ? 'Sudah dipakai' : 'Diklaim · tunjukkan ke kasir'}</span>;
  } else {
    action = <button className="btn btn-sm btn-primary" data-testid={`promo-claim-${promo.id}`} onClick={() => claimPromo(promo.id)}>Klaim promo</button>;
  }

  return (
    <div className={`promo-card ${compact ? 'compact' : ''}`} data-testid={`promo-${promo.id}`}>
      <div className="pc-top">
        <span className="pc-kind">{kindIcon(promo.kind)} {KIND_LABEL[promo.kind]}</span>
        {promo.outletId === s.homeOutletId && <span className="level level-2">Kedai andalan</span>}
      </div>
      <b className="pc-title">{promo.title}</b>
      {!compact && <p className="muted small">{promo.description}</p>}
      <div className="pc-foot">
        <button className="link" onClick={() => onOpenOutlet?.(promo.outletId)}>{outlet?.name}</button>
        <span className="muted small">s/d {fmtDate(promo.validUntil)}</span>
      </div>
      <div className="pc-action">{action}</div>
    </div>
  );
}
