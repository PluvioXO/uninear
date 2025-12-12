'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface BeamsBackgroundProps {
  beams?: number;
  className?: string;
  blur?: number;
  tilt?: number;
}

const palette = ['#a855f7', '#38bdf8', '#f472b6', '#c084fc', '#34d399'];

const BeamsBackground: React.FC<BeamsBackgroundProps> = ({
  beams = 8,
  className = '',
  blur = 80,
  tilt = -4
}) => {
  const segments = useMemo(() => {
    return Array.from({ length: beams }).map((_, index) => {
      const left = (index / beams) * 100;
      const width = 8 + ((index * 7) % 12);
      const height = 65 + ((index * 13) % 25);
      const color = palette[index % palette.length];
      const delay = (index % 4) * 0.45;
      return { left, width, height, color, delay };
    });
  }, [beams]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 opacity-70 blur-[120px]"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(168,85,247,0.35), transparent 55%)'
        }}
      />
      <div
        className="absolute inset-0"
        style={{ transform: `skewY(${tilt}deg)` }}
      >
        {segments.map(segment => (
          <motion.span
            key={`beam-${segment.left}`}
            className="absolute bottom-0 rounded-full mix-blend-screen"
            style={{
              left: `${segment.left}%`,
              width: `${segment.width}px`,
              height: `${segment.height}%`,
              background: `linear-gradient(180deg, ${segment.color}, transparent)` ,
              filter: `blur(${blur / 4}px)`
            }}
            initial={{ opacity: 0, scaleY: 0.6 }}
            animate={{ opacity: 0.8, scaleY: 1 }}
            transition={{ duration: 1.8, delay: segment.delay, repeat: Infinity, repeatType: 'mirror' }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
    </div>
  );
};

export default BeamsBackground;
