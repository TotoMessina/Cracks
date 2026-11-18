import { describe, it, expect } from 'vitest';
import { buildSupercups, TITLE_WEIGHT } from '../competitions';
import { createInitialPlayer, normalizePlayer, simulateSeasonMatches, seasonOpeners } from '../career';
import { finalizeSeasonState } from '../season';
import { findClub, getLeague } from '../../data/clubs';

const boca = findClub(451);
const chacarita = findClub(1001);
const realMadrid = findClub(5001);
const table = [{ name: 'Boca', points: 80 }, { name: 'River', points: 75 }];

describe('who plays which supercup', () => {
  it('league champion plays the Supercopa Argentina', () => {
    const sc = buildSupercups(boca, [{ kind: 'league' }], table);
    expect(sc).toHaveLength(1);
    expect(sc[0]).toMatchObject({ kind: 'supercup', tournament: 'Supercopa Argentina', clubId: 451 });
  });

  it('league + cup double: you face the league runner-up', () => {
    const sc = buildSupercups(boca, [{ kind: 'league' }, { kind: 'cup' }], table);
    expect(sc[0].opponent.name).toBe('River Plate');
  });

  it('Copa Argentina winner from the second division plays the Supercopa Argentina', () => {
    const sc = buildSupercups(chacarita, [{ kind: 'cup' }], []);
    expect(sc[0].tournament).toBe('Supercopa Argentina');
    expect(getLeague(findClub(sc[0].opponent.id).league).id).toBe('arg_primera');
  });

  it('Libertadores champion: Recopa Sudamericana + Intercontinental against a European giant', () => {
    const sc = buildSupercups(boca, [{ kind: 'continental', tier: 'main' }], table);
    expect(sc.map(s => s.tournament)).toEqual(['Recopa Sudamericana', 'Copa Intercontinental']);
    expect(getLeague(findClub(sc[1].opponent.id).league).continent).toBe('eu');
    expect(sc[1].weight).toBe(TITLE_WEIGHT.intercontinental);
  });

  it('Champions winner faces a South American club; Europa League winner plays the UEFA Super Cup', () => {
    const champions = buildSupercups(realMadrid, [{ kind: 'continental', tier: 'main' }], []);
    expect(getLeague(findClub(champions.find(s => s.kind === 'intercontinental').opponent.id).league).continent).toBe('sa');
    const europa = buildSupercups(realMadrid, [{ kind: 'continental', tier: 'second' }], []);
    expect(europa.map(s => s.tournament)).toEqual(['Supercopa de la UEFA']);
  });

  it('nothing won, nothing to play', () => {
    expect(buildSupercups(boca, [], table)).toEqual([]);
  });
});

describe('supercups in a career', () => {
  it('are earned at season end and only open the next season if you stay at the club', () => {
    const prev = normalizePlayer({ ...createInitialPlayer({ initialClubId: 451 }), offseasonStep: null });
    const { next } = finalizeSeasonState(prev, simulateSeasonMatches(prev), {
      finals: [{ stage: 'club', kind: 'cup', tournament: 'Copa Argentina', won: true, weight: 15, opponent: 'River Plate' }],
    });
    expect(next.pendingSupercups.some(sc => sc.tournament === 'Supercopa Argentina')).toBe(true);
    expect(seasonOpeners(next).length).toBeGreaterThan(0);
    expect(seasonOpeners({ ...next, currentClub: realMadrid })).toEqual([]);
  });

  it('winning the supercup key match adds the trophy without boosting the season', () => {
    const prev = normalizePlayer({ ...createInitialPlayer({ initialClubId: 451 }), offseasonStep: null });
    const opener = { ...seasonOpeners({ ...prev, pendingSupercups: buildSupercups(boca, [{ kind: 'league' }], table) })[0], won: true };
    const withSip = { ...prev, seasonInProgress: { matches: [opener], results: [opener] } };
    const season = simulateSeasonMatches(withSip);
    const { next } = finalizeSeasonState(withSip, season, { finals: [] });
    expect(next.trophies.some(t => t.title === 'Supercopa Argentina' && t.kind === 'supercup')).toBe(true);
  });
});
