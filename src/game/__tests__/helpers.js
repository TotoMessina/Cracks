// Shared helpers for the engine tests
import { vi } from 'vitest';

/** Recursively freezes an object so any mutation throws in strict mode. */
export function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    Object.values(obj).forEach(deepFreeze);
  }
  return obj;
}

/** Makes Math.random return the given values in order (then repeats the last one). */
export function mockRandom(...values) {
  let i = 0;
  return vi.spyOn(Math, 'random').mockImplementation(() => {
    const v = values[Math.min(i, values.length - 1)];
    i += 1;
    return v;
  });
}

export function allFinite(obj) {
  return Object.values(obj).every(v => Number.isFinite(v));
}
