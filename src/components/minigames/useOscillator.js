import { useEffect, useRef, useState } from 'react';

/**
 * Smooth ping-pong meter driven by requestAnimationFrame.
 * Returns [position (2..98) for rendering, ref with the live value for hit-testing].
 */
export function useOscillator(active, periodMs = 1200) {
  const [pos, setPos] = useState(50);
  const posRef = useRef(50);

  useEffect(() => {
    if (!active) return undefined;
    let raf;
    const start = performance.now();
    const offset = Math.random();
    const tick = (t) => {
      const phase = ((t - start) / periodMs + offset) % 1;
      const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      const p = 2 + tri * 96;
      posRef.current = p;
      setPos(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, periodMs]);

  return [pos, posRef];
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
