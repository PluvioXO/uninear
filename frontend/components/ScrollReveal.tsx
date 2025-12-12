'use client';

import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: string;
  containerClassName?: string;
  textClassName?: string;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  stagger?: number;
  start?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  containerClassName = '',
  textClassName = '',
  baseOpacity = 0.2,
  baseRotation = 6,
  blurStrength = 6,
  stagger = 0.05,
  start = 'top bottom-=10%'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/).map((segment, index) => {
      if (segment.trim() === '') {
        return (
          <span key={`space-${index}`} className="inline-block">
            {segment}
          </span>
        );
      }
      return (
        <span key={`word-${index}`} className="rb-scroll-word inline-block">
          {segment}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>('.rb-scroll-word');

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: baseOpacity, rotateX: baseRotation, filter: `blur(${blurStrength}px)` },
        {
          opacity: 1,
          rotateX: 0,
          filter: 'blur(0px)',
          duration: 1,
          ease: 'power3.out',
          stagger,
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: 'play none none reset'
          }
        }
      );
    }, el);

    return () => ctx.revert();
  }, [baseOpacity, baseRotation, blurStrength, stagger, start]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${containerClassName}`}>
      <p className={`flex flex-wrap gap-2 text-balance ${textClassName}`}>{splitText}</p>
    </div>
  );
};

export default ScrollReveal;
