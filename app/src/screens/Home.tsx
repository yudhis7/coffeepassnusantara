import { useMemo, useState } from 'react';
import MapView from '../components/MapView';
import { OUTLETS, DEFAULT_CENTER, distanceKm, isOpenNow, getOutlet, type Flavor } from '../data/outlets';
import { rupiah } from '../data/plans';
import {
  useStore, livePromos, levelAt, stampsAt, bonusCups, toggleFavorite, setHomeOutlet, subscribePromo,
} from '../store';
import { LevelBadge, StampCard } from '../components/Loyalty';
import PromoCard from '../components/PromoCard';
import {
  IconLocate, IconPlug, IconWifi, IconQuiet, IconStar, IconSearch, IconX, IconQr, IconLeaf, IconHeart, IconHome, IconTag, IconGift,
} from '../components/Icons';

type FilterKey = Flavor | 'lessSugar' | 'plug' | 'wifi' | 'quiet' | 'open' | 'promo' | 'fav';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'promo', label: 'Ada promo' },
  { key: 'fav', label: 'Favorit' },
  { key: 'open', label: 'Buka sekarang' },
  { key: 'fruity', label: 'Fruity' },
  { key: 'nutty', label: 'Nutty' },
  { key: 'cokelat', label: 'Cokelat' },
  { key: 'lessSugar', label: 'Bisa kurang manis' },
  { key: 'plug', label: 'Ada colokan' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'quiet', label: 'Tenang' },
];

const FLAVOR_LABEL: Record<Flavor, string> = { fruity: 'Fruity', nutty: 'Nutty', cokelat: 'Cokelat' };

interface Props {
  initialSelected: string | null;
  onRedeemAt: (outletId: string) => void;
  onSubscribeVia: (outletId: string) => void;
}

export default function Home({ initialSelected, onRedeemAt, onSubscribeVia }: Props) {
  const s = useStore();
  const [active, setActive] = useState<FilterKey[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const init = initialSelected ? getOutlet(initialSelected) : null;
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(init ? [init.lat, init.lng] : null);
  const [locMsg, setLocMsg] = useState('');

  const origin = userPos ?? DEFAULT_CENTER;
  const promos = livePromos(s);
  const promoOutlets = new Set(promos.map((p) => p.outletId));
  const subscribed = !!s.subscription && s.subscription.status !== 'cancelled';

  const outlets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OUTLETS.map((o) => ({
      ...o, openNow: isOpenNow(o), km: distanceKm(origin, [o.lat, o.lng]),
      home: s.homeOutletId === o.id, fav: s.favorites.includes(o.id), promo: promoOutlets.has(o.id),
    }))
      .filter((o) => !q || o.name.toLowerCase().includes(q) || o.area.toLowerCase().includes(q))
      .filter((o) =>
        active.every((k) => {
          if (k === 'open') return o.openNow;
          if (k === 'lessSugar') return o.lessSugar;
          if (k === 'promo') return o.promo;
          if (k === 'fav') return o.fav || o.home;
          if (k === 'plug' || k === 'wifi' || k === 'quiet') return o.wfc[k];
          return o.flavors.includes(k);
        }),
      )
      .sort((a, b) => Number(b.home) - Number(a.home) || a.km - b.km);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, query, origin, s.homeOutletId, s.favorites, s.promos]);

  const selected = selectedId ? getOutlet(selectedId) : null;
  const selectedKm = selected ? distanceKm(origin, [selected.lat, selected.lng]) : 0;

  const toggle = (k: FilterKey) => setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));

  const select = (id: string) => {
    const o = getOutlet(id);
    setSelectedId(id);
    if (o) setFlyTarget([o.lat, o.lng]);
  };

  const locate = () => {
    if (!navigator.geolocation) return setLocMsg('Perangkat tidak mendukung lokasi.');
    setLocMsg('Mencari lokasimu…');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos: [number, number] = [p.coords.latitude, p.coords.longitude];
        setUserPos(pos);
        setFlyTarget(pos);
        setLocMsg('');
      },
      () => setLocMsg('Izin lokasi ditolak. Menampilkan area Jakarta Selatan.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="home" data-testid="home">
      <aside className="home-panel">
        {!subscribed && (
          <button className="sub-banner" data-testid="sub-banner" onClick={() => onSubscribeVia(selectedId ?? '')}>
            <IconGift size={20} />
            <span><b>Mulai langganan</b> · tebus kopi di semua kedai ini mulai Rp15.000/cup</span>
          </button>
        )}
        <div className="search">
          <IconSearch size={18} />
          <input data-testid="search" placeholder="Cari kedai atau area (mis. Senopati)" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button className="icon-btn sm" onClick={() => setQuery('')} aria-label="Hapus"><IconX size={16} /></button>}
        </div>
        {promos.length > 0 && (
          <div className="promo-strip" data-testid="promo-strip">
            {promos.map((p) => (
              <button key={p.id} className="promo-chip" onClick={() => select(p.outletId)}>
                <IconTag size={14} />
                <span><b>{getOutlet(p.outletId)?.name}</b>{p.title}</span>
              </button>
            ))}
          </div>
        )}
        <div className="chips" data-testid="filters">
          {FILTERS.map((f) => (
            <button key={f.key} data-testid={`filter-${f.key}`} className={`chip ${active.includes(f.key) ? 'on' : ''}`} onClick={() => toggle(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="result-count">{outlets.length} kedai mitra {userPos ? 'terdekat dari lokasimu' : 'di Jakarta Selatan'}</p>
        <ul className="outlet-list" data-testid="outlet-list">
          {outlets.map((o) => {
            const lvl = levelAt(s, o.id);
            return (
              <li key={o.id}>
                <button className={`outlet-card ${o.id === selectedId ? 'active' : ''} ${o.home ? 'is-home' : ''}`} data-testid={`outlet-${o.id}`} onClick={() => select(o.id)}>
                  <div className="oc-top">
                    <b>{o.home && <IconHome size={15} />} {o.name}</b>
                    <span className="rating"><IconStar size={14} filled /> {o.rating.toFixed(1)}</span>
                  </div>
                  <div className="oc-sub">
                    {o.area} · {o.km.toFixed(1)} km · <span className={o.openNow ? 'open' : 'closed'}>{o.openNow ? `Buka s/d ${o.close}` : `Tutup · buka ${o.open}`}</span>
                  </div>
                  <div className="oc-tags">
                    {o.home && <span className="level level-2">Kedai andalan</span>}
                    {lvl.cups > 0 && !o.home && <LevelBadge name={lvl.name} index={lvl.index} />}
                    {o.promo && <span className="tag tag-promo"><IconTag size={12} /> Promo</span>}
                    {o.flavors.map((f) => <span key={f} className="tag">{FLAVOR_LABEL[f]}</span>)}
                    {o.lessSugar && <span className="tag tag-green">Kurang manis</span>}
                    {o.wfc.plug && <span className="tag-ic" title="Colokan"><IconPlug size={14} /></span>}
                    {o.wfc.wifi && <span className="tag-ic" title="Wi-Fi"><IconWifi size={14} /></span>}
                    {o.wfc.quiet && <span className="tag-ic" title="Tenang"><IconQuiet size={14} /></span>}
                    {o.fav && <span className="tag-ic fav" title="Favorit"><IconHeart size={14} filled /></span>}
                  </div>
                </button>
              </li>
            );
          })}
          {outlets.length === 0 && <li className="empty">Tidak ada kedai yang cocok. Coba kurangi filter.</li>}
        </ul>
        <p className="demo-note small">Data kedai adalah contoh fiktif untuk prototipe.</p>
      </aside>

      <section className="home-map">
        <MapView outlets={outlets} selectedId={selectedId} onSelect={select} userPos={userPos} flyTarget={flyTarget} />
        <button className="fab" data-testid="btn-locate" onClick={locate} aria-label="Lokasi saya"><IconLocate /></button>
        {locMsg && <div className="toast">{locMsg}</div>}

        {selected && <OutletSheet
          outletId={selected.id}
          km={selectedKm}
          onClose={() => setSelectedId(null)}
          onRedeemAt={onRedeemAt}
          onSubscribeVia={onSubscribeVia}
          onOpenOutlet={select}
        />}
      </section>
    </div>
  );
}

function OutletSheet({ outletId, km, onClose, onRedeemAt, onSubscribeVia, onOpenOutlet }: {
  outletId: string; km: number; onClose: () => void;
  onRedeemAt: (id: string) => void; onSubscribeVia: (id: string) => void; onOpenOutlet: (id: string) => void;
}) {
  const s = useStore();
  const o = getOutlet(outletId)!;
  const isHome = s.homeOutletId === o.id;
  const fav = s.favorites.includes(o.id);
  const lvl = levelAt(s, o.id);
  const st = stampsAt(s, o.id);
  const bonus = bonusCups(s, o.id);
  const promos = livePromos(s, o.id);
  const subPromo = subscribePromo(s, o.id);
  const subscribed = !!s.subscription && s.subscription.status !== 'cancelled';

  return (
    <div className="sheet" data-testid="outlet-sheet">
      <div className="sheet-actions">
        <button className={`icon-btn ${fav ? 'fav' : ''}`} data-testid="btn-fav" onClick={() => toggleFavorite(o.id)} aria-label="Favorit"><IconHeart filled={fav} /></button>
        <button className="icon-btn" onClick={onClose} aria-label="Tutup"><IconX /></button>
      </div>
      <h3>{o.name}</h3>
      <p className="muted">{o.address} · {km.toFixed(1)} km</p>
      <div className="sheet-facts">
        <span><IconStar size={15} filled /> {o.rating.toFixed(1)} rasa</span>
        <span className={isOpenNow(o) ? 'open' : 'closed'}>{o.open}–{o.close}</span>
        {o.lessSugar && <span className="ok"><IconLeaf size={15} /> Opsi kurang manis</span>}
        {o.wfc.plug && <span><IconPlug size={15} /> Colokan</span>}
        {o.wfc.wifi && <span><IconWifi size={15} /> Wi-Fi</span>}
        {o.wfc.quiet && <span><IconQuiet size={15} /> Tenang</span>}
      </div>

      <div className={`home-box ${isHome ? 'on' : ''}`} data-testid="home-box">
        {isHome ? (
          <>
            <div className="hb-head"><IconHome size={18} /><b>Kedai andalanmu</b><LevelBadge name={lvl.name} index={lvl.index} /></div>
            <p className="muted small">Stempel ganda setiap tebus di sini{bonus > 0 ? ` · ${bonus} cup bonus kedai tersisa` : ''}.</p>
          </>
        ) : (
          <>
            <div className="hb-head"><IconHome size={18} /><b>Jadikan kedai andalan?</b></div>
            <p className="muted small">Dapat stempel ganda, level member, dan promo khusus andalan dari {o.name}.</p>
            <button className="btn btn-sm btn-outline" data-testid="btn-set-home" onClick={() => setHomeOutlet(o.id)}>Jadikan kedai andalan</button>
          </>
        )}
        <StampCard {...st} />
      </div>

      {promos.length > 0 && (
        <>
          <h4>Promo dari kedai ini</h4>
          <div className="promo-list">
            {promos.map((p) => <PromoCard key={p.id} promo={p} compact onSubscribeVia={onSubscribeVia} onOpenOutlet={onOpenOutlet} />)}
          </div>
        </>
      )}

      <h4>Menu inti KopiPass</h4>
      <ul className="menu-list">
        {o.menu.map((mi) => (
          <li key={mi.id} className={mi.core ? '' : 'non-core'}>
            <span>{mi.name}</span>
            <span>{mi.core ? <><s>{rupiah(mi.price)}</s> <b>1 cup</b></> : rupiah(mi.price)}</span>
          </li>
        ))}
      </ul>
      {subscribed ? (
        <button className="btn btn-primary btn-block" data-testid="btn-redeem-here" onClick={() => onRedeemAt(o.id)}>
          <IconQr size={18} /> Tebus di kedai ini
        </button>
      ) : (
        <button className="btn btn-primary btn-block" data-testid="btn-subscribe-here" onClick={() => onSubscribeVia(o.id)}>
          <IconGift size={18} /> Langganan lewat kedai ini{subPromo?.bonusCups ? ` (+${subPromo.bonusCups} cup bonus)` : ''}
        </button>
      )}
    </div>
  );
}
