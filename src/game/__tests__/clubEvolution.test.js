import { describe, it, expect } from 'vitest';
import { CLUBS, setWorld, findClub } from '../../data/clubs';
import { evolveClubs, relevantNews, CLUB_DRIFT_LIMIT } from '../world';
import { createInitialPlayer, normalizePlayer, simulateSeasonMatches } from '../career';
import { finalizeSeasonState } from '../season';

// Deterministic rng
const seeded = (seed = 1) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

describe('clubs grow and shrink over the years', () => {
  it('the world stores levels and setWorld applies them (and restores them)', () => {
    setWorld({ rep: { 451: 80.4 } });
    expect(findClub(451).reputation).toBe(80);
    expect(findClub(451).baseReputation).toBe(89);
    setWorld({});
    expect(findClub(451).reputation).toBe(89);
  });

  it('a relegation shrinks a club and a promotion makes it grow', () => {
    const quiet = () => 0.5; // no random events, an average unwatched season
    const down = evolveClubs({}, { moves: [{ clubId: 451, type: 'relegated' }], rng: quiet }).world.rep[451];
    const up = evolveClubs({}, { moves: [{ clubId: 1001, type: 'promoted' }], rng: quiet }).world.rep[1001];
    expect(down).toBeLessThan(89);
    expect(up).toBeGreaterThan(findClub(1001).baseReputation);
  });

  it('your titles make your club bigger', () => {
    const quiet = () => 0.5;
    const without = evolveClubs({}, { playerClubId: 1001, rng: quiet }).world.rep[1001] ?? findClub(1001).baseReputation;
    const withTitles = evolveClubs({}, { playerClubId: 1001, playerTitles: [{ weight: 25 }, { weight: 15 }], rng: quiet }).world.rep[1001];
    expect(withTitles).toBeGreaterThan(without);
  });

  it('big clubs that fall tend to come back', () => {
    const quiet = () => 0.5;
    const fallen = { rep: { 451: 78 } };
    let world = fallen;
    for (let i = 0; i < 10; i++) world = evolveClubs(world, { rng: quiet }).world;
    expect(world.rep[451] ?? 89).toBeGreaterThan(84);
  });

  it('no club ever goes further than the limit from its original level', () => {
    let world = {};
    const rng = seeded(7);
    for (let y = 0; y < 60; y++) { world = evolveClubs(world, { rng }).world; setWorld(world); }
    CLUBS.forEach(c => expect(Math.abs(c.reputation - c.baseReputation)).toBeLessThanOrEqual(CLUB_DRIFT_LIMIT));
    setWorld({});
  });

  it('board events make the news', () => {
    const { news } = evolveClubs({}, { rng: seeded(3) });
    expect(news.length).toBeGreaterThan(0);
    const picked = relevantNews(news, { clubId: 451, leagueId: 'arg_primera', limit: 3 });
    expect(picked.length).toBeLessThanOrEqual(3);
  });

  it('the season close updates the world, your club level and the recap', () => {
    const p = normalizePlayer({ ...createInitialPlayer({ initialClubId: 451 }), offseasonStep: null });
    const { next, recap } = finalizeSeasonState(p, simulateSeasonMatches(p), { finals: [] });
    expect(next.world.rep).toBeTruthy();
    expect(Array.isArray(recap.worldNews)).toBe(true);
    expect(next.currentClub.reputation).toBe(findClub(451).reputation);
    expect(recap.clubLevel.from).toBe(89);
  });
});
