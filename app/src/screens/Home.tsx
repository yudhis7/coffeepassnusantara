import { useMemo, useState } from 'react';
import MapView from '../components/MapView';
import { OUTLETS, DEFAULT_CENTER, distanceKm, isOpenNow, getOutlet, type Flavor } from '../data/outlets';
import { rupiah } from '../data/plans';
import { IconLocate, IconPlug, IconWifi, IconQuiet, IconStar, IconSearch, IconX, IconQr, IconLeaf } from '../components/Icons';

type FilterKey = Flavor | 'lessSugar' | 'plug' | 'wifi' | 'quiet' | 'open';

const FILTERS: { key: FilterKey; label: string }[] = [
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

export default function Home({ onRedeemAt }: { onRedeemAt: (outletId: string) => void }) {
  const [active, setActive] = useState<FilterKey[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [locMsg, setLocMsg] = useState('');

  const origin = userPos ?? DEFAULT_CENTER;

  const outlets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OUTLETS.map((o) => ({ ...o, openNow: isOpenNow(o), km: distanceKm(origin, [o.lat, o.lng]) }))
      .filter((o) => !q || o.name.toLowerCase().includes(q) || o.area.toLowerCase().includes(q))
      .filter((o) =>
        active.every((k) => {
          if (k === 'open') return o.openNow;
          if (k === 'lessSugar') return o.lessSugar;
          if (k === 'plug' || k === 'wifi' || k === 'quiet') return o.wfc[k];
          return o.flavors.includes(k);
        }),
      )
      .sort((a, b) => a.km - b.km);
  }, [active, query, origin]);

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
        <div className="search">
          <IconSearch size={18} />
          <input data-testid="search" placeholder="Cari kedai atau area (mis. Senopati)" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button className="icon-btn sm" onClick={() => setQuery('')} aria-label="Hapus"><IconX size={16} /></button>}
        </div>
        <div className="chips" data-testid="filters">
          {FILTERS.map((f) => (
            <button key={f.key} data-testid={`filter-${f.key}`} className={`chip ${active.includes(f.key) ? 'on' : ''}`} onClick={() => toggle(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="result-count">{outlets.length} kedai mitra {userPos ? 'terdekat dari lokasimu' : 'di Jakarta Selatan'}</p>
        <ul className="outlet-list" data-testid="outlet-list">
          {outlets.map((o) => (
            <li key={o.id}>
              <button className={`outlet-card ${o.id === selectedId ? 'active' : ''}`} data-testid={`outlet-${o.id}`} onClick={() => select(o.id)}>
                <div className="oc-top">
                  <b>{o.name}</b>
                  <span className="rating"><IconStar size={14} filled /> {o.rating.toFixed(1)}</span>
                </div>
                <div className="oc-sub">
                  {o.area} · {o.km.toFixed(1)} km · <span className={o.openNow ? 'open' : 'closed'}>{o.openNow ? `Buka s/d ${o.close}` : `Tutup · buka ${o.open}`}</span>
                </div>
                <div className="oc-tags">
                  {o.flavors.map((f) => <span key={f} className="tag">{FLAVOR_LABEL[f]}</span>)}
                  {o.lessSugar && <span className="tag tag-green">Kurang manis</span>}
                  {o.wfc.plug && <span className="tag-ic" title="Colokan"><IconPlug size={14} /></span>}
                  {o.wfc.wifi && <span className="tag-ic" title="Wi-Fi"><IconWifi size={14} /></span>}
                  {o.wfc.quiet && <span className="tag-ic" title="Tenang"><IconQuiet size={14} /></span>}
                </div>
              </button>
            </li>
          ))}
          {outlets.length === 0 && <li className="empty">Tidak ada kedai yang cocok. Coba kurangi filter.</li>}
        </ul>
        <p className="demo-note small">Data kedai adalah contoh fiktif untuk prototipe.</p>
      </aside>

      <section className="home-map">
        <MapView outlets={outlets} selectedId={selectedId} onSelect={select} userPos={userPos} flyTarget={flyTarget} />
        <button className="fab" data-testid="btn-locate" onClick={locate} aria-label="Lokasi saya"><IconLocate /></button>
        {locMsg && <div className="toast">{locMsg}</div>}

        {selected && (
          <div className="sheet" data-testid="outlet-sheet">
            <button className="icon-btn sheet-close" onClick={() => setSelectedId(null)} aria-label="Tutup"><IconX /></button>
            <h3>{selected.name}</h3>
            <p className="muted">{selected.address} · {selectedKm.toFixed(1)} km</p>
            <div className="sheet-facts">
              <span><IconStar size={15} filled /> {selected.rating.toFixed(1)} rasa</span>
              <span className={isOpenNow(selected) ? 'open' : 'closed'}>{selected.open}–{selected.close}</span>
              {selected.lessSugar && <span className="ok"><IconLeaf size={15} /> Opsi kurang manis</span>}
              {selected.wfc.plug && <span><IconPlug size={15} /> Colokan</span>}
              {selected.wfc.wifi && <span><IconWifi size={15} /> Wi-Fi</span>}
              {selected.wfc.quiet && <span><IconQuiet size={15} /> Tenang</span>}
            </div>
            <h4>Menu inti KopiPass</h4>
            <ul className="menu-list">
              {selected.menu.map((mi) => (
                <li key={mi.id} className={mi.core ? '' : 'non-core'}>
                  <span>{mi.name}</span>
                  <span>{mi.core ? <><s>{rupiah(mi.price)}</s> <b>1 cup</b></> : rupiah(mi.price)}</span>
                </li>
              ))}
            </ul>
            <button className="btn btn-primary btn-block" data-testid="btn-redeem-here" onClick={() => onRedeemAt(selected.id)}>
              <IconQr size={18} /> Tebus di kedai ini
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
