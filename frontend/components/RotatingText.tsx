'use client';

import { MutableRefObject, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface RotatingTextProps {
  texts: string[];
  rotationInterval?: number;
  className?: string;
  splitBy?: 'characters' | 'words';
  staggerDuration?: number;
}

const RotatingText = forwardRef<HTMLSpanElement, RotatingTextProps>(
  (
    {
      texts,
      rotationInterval = 2200,
      className = '',
      splitBy = 'words',
      staggerDuration = 0.04
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      if (texts.length === 0) return undefined;

      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % texts.length);
      }, rotationInterval);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [rotationInterval, texts.length]);

    const splitTokens = useMemo(() => {
      const activeText = texts[currentIndex] ?? '';
      if (splitBy === 'characters') {
        return activeText.split('').map(char => (char === ' ' ? '\u00A0' : char));
      }
      return activeText.split(/(\s+)/).filter(Boolean);
    }, [currentIndex, splitBy, texts]);

    const getDelay = useCallback(
      (index: number) => index * staggerDuration,
      [staggerDuration]
    );

    return (
      <span
        ref={node => {
          containerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as MutableRefObject<HTMLSpanElement | null>).current = node;
        }}
        className={`inline-flex overflow-hidden ${className}`}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={`${currentIndex}-${texts[currentIndex]}`}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-80%', opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex flex-wrap gap-1"
          >
            {splitTokens.map((token, index) => (
              <motion.span
                key={`${token}-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: getDelay(index) }}
                className="inline-block"
              >
                {token}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    );
  }
);

RotatingText.displayName = 'RotatingText';

export default RotatingText;
