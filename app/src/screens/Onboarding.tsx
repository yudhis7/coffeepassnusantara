import { useState } from 'react';
import { Logo, IconMap, IconQr, IconLeaf, IconBack } from '../components/Icons';
import { login, setRole } from '../store';
import { DEMO_OTP } from '../data/plans';

export default function Onboarding() {
  const [step, setStep] = useState<'welcome' | 'phone' | 'otp'>('welcome');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  if (step === 'welcome') {
    return (
      <div className="onboard" data-testid="welcome">
        <div className="onboard-hero">
          <Logo size={72} />
          <h1>KopiPass Nusantara</h1>
          <p className="lead">Satu langganan, ratusan kedai lokal, kopi harian lebih hemat.</p>
        </div>
        <ul className="feature-list">
          <li><span className="feat-ic"><IconMap /></span><div><b>Temukan kedai mitra</b><span>Peta kedai dengan filter rasa, manis, dan tempat kerja.</span></div></li>
          <li><span className="feat-ic"><IconQr /></span><div><b>Tunjukkan QR, selesai</b><span>Tebus cup di kasir dalam hitungan detik.</span></div></li>
          <li><span className="feat-ic"><IconLeaf /></span><div><b>Hemat hingga 40%</b><span>Harga per cup lebih murah dari harga menu.</span></div></li>
        </ul>
        <div className="onboard-actions">
          <button className="btn btn-primary btn-block" data-testid="btn-start" onClick={() => setStep('phone')}>Mulai</button>
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
