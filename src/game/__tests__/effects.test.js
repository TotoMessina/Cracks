import { describe, it, expect } from 'vitest';
import { applyEffects, addIdolatry, withStatueCheck, describeEffects, resolveEffectKey } from '../effects';
import { createInitialPlayer } from '../career';
import { deepFreeze } from './helpers';

const striker = () => createInitialPlayer({ position: 'delantero', initialClubId: 1001 });

describe('applyEffects', () => {
  it('returns a new player and never mutates the original', () => {
    const p = deepFreeze(striker());
    const next = applyEffects(p, { definicion: 3, idolatria: 5, dinero: 1000 });
    expect(next).not.toBe(p);
    expect(next.stats.definicion).toBe(p.stats.definicion + 3);
    expect(next.money).toBe(p.money + 1000);
  });

  it('clamps stats, form, money and relationships', () => {
    const p = striker();
    const next = applyEffects(p, { definicion: 500, forma: 10, dinero: -1e9, dt: 999, vestuario: -999 });
    expect(next.stats.definicion).toBe(99);
    expect(next.form).toBe(2);
    expect(next.money).toBe(0);
    expect(next.managerRelationship).toBe(100);
    expect(next.lockerRoomChemistry).toBe(0);
  });

  it('turns leadership into locker room chemistry for positions without that stat', () => {
    const p = striker();
    expect(resolveEffectKey(p, 'liderazgo')).toBe('vestuario');
    const next = applyEffects(p, { liderazgo: 5 });
    expect(next.lockerRoomChemistry).toBe(p.lockerRoomChemistry + 5);
    expect(next.stats.liderazgo).toBeUndefined();
  });

  it('marks stats that do not apply to the position', () => {
    const effects = describeEffects(striker(), { reflejos: 3 });
    expect(effects[0].applies).toBe(false);
  });
});

describe('idolatry and the statue', () => {
  it('has diminishing returns as idolatry grows', () => {
    const lowGain = addIdolatry(10, 10) - 10;
    const highGain = addIdolatry(90, 10) - 90;
    expect(lowGain).toBeGreaterThan(highGain);
    expect(addIdolatry(99, 50)).toBeLessThanOrEqual(100);
    expect(addIdolatry(5, -20)).toBe(0);
  });

  it('needs 95 idolatry AND 5 seasons at the club', () => {
    const base = { ...striker(), idolatry: 98 };
    expect(withStatueCheck(base).hasStatue).toBe(false);
    const veteran = {
      ...base,
      clubHistory: [{ ...base.clubHistory[0], seasons: 5 }],
    };
    const done = withStatueCheck(veteran);
    expect(done.hasStatue).toBe(true);
    expect(done.statueClubId).toBe(base.currentClub.id);
  });
});
