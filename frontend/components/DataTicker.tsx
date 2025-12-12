'use client';

import React, { useMemo } from 'react';

interface DataTickerProps {
  items: Array<{ label: string; value: string; accent?: string } | string>;
  speedSeconds?: number;
  direction?: 'left' | 'right';
  className?: string;
}

const DataTicker: React.FC<DataTickerProps> = ({
  items,
  speedSeconds = 28,
  direction = 'left',
  className = ''
}) => {
  const normalizedItems = useMemo(() => {
    return items.map(item => {
      if (typeof item === 'string') {
        return { label: item, value: '', accent: 'bg-white/60' };
      }
      const { label, value = '', accent = 'bg-white/60' } = item;
      return { label, value, accent };
    });
  }, [items]);

  const loopedItems = useMemo(() => [...normalizedItems, ...normalizedItems], [normalizedItems]);

  return (
    <div className={`w-full overflow-hidden border border-white/10 rounded-full bg-white/5 backdrop-blur px-6 py-3 ${className}`}>
      <div
        className="ticker-track flex items-center gap-8"
        style={{
          animationDuration: `${speedSeconds}s`,
          animationDirection: direction === 'left' ? 'normal' : 'reverse'
        }}
      >
        {loopedItems.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center gap-3 whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full ${item.accent ?? 'bg-purple-400'}`} />
            <span className="text-xs uppercase tracking-[0.4em] text-gray-400">{item.label}</span>
            {item.value && <span className="text-white text-lg font-semibold">{item.value}</span>}
          </div>
        ))}
      </div>
      <style jsx>{`
        .ticker-track {
          animation-name: ticker-scroll;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }

        @keyframes ticker-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default DataTicker;
