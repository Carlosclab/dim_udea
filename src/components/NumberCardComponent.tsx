'use client';

import { NumberCard } from '@/lib/timsort-engine';

interface Props {
  card: NumberCard;
  color?: string;
  selected?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  done?: boolean;
  onClick?: () => void;
  animationDelay?: number;
  size?: 'sm' | 'md' | 'lg';
  showPointer?: boolean;
}

export default function NumberCardComponent({
  card,
  color = '#026937',
  selected = false,
  highlighted = false,
  dimmed = false,
  done = false,
  onClick,
  animationDelay = 0,
  size = 'md',
  showPointer = false,
}: Props) {
  const sizeClass = size === 'lg' ? 'lg-card-lg' : size === 'sm' ? 'lg-card-sm' : '';

  return (
    <div
      className={`
        lg-card ${sizeClass} lg-appear
        ${selected ? 'lg-card-selected' : ''}
        ${highlighted ? 'lg-card-highlighted' : ''}
        ${dimmed ? 'lg-card-dimmed' : ''}
        ${done ? 'lg-card-done' : ''}
      `}
      style={{
        background: `linear-gradient(145deg, ${color}dd, ${color}99)`,
        border: `0.5px solid ${color}66`,
        boxShadow: selected
          ? `0 12px 32px ${color}44, 0 0 0 2.5px ${color}55, 0 0.5px 0 rgba(255,255,255,0.4) inset`
          : `0 2px 10px ${color}28, 0 0.5px 0 rgba(255,255,255,0.4) inset`,
        animationDelay: `${animationDelay}ms`,
      }}
      onClick={onClick}
    >
      <span>{card.value}</span>
      {showPointer && (
        <div className="lg-card-pointer" style={{ background: color }} />
      )}
    </div>
  );
}
