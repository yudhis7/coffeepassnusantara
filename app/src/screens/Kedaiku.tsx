import { useStore, levelAt, stampsAt, bonusCups, livePromos, setHomeOutlet, allBonus } from '../store';
import { getOutlet, OUTLETS } from '../data/outlets';
import { LevelBadge, LevelProgress, StampCard } from '../components/Loyalty';
import PromoCard from '../components/PromoCard';
import { IconHome, IconHeart, IconGift, IconChevron, IconMap } from '../components/Icons';
import History from './History';

interface Props {
  onOpenOutlet: (outletId: string) => void;
  onSubscribeVia: (outletId: string) => void;
}

export default function Kedaiku({ onOpenOutlet, onSubscribeVia }: Props) {
  const s = useStore();
  const home = s.homeOutletId ? getOutlet(s.homeOutletId) : null;
  const visited = OUTLETS.filter((o) => s.redemptions.some((r) => r.outletId === o.id) && o.id !== s.homeOutletId);
  const favs = s.favorites.map(getOutlet).filter((o) => o && o.id !== s.homeOutletId) as NonNullable<ReturnType<typeof getOutlet>>[];
  const bonuses = allBonus(s);

  return (
    <div className="page narrow" data-testid="kedaiku">
      <h2>Kedaiku</h2>
      <p className="muted">Ikatanmu dengan kedai-kedai mitra: kedai andalan, stempel, level member, dan cup bonus.</p>

      {home ? (
        <HomeCard outletId={home.id} onOpenOutlet={onOpenOutlet} onSubscribeVia={onSubscribeVia} />
      ) : (
        <div className="card home-empty" data-testid="home-empty">
          <IconHome size={30} />
          <h3>Belum punya kedai andalan</h3>
          <p className="muted">Pilih satu kedai yang paling sering kamu kunjungi. Kamu akan mendapat:</p>
          <ul className="benefits">
            <li><b>Stempel ganda</b> setiap tebus di kedai andalan</li>
            <li><b>Level member</b>: Pengunjung → Langganan → Sahabat Kedai</li>
            <li><b>Promo khusus</b> yang hanya dibuka untuk pelanggan andalan</li>
            <li><b>Cup bonus</b> dari kedai yang memberi promo langganan</li>
          </ul>
          <button className="btn btn-primary btn-block" onClick={() => onOpenOutlet('')}><IconMap size={18} /> Pilih dari peta</button>
        </div>
      )}

      {bonuses.length > 0 && (
        <div className="card">
          <h3><IconGift size={18} /> Cup bonus kedai</h3>
          {bonuses.map(([id, n]) => (
            <div className="row" key={id}><span>{getOutlet(id)?.name}</span><b>{n} cup</b></div>
          ))}
          <p className="muted small">Cup bonus hanya bisa ditebus di kedai pemberinya dan dipakai lebih dulu saat kamu menebus di sana.</p>
        </div>
      )}

      {favs.length > 0 && (
        <>
          <h3><IconHeart size={18} filled /> Kedai favorit</h3>
          <ul className="shop-list">
            {favs.map((o) => <ShopRow key={o.id} outletId={o.id} onOpen={onOpenOutlet} canMakeHome />)}
          </ul>
        </>
      )}

      {visited.length > 0 && (
        <>
          <h3>Kartu stempel lainnya</h3>
          <ul className="shop-list">
            {visited.filter((o) => !s.favorites.includes(o.id)).map((o) => <ShopRow key={o.id} outletId={o.id} onOpen={onOpenOutlet} canMakeHome />)}
          </ul>
        </>
      )}

      <div className="divider" />
      <History embedded />
    </div>
  );
}

function HomeCard({ outletId, onOpenOutlet, onSubscribeVia }: { outletId: string } & Props) {
  const s = useStore();
  const o = getOutlet(outletId)!;
  const lvl = levelAt(s, outletId);
  const st = stampsAt(s, outletId);
  const bonus = bonusCups(s, outletId);
  const promos = livePromos(s, outletId);
  return (
    <div className="card home-card" data-testid="home-card">
      <div className="hc-top">
        <span className="hc-label"><IconHome size={16} /> Kedai andalan</span>
        <button className="link small" onClick={() => setHomeOutlet(null)}>Ganti</button>
      </div>
      <h3>{o.name}</h3>
      <p className="muted small">{o.address} · {o.open}–{o.close}</p>
      <div className="hc-stats">
        <div><b>{lvl.cups}</b><span>cup di sini</span></div>
        <div><b>{st.balance}</b><span>stempel</span></div>
        <div><b>{bonus}</b><span>cup bonus</span></div>
      </div>
      <LevelProgress {...lvl} />
      <StampCard {...st} />
      <p className="muted small">Setiap tebus di kedai andalan memberi <b>2 stempel</b>.</p>
      {promos.length > 0 && (
        <div className="promo-list">
          {promos.map((p) => <PromoCard key={p.id} promo={p} compact onSubscribeVia={onSubscribeVia} onOpenOutlet={onOpenOutlet} />)}
        </div>
      )}
      <button className="btn btn-outline btn-block" onClick={() => onOpenOutlet(outletId)}><IconMap size={18} /> Lihat di peta</button>
    </div>
  );
}

function ShopRow({ outletId, onOpen, canMakeHome }: { outletId: string; onOpen: (id: string) => void; canMakeHome?: boolean }) {
  const s = useStore();
  const o = getOutlet(outletId)!;
  const lvl = levelAt(s, outletId);
  const st = stampsAt(s, outletId);
  return (
    <li className="shop-row">
      <button className="sr-main" onClick={() => onOpen(outletId)}>
        <div>
          <b>{o.name}</b>
          <span className="muted small">{o.area} · {st.progress}/{st.target} stempel · {st.reward}</span>
        </div>
        <LevelBadge name={lvl.name} index={lvl.index} />
        <IconChevron size={16} />
      </button>
      {canMakeHome && <button className="link small" onClick={() => setHomeOutlet(outletId)}>Jadikan andalan</button>}
    </li>
  );
}
