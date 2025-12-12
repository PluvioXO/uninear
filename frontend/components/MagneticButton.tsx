'use client';

import Link from 'next/link';
import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';

interface MagneticButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  label: string;
  href?: string;
  subtitle?: string;
  strength?: number;
  className?: string;
  accentClassName?: string;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({
  label,
  href,
  subtitle,
  strength = 0.4,
  className = '',
  accentClassName = 'from-purple-400/80 via-purple-500/70 to-blue-500/80',
  ...buttonProps
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0, isActive: false });

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relativeX = event.clientX - rect.left - rect.width / 2;
    const relativeY = event.clientY - rect.top - rect.height / 2;
    setOffset({
      x: relativeX * strength,
      y: relativeY * strength,
      isActive: true
    });
  }, [strength]);

  const reset = useCallback(() => {
    setOffset(prev => ({ ...prev, x: 0, y: 0, isActive: false }));
  }, []);

  const content = (
    <motion.button
      ref={buttonRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerDown={handlePointerMove}
      onPointerUp={reset}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, mass: 0.5 }}
      className={`relative px-8 py-4 rounded-full font-semibold text-lg uppercase tracking-wide overflow-hidden group ${className}`}
      {...buttonProps}
    >
      <span className={`absolute inset-[-40%] blur-3xl opacity-60 transition-opacity duration-300 ${accentClassName}`} />
      <span className="relative z-10 flex flex-col items-center">
        <span>{label}</span>
        {subtitle && (
          <span className="text-xs font-normal tracking-[0.3em] text-white/70 mt-1">
            {subtitle}
          </span>
        )}
      </span>
    </motion.button>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
};

export default MagneticButton;
