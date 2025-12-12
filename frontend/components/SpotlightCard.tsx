'use client';

import React, { useCallback, useRef, useState } from 'react';

interface SpotlightCardProps {
  title: string;
  description: string;
  badge?: string;
  footer?: string;
  accent?: string;
  className?: string;
}

type SpotlightStyle = React.CSSProperties & {
  '--spotlight-x'?: string;
  '--spotlight-y'?: string;
};

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  title,
  description,
  badge,
  footer,
  accent = '#a855f7',
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 50, y: 50 });

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setCoords({ x, y });
  }, []);

  const styleVars: SpotlightStyle = {
    '--spotlight-x': `${coords.x}%`,
    '--spotlight-y': `${coords.y}%`
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setCoords({ x: 50, y: 50 })}
      className={`group relative border border-white/10 rounded-[2.5rem] p-6 md:p-8 bg-white/5 backdrop-blur-lg overflow-hidden transition-all duration-500 hover:border-white/40 ${className}`}
      style={styleVars}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at var(--spotlight-x) var(--spotlight-y), ${accent}, transparent 55%)`
        }}
      />
      <div className="relative z-10 space-y-4">
        {badge && (
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70 border border-white/20 rounded-full">
            {badge}
          </span>
        )}
        <h3 className="text-2xl md:text-3xl font-semibold text-white">{title}</h3>
        <p className="text-gray-300 text-base md:text-lg">{description}</p>
        {footer && (
          <div className="pt-4 text-sm text-white/70 border-t border-white/10">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default SpotlightCard;
