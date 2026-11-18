import { describe, it, expect, afterEach, vi } from 'vitest';
import { finalizeSeasonState } from '../season';
import { createInitialPlayer, simulateSeasonMatches, normalizePlayer } from '../career';
import { CLUBS, getLeague } from '../../data/clubs';
import { deepFreeze, mockRandom } from './helpers';

afterEach(() => vi.restoreAllMocks());

const fresh = (opts = {}) => normalizePlayer({ ...createInitialPlayer({ initialClubId: 451, ...opts }), offseasonStep: null });

describe('finalizeSeasonState', () => {
  it('never mutates the previous player (safe with React StrictMode)', () => {
    const prev = deepFreeze(fresh());
    const season = simulateSeasonMatches(prev);
    expect(() => finalizeSeasonState(prev, season, {})).not.toThrow();
  });

  it('ages the player, adds the stats and spends a contract year', () => {
    const prev = fresh();
    const season = simulateSeasonMatches(prev);
    const { next, recap } = finalizeSeasonState(prev, season, {});
    expect(next.age).toBe(prev.age + 1);
    expect(next.seasonsPlayed).toBe(1);
    expect(next.totalGoals).toBe(prev.totalGoals + season.goals);
    expect(next.contract.yearsLeft).toBe(prev.contract.yearsLeft - 1);
    expect(next.nextSeasonMods).toBeNull();
    expect(recap.year).toBe(2026);
    expect(next.lastRecap).toBe(recap);
  });

  it('winning a final adds the trophy and a highlight', () => {
    const prev = fresh();
    const { next } = finalizeSeasonState(prev, simulateSeasonMatches(prev), { wonFinal: true, tournamentName: 'Copa Argentina' });
    expect(next.trophies.at(-1).title).toBe('Copa Argentina');
    expect(next.moments.some(m => m.type === 'title' && m.text.includes('Copa Argentina'))).toBe(true);
  });

  it('losing a final is remembered too', () => {
    const prev = fresh();
    const { next } = finalizeSeasonState(prev, simulateSeasonMatches(prev), { wonFinal: false, tournamentName: 'Copa Argentina' });
    expect(next.trophies).toHaveLength(0);
    expect(next.moments.some(m => m.type === 'final_lost')).toBe(true);
  });

  it('winning the promotion final moves the club to the top division', () => {
    const championship = CLUBS.find(c => c.league === 'eng_championship');
    const prev = fresh({ initialClubId: championship.id });
    const league = getLeague(championship.league);
    const { next, recap } = finalizeSeasonState(prev, simulateSeasonMatches(prev), { wonFinal: true, tournamentName: league.promotionFinal });
    expect(recap.promotedToPrimera).toBe(true);
    expect(next.currentClub.league).toBe('eng_premier');
    expect(next.moments.some(m => m.type === 'promotion')).toBe(true);
  });

  it('retires at 38 and in Ultra mode after 2 seasons', () => {
    const old = { ...fresh(), age: 37 };
    expect(finalizeSeasonState(old, simulateSeasonMatches(old), {}).next.isRetired).toBe(true);

    let ultra = fresh({ gameMode: 'ultra' });
    ultra = finalizeSeasonState(ultra, simulateSeasonMatches(ultra), {}).next;
    expect(ultra.isRetired).toBe(false);
    ultra = finalizeSeasonState(ultra, simulateSeasonMatches(ultra), {}).next;
    expect(ultra.isRetired).toBe(true);
    expect(ultra.moments.at(-1).type).toBe('retire');
  });

  it('applies the consequences of key matches', () => {
    const prev = fresh();
    mockRandom(0.99);
    const season = {
      ...simulateSeasonMatches(prev),
      keyMatches: [{ kind: 'clasico', title: 'Clásico vs River', won: true, stakes: { win: { idolatria: 6, dt: 3 }, lose: {} } }],
    };
    vi.restoreAllMocks();
    const { next } = finalizeSeasonState(prev, season, {});
    expect(next.clasicosWon).toBe(1);
    expect(next.seasonInProgress).toBeNull();
  });

  it('declining a World Cup keeps you out of the next call-up', () => {
    const prev = { ...fresh(), seasonInProgress: { ntDecision: 'decline' } };
    const { next, recap } = finalizeSeasonState(prev, simulateSeasonMatches(prev), {});
    expect(next.nationalTeam.declined).toBe(1);
    expect(next.nationalTeam.skipNext).toBe(true);
    expect(recap.ntMessages.length).toBeGreaterThan(0);
  });
});
