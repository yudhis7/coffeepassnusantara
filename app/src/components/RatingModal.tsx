import { useState } from 'react';
import { IconStar } from './Icons';
import { rate } from '../store';

const TAGS = ['Mantap', 'Pas manisnya', 'Terlalu manis', 'Encer', 'Enak buat kerja'];

export default function RatingModal({ redemptionId, outletName, onClose }: { redemptionId: string; outletName: string; onClose: () => void }) {
  const [score, setScore] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" data-testid="rating-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Gimana rasanya?</h3>
        <p className="muted">{outletName}</p>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} data-testid={`star-${n}`} className={n <= score ? 'on' : ''} onClick={() => setScore(n)} aria-label={`${n} bintang`}>
              <IconStar size={34} filled={n <= score} />
            </button>
          ))}
        </div>
        <div className="chips center">
          {TAGS.map((t) => (
            <button key={t} className={`chip ${tags.includes(t) ? 'on' : ''}`} onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}>
              {t}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-block" data-testid="btn-send-rating" disabled={!score} onClick={() => { rate(redemptionId, score, tags); onClose(); }}>
          Kirim rating
        </button>
        <button className="btn btn-ghost btn-block" onClick={onClose}>Nanti saja</button>
      </div>
    </div>
  );
}
