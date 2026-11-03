import { useStore, claimPromo, markPopupSeen } from '../store';
import { getOutlet } from '../data/outlets';
import { KIND_LABEL, type Promo } from '../data/promos';
import { IconGift, IconX } from './Icons';
import { fmtDate } from './PromoCard';

interface Props {
  promo: Promo;
  onSubscribeVia: (outletId: string) => void;
  onOpenOutlet: (outletId: string) => void;
}

/** Pop-up promo yang dipasang kedai mitra; tampil sekali per promo saat aplikasi dibuka. */
export default function PromoPopup({ promo, onSubscribeVia, onOpenOutlet }: Props) {
  const s = useStore();
  const outlet = getOutlet(promo.outletId);
  const close = () => markPopupSeen(promo.id);
  const subscribed = !!s.subscription && s.subscription.status !== 'cancelled';

  const primary =
    promo.kind === 'langganan' && !subscribed
      ? { label: 'Langganan lewat kedai ini', act: () => { close(); onSubscribeVia(promo.outletId); } }
      : promo.kind === 'happyhour'
        ? { label: 'Lihat kedai di peta', act: () => { close(); onOpenOutlet(promo.outletId); } }
        : { label: 'Klaim promo', act: () => { claimPromo(promo.id); close(); } };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal popup" data-testid="promo-popup" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn sheet-close" onClick={close} aria-label="Tutup"><IconX /></button>
        <div className="popup-hero">
          <IconGift size={40} />
          <span>{KIND_LABEL[promo.kind]}</span>
        </div>
        <p className="eyebrow center">Dari {outlet?.name}</p>
        <h3>{promo.title}</h3>
        <p className="muted">{promo.description}</p>
        <p className="muted small">Berlaku s/d {fmtDate(promo.validUntil)}</p>
        <button className="btn btn-primary btn-block" data-testid="popup-primary" onClick={primary.act}>{primary.label}</button>
        <button className="btn btn-ghost btn-block" data-testid="popup-later" onClick={close}>Nanti saja</button>
      </div>
    </div>
  );
}
