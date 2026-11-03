import { useState } from 'react';
import { Logo, IconStore, IconBean, IconHome, IconTag, IconLeaf, IconBack } from '../components/Icons';
import { login, setRole } from '../store';
import { DEMO_OTP } from '../data/plans';
import { OUTLETS } from '../data/outlets';

const VALUES = [
  { icon: <IconStore />, title: 'Dukung kedai lokal', text: 'Setiap cup yang kamu tebus dibayar langsung ke kedai kopi independen di sekitarmu.' },
  { icon: <IconBean />, title: 'Jelajahi rasa Nusantara', text: 'Gayo, Toraja, Kintamani, Flores. Temukan kedai sesuai profil rasa favoritmu.' },
  { icon: <IconHome />, title: 'Punya kedai andalan', text: 'Kumpulkan stempel, naik level, dan dapat perlakuan khusus dari kedai pilihanmu.' },
  { icon: <IconTag />, title: 'Promo langsung dari kedai', text: 'Cup bonus, diskon pastry, dan jam stempel ganda khusus member.' },
  { icon: <IconLeaf />, title: 'Lebih hemat setiap hari', text: 'Kopi harian hingga 40% lebih murah dari harga menu.' },
];

const ORIGINS = ['Gayo', 'Toraja', 'Kintamani', 'Flores Bajawa', 'Java Preanger'];

export default function Onboarding() {
  const [step, setStep] = useState<'welcome' | 'phone' | 'otp'>('welcome');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const areas = new Set(OUTLETS.map((o) => o.area)).size;

  if (step === 'welcome') {
    return (
      <div className="onboard welcome" data-testid="welcome">
        <div className="onboard-hero">
          <Logo size={68} />
          <p className="eyebrow center">Coffee Culture Indonesia</p>
          <h1>KopiPass Nusantara</h1>
          <p className="lead">Satu kartu untuk merayakan budaya ngopi kita: dari kedai lokal, untuk penikmat kopi Indonesia.</p>
          <div className="origin-row" aria-label="Asal kopi">
            {ORIGINS.map((o) => <span key={o} className="origin">{o}</span>)}
          </div>
        </div>
        <ul className="value-list">
          {VALUES.map((v) => (
            <li key={v.title}>
              <span className="feat-ic">{v.icon}</span>
              <div><b>{v.title}</b><span>{v.text}</span></div>
            </li>
          ))}
        </ul>
        <div className="welcome-stats">
          <div><b>{OUTLETS.length}</b><span>kedai mitra</span></div>
          <div><b>{areas}</b><span>area</span></div>
          <div><b>±40%</b><span>lebih hemat</span></div>
        </div>
        <div className="onboard-actions">
          <button className="btn btn-primary btn-block" data-testid="btn-start" onClick={() => setStep('phone')}>Mulai jelajah</button>
          <p className="hint center">Jelajahi kedai dulu, pilih paket langganan nanti.</p>
          <button className="btn btn-ghost btn-block" data-testid="btn-to-mitra" onClick={() => setRole('mitra')}>Saya pemilik / barista kedai mitra</button>
        </div>
      </div>
    );
  }

  if (step === 'phone') {
    const valid = /^8\d{8,11}$/.test(phone) && name.trim().length >= 2;
    return (
      <div className="onboard" data-testid="login">
        <button className="icon-btn" onClick={() => setStep('welcome')} aria-label="Kembali"><IconBack /></button>
        <h2>Masuk atau daftar</h2>
        <p className="muted">Kode OTP akan dikirim lewat WhatsApp.</p>
        <label className="field">
          <span>Nama panggilan</span>
          <input data-testid="input-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Yudhis" />
        </label>
        <label className="field">
          <span>Nomor WhatsApp</span>
          <div className="phone-input">
            <span>+62</span>
            <input
              data-testid="input-phone"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').replace(/^0/, ''))}
              placeholder="812xxxxxxxx"
            />
          </div>
        </label>
        <button className="btn btn-primary btn-block" data-testid="btn-send-otp" disabled={!valid} onClick={() => setStep('otp')}>Kirim kode OTP</button>
        <p className="hint">Dengan melanjutkan, kamu menyetujui Syarat Layanan dan Kebijakan Privasi KopiPass.</p>
      </div>
    );
  }

  return (
    <div className="onboard" data-testid="otp">
      <button className="icon-btn" onClick={() => setStep('phone')} aria-label="Kembali"><IconBack /></button>
      <h2>Masukkan kode OTP</h2>
      <p className="muted">Dikirim ke WhatsApp +62 {phone}</p>
      <input
        className="otp-input"
        data-testid="input-otp"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
        placeholder="••••••"
      />
      {error && <p className="error">{error}</p>}
      <button
        className="btn btn-primary btn-block"
        data-testid="btn-verify"
        disabled={otp.length !== 6}
        onClick={() => (otp === DEMO_OTP ? login('+62' + phone, name.trim()) : setError('Kode salah. Coba lagi.'))}
      >
        Verifikasi
      </button>
      <div className="demo-note">Mode demo: gunakan kode <b>{DEMO_OTP}</b></div>
    </div>
  );
}
