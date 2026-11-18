import { describe, it, expect, afterEach, vi } from 'vitest';
import { resolveDilemmaOption, describeActions } from '../dilemmaEngine';
import { DILEMMAS, getRandomDilemma } from '../../data/dilemmas';
import { createInitialPlayer, normalizePlayer } from '../career';
import { mockRandom } from './helpers';

afterEach(() => vi.restoreAllMocks());

const player = () => normalizePlayer({ ...createInitialPlayer({ initialClubId: 451 }), seasonsPlayed: 5, age: 21 });
const option = (id, i) => {
  const d = DILEMMAS.find(x => x.id === id);
  return [d, d.options[i]];
};

describe('dilemma data', () => {
  it('every dilemma has two options with outcome text', () => {
    DILEMMAS.forEach(d => {
      expect(d.options.length).toBeGreaterThanOrEqual(2);
      d.options.forEach(o => expect(o.outcome || o.actions?.some(a => a.type === 'gamble')).toBeTruthy());
    });
  });

  it('every follow-up action points to an existing follow-up dilemma', () => {
    const ids = new Set(DILEMMAS.map(d => d.id));
    DILEMMAS.flatMap(d => d.options).flatMap(o => o.actions || []).filter(a => a.type === 'followUp')
      .forEach(a => expect(ids.has(a.dilemmaId)).toBe(true));
  });

  it('follow-up-only dilemmas never appear at random', () => {
    const followUps = new Set(DILEMMAS.filter(d => d.followUpOnly).map(d => d.id));
    for (let i = 0; i < 500; i++) expect(followUps.has(getRandomDilemma(player(), []).id)).toBe(false);
  });
});

describe('consequences', () => {
  it('accepting the petrodollars really moves you to Saudi Arabia', () => {
    const [d, o] = option('oferta_petrodolares', 1);
    const { next, result } = resolveDilemmaOption(player(), d, o);
    expect(next.currentClub.league).toBe('sau_pro');
    expect(next.contract.years).toBe(3);
    expect(result.transferredTo.id).toBe(next.currentClub.id);
    expect(next.moments.at(-1).type).toBe('transfer');
  });

  it('the referee rant costs a 2-match suspension next season', () => {
    const [d, o] = option('arbitraje_prensa', 0);
    const { next } = resolveDilemmaOption(player(), d, o);
    expect(next.nextSeasonMods.suspension).toBe(2);
  });

  it('the bribe schedules an investigation for next season', () => {
    const [d, o] = option('apuestas_clandestinas', 1);
    const { next } = resolveDilemmaOption(player(), d, o);
    expect(next.scheduledDilemmas).toEqual([{ id: 'apuestas_investigacion', dueSeason: 6 }]);
    expect(getRandomDilemma(next, []).id).not.toBe('apuestas_investigacion');
    expect(getRandomDilemma({ ...next, seasonsPlayed: 6 }, []).id).toBe('apuestas_investigacion');
  });

  it('crypto is a real gamble', () => {
    const [d, o] = option('inversion_criptos', 0);
    mockRandom(0.01);
    expect(resolveDilemmaOption(player(), d, o).next.money).toBeGreaterThan(player().money);
    vi.restoreAllMocks();
    mockRandom(0.99);
    expect(resolveDilemmaOption(player(), d, o).next.money).toBeLessThan(player().money);
  });

  it('describes lasting consequences before you choose', () => {
    const [, o] = option('cambio_representante', 0);
    expect(describeActions(o).length).toBe(1);
  });
});
