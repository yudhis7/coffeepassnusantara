import { useEffect, useState } from 'react';
import { useStore, quotaLeft, totalBonus, nextPopup } from './store';
import Onboarding from './screens/Onboarding';
import Plans from './screens/Plans';
import Home from './screens/Home';
import Redeem from './screens/Redeem';
import Kedaiku from './screens/Kedaiku';
import Promos from './screens/Promos';
import Account from './screens/Account';
import Mitra from './screens/Mitra';
import PromoPopup from './components/PromoPopup';
import { IconMap, IconQr, IconUser, Logo, IconCup, IconHome, IconTag } from './components/Icons';

type Tab = 'peta' | 'kedaiku' | 'tebus' | 'promo' | 'akun';

export default function App() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>('peta');
  const [outletHint, setOutletHint] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState<{ id: string | null; n: number }>({ id: null, n: 0 });
  const [plans, setPlans] = useState<{ open: boolean; outletId: string | null }>({ open: false, outletId: null });
  // Maksimal satu pop-up promo per sesi aplikasi
  const [popupId, setPopupId] = useState<string | null>(null);
  const candidate = s.user && s.role === 'pelanggan' ? nextPopup(s) : undefined;
  useEffect(() => {
    if (!popupId && candidate) setPopupId(candidate.id);
  }, [popupId, candidate]);
  // Kembali ke atas setiap pindah tab / membuka paket
  useEffect(() => {
    document.querySelector('.content')?.scrollTo(0, 0);
  }, [tab, plans.open]);

  if (s.role === 'mitra') return <Mitra />;
  if (!s.user) return <div className="app solo"><Onboarding /></div>;

  const subscribed = !!s.subscription && s.subscription.status !== 'cancelled';
  const openPlans = (outletId: string | null = null) => setPlans({ open: true, outletId: outletId || null });
  const openOutlet = (id: string) => { setMapFocus((f) => ({ id: id || null, n: f.n + 1 })); setPlans((p) => ({ ...p, open: false })); setTab('peta'); };
  const go = (t: Tab) => { setPlans((p) => ({ ...p, open: false })); setTab(t); };
  const popup = !plans.open && popupId && !s.seenPopups.includes(popupId) ? s.promos.find((p) => p.id === popupId) : undefined;
  const bonus = totalBonus(s);

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: 'peta', label: 'Jelajah', icon: <IconMap /> },
    { key: 'kedaiku', label: 'Kedaiku', icon: <IconHome /> },
    { key: 'tebus', label: 'Tebus', icon: <IconQr /> },
    { key: 'promo', label: 'Promo', icon: <IconTag /> },
    { key: 'akun', label: 'Akun', icon: <IconUser /> },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><Logo size={28} /><div><b>KopiPass</b><span>Nusantara</span></div></div>
        {subscribed ? (
          <button className="quota-pill" data-testid="quota-pill" onClick={() => go('tebus')}>
            <IconCup size={16} /> {quotaLeft(s)} cup{bonus ? ` +${bonus}` : ''}
          </button>
        ) : (
          <button className="quota-pill" data-testid="pill-subscribe" onClick={() => openPlans()}>Mulai langganan</button>
        )}
      </header>
      <nav className="nav">
        {tabs.map((t) => (
          <button key={t.key} data-testid={`tab-${t.key}`} className={!plans.open && tab === t.key ? 'on' : ''} onClick={() => go(t.key)}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </nav>
      <main className={`content ${!plans.open && tab === 'peta' ? 'full' : ''}`}>
        {plans.open ? (
          <Plans
            userName={s.user.name}
            initialOutletId={plans.outletId}
            onBack={() => setPlans((p) => ({ ...p, open: false }))}
            onDone={() => { setPlans({ open: false, outletId: null }); setTab('kedaiku'); }}
          />
        ) : (
          <>
            {tab === 'peta' && (
              <Home
                key={mapFocus.n}
                initialSelected={mapFocus.id}
                onRedeemAt={(id) => { setOutletHint(id); setTab('tebus'); }}
                onSubscribeVia={(id) => openPlans(id)}
              />
            )}
            {tab === 'kedaiku' && <Kedaiku onOpenOutlet={openOutlet} onSubscribeVia={(id) => openPlans(id)} />}
            {tab === 'tebus' && <Redeem outletHint={outletHint} onOpenPlans={() => openPlans(outletHint)} />}
            {tab === 'promo' && <Promos onSubscribeVia={(id) => openPlans(id)} onOpenOutlet={openOutlet} />}
            {tab === 'akun' && <Account onOpenPlans={() => openPlans()} />}
          </>
        )}
      </main>
      {popup && <PromoPopup promo={popup} onSubscribeVia={(id) => openPlans(id)} onOpenOutlet={openOutlet} />}
    </div>
  );
}
