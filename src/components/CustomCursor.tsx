import React, { useEffect, useRef, useState } from 'react';

export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    setEnabled(true);

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let rafId = 0;

    const tick = () => {
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const handleMove = (event: MouseEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      setVisible(true);

      const target = event.target as HTMLElement | null;
      const isInteractiveTarget = Boolean(
        target?.closest('a, button, input, select, textarea, [role="button"]')
      );
      setInteractive(isInteractiveTarget);
    };

    const handleLeave = () => {
      setVisible(false);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[90] transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full border border-[#D9A441]/75 transition-[width,height,border-color,background-color] duration-150 ${
          interactive
            ? 'h-10 w-10 bg-[#D9A441]/10 border-[#D9A441]'
            : 'h-7 w-7 bg-transparent'
        }`}
      />
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full bg-[#D9A441] transition-[width,height] duration-150 ${
          interactive ? 'h-1.5 w-1.5' : 'h-1 w-1'
        }`}
      />
    </div>
  );
}
