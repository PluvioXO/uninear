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
  accent = '#ea580c',
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
      className={`group relative border border-gray-200 rounded-[2.5rem] p-6 md:p-8 bg-white shadow-sm overflow-hidden transition-all duration-500 hover:border-orange-200 ${className}`}
      style={styleVars}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-multiply"
        style={{
          background: `radial-gradient(circle at var(--spotlight-x) var(--spotlight-y), ${accent}20, transparent 55%)`
        }}
      />
      <div className="relative z-10 space-y-4">
        {badge && (
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gray-500 border border-gray-200 rounded-full bg-gray-50">
            {badge}
          </span>
        )}
        <h3 className="text-2xl md:text-3xl font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-500 text-base md:text-lg">{description}</p>
        {footer && (
          <div className="pt-4 text-sm text-gray-400 border-t border-gray-100">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default SpotlightCard;
