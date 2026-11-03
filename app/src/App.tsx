import { useState } from 'react';
import { useStore, quotaLeft } from './store';
import Onboarding from './screens/Onboarding';
import Plans from './screens/Plans';
import Home from './screens/Home';
import Redeem from './screens/Redeem';
import History from './screens/History';
import Account from './screens/Account';
import Mitra from './screens/Mitra';
import { IconMap, IconQr, IconClock, IconUser, Logo, IconCup } from './components/Icons';

type Tab = 'peta' | 'tebus' | 'riwayat' | 'akun';

export default function App() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>('peta');
  const [outletHint, setOutletHint] = useState<string | null>(null);

  if (s.role === 'mitra') return <Mitra />;
  if (!s.user) return <div className="app solo"><Onboarding /></div>;
  if (!s.subscription) return <div className="app solo"><Plans userName={s.user.name} /></div>;

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: 'peta', label: 'Peta', icon: <IconMap /> },
    { key: 'tebus', label: 'Tebus', icon: <IconQr /> },
    { key: 'riwayat', label: 'Riwayat', icon: <IconClock /> },
    { key: 'akun', label: 'Akun', icon: <IconUser /> },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><Logo size={28} /><div><b>KopiPass</b><span>Nusantara</span></div></div>
        <button className="quota-pill" data-testid="quota-pill" onClick={() => setTab('tebus')}>
          <IconCup size={16} /> {quotaLeft(s)} cup
        </button>
      </header>
      <nav className="nav">
        {tabs.map((t) => (
          <button key={t.key} data-testid={`tab-${t.key}`} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </nav>
      <main className={`content ${tab === 'peta' ? 'full' : ''}`}>
        {tab === 'peta' && <Home onRedeemAt={(id) => { setOutletHint(id); setTab('tebus'); }} />}
        {tab === 'tebus' && <Redeem outletHint={outletHint} />}
        {tab === 'riwayat' && <History />}
        {tab === 'akun' && <Account />}
      </main>
    </div>
  );
}
