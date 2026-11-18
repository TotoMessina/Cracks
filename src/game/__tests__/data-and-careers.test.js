import { describe, it, expect } from 'vitest';
import { CLUBS, LEAGUES, findClub, getLeague } from '../../data/clubs';
import { createInitialPlayer, simulateSeasonMatches, generateKeyMatches, autoResolveKeyMatch, getNationalCallUp, generateOffseasonMarket, makeContract } from '../career';
import { finalizeSeasonState } from '../season';
import { applyEffects } from '../effects';
import { drawPreseasonCards } from '../../data/cards';
import { normalizeManager, createManager, simulateManagerSeason, applyManagerSeason } from '../manager';
import { computeGlory } from '../../utils/storage';

describe('club data (from the JSON)', () => {
  it('has unique ids and every league has clubs', () => {
    const ids = CLUBS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    LEAGUES.forEach(l => expect(CLUBS.some(c => c.league === l.id)).toBe(true));
  });

  it('keeps the legacy ids so old saves still work', () => {
    expect(findClub(451).name).toBe('Boca Juniors');
    expect(findClub(1001).name).toBe('Chacarita Juniors');
    expect(findClub(5001).name).toBe('Real Madrid');
  });

  it('every derby points to an existing club', () => {
    CLUBS.forEach(c => c.rivals.forEach(id => expect(findClub(id)).toBeTruthy()));
  });

  it('second divisions promote to an existing league', () => {
    LEAGUES.filter(l => l.secondTier).forEach(l => expect(LEAGUES.some(x => x.id === l.promotesTo)).toBe(true));
  });
});

/** Plays a whole career with automatic decisions. */
function playCareer({ difficulty, position, clubId }) {
  let p = createInitialPlayer({ position, initialClubId: clubId, difficulty });
  let guard = 0;
  while (!p.isRetired && guard < 40) {
    guard += 1;
    p = applyEffects(p, drawPreseasonCards(p.position)[0].effects);
    const call = getNationalCallUp(p);
    p = { ...p, offseasonStep: null, seasonInProgress: { ntDecision: call ? (call.isMajor ? 'go' : 'auto') : null, matches: [], results: [] } };
    p.seasonInProgress.matches = generateKeyMatches(p);
    p.seasonInProgress.results = p.seasonInProgress.matches.map(m => ({ ...m, won: autoResolveKeyMatch(p, m) }));
    const season = simulateSeasonMatches(p);
    const finals = season.finals.map(f => ({ ...f, stage: 'club', won: Math.random() < 0.6 }));
    p = finalizeSeasonState(p, season, { finals }).next;
    const market = generateOffseasonMarket(p);
    if (market) {
      const pick = market.offers.find(o => o.isRenewal) || market.offers[0];
      if (!pick.isStay) p = { ...p, currentClub: pick.club, salary: pick.salary, contract: makeContract(pick.salary, 3) };
    }
  }
  return p;
}

describe('full careers (smoke test)', () => {
  it.each(['facil', 'normal', 'leyenda'])('%s: 9 careers end in retirement with sane numbers', (difficulty) => {
    for (const position of ['delantero', 'enganche', 'arquero']) {
      for (const clubId of [1001, 451, 5004]) {
        const p = playCareer({ difficulty, position, clubId });
        expect(p.isRetired).toBe(true);
        expect(p.age).toBe(38);
        expect(Number.isFinite(p.money)).toBe(true);
        Object.values(p.stats).forEach(v => expect(v).toBeGreaterThanOrEqual(40));
        expect(getLeague(p.currentClub.league).id).toBe(p.currentClub.league);
        expect(computeGlory(p).total).toBeGreaterThan(0);
      }
    }
  });
});

describe('manager mode', () => {
  it('migrates the old save format', () => {
    const m = normalizeManager({ name: 'DT', style: 'bilardo', team: { id: 'boca', name: 'Boca Juniors' }, seasons: 2, wins: 10 });
    expect(m.version).toBe(2);
    expect(m.club.id).toBe(451);
    expect(m.style).toBe('resultadista');
  });

  it('a season produces a full table and a promotion for a second-division champion', () => {
    const club = CLUBS.find(c => c.league === 'arg_ascenso');
    const m = createManager({ clubId: club.id });
    const r = simulateManagerSeason(m);
    expect(r.table.length).toBe(CLUBS.filter(c => c.league === 'arg_ascenso').length);
    const next = applyManagerSeason(m, { ...r, isChampion: true, titles: ['Ascenso'], verdict: 'praised' });
    expect(next.club.league).toBe('arg_primera');
  });
});
