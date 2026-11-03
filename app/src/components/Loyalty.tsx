import { IconCup, IconGift } from './Icons';
import { LEVELS } from '../data/plans';

export function LevelBadge({ name, index }: { name: string; index: number }) {
  return <span className={`level level-${index}`}>{name}</span>;
}

export function LevelProgress({ name, index, cups, next, toNext }: { name: string; index: number; cups: number; next: string | null; toNext: number }) {
  const cur = LEVELS[index].min;
  const nxt = LEVELS[index + 1]?.min ?? cur;
  const pct = next ? ((cups - cur) / (nxt - cur)) * 100 : 100;
  return (
    <div className="level-progress">
      <div className="lp-head">
        <LevelBadge name={name} index={index} />
        <span className="muted small">{next ? `${toNext} cup lagi menuju ${next}` : 'Level tertinggi'}</span>
      </div>
      <div className="bar"><span style={{ width: `${Math.max(4, pct)}%` }} /></div>
    </div>
  );
}

export function StampCard({ progress, target, reward, available }: { progress: number; target: number; reward: string; available: boolean }) {
  return (
    <div className={`stamp-card ${available ? 'ready' : ''}`} data-testid="stamp-card">
      <div className="stamps" aria-label={`${progress} dari ${target} stempel`}>
        {Array.from({ length: target }, (_, i) => (
          <span key={i} className={`stamp ${i < progress ? 'on' : ''}`}>{i < progress ? <IconCup size={16} /> : i + 1}</span>
        ))}
      </div>
      <div className="stamp-reward">
        <IconGift size={16} />
        {available ? <b>Hadiah siap: {reward}. Tunjukkan ke kasir.</b> : <span>{target - progress} stempel lagi: <b>{reward}</b></span>}
      </div>
    </div>
  );
}
