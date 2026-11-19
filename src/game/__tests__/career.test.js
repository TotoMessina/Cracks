import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  createInitialPlayer, normalizePlayer, computeSalary, getPlayerOverall, contractYearsRange, makeContract,
  signingBonus, generateOffseasonMarket, generateTransferOffers, simulateSeasonMatches, getConditionBonus,
  adjustMinigame, getNationalCallUp, getInjuryRisk, energyPerformance,
} from '../career';
import { CLUBS, findClub } from '../../data/clubs';
import { allFinite, mockRandom } from './helpers';

afterEach(() => vi.restoreAllMocks());

describe('createInitialPlayer', () => {
  it.each(['delantero', 'enganche', 'arquero'])('creates a valid %s with a first 3-year contract', (position) => {
    const p = createInitialPlayer({ position, initialClubId: 451 });
    expect(p.age).toBe(16);
    expect(allFinite(p.stats)).toBe(true);
    expect(p.contract).toMatchObject({ years: 3, yearsLeft: 3 });
    expect(p.contract.salary).toBe(p.salary);
    expect(p.moments[0].type).toBe('debut');
    expect(p.offseasonStep).toBe('cards');
  });

  it('wonderkids start better', () => {
    const normal = createInitialPlayer({ archetype: 'normal' });
    const kid = createInitialPlayer({ archetype: 'pibe_maravilla' });
    expect(getPlayerOverall(kid)).toBeGreaterThan(getPlayerOverall(normal));
  });

  it('keeps an invalid difficulty on normal', () => {
    expect(createInitialPlayer({ difficulty: 'imposible' }).difficulty).toBe('normal');
  });
});

describe('normalizePlayer (old saves)', () => {
  it('returns null for broken data', () => {
    expect(normalizePlayer(null)).toBeNull();
    expect(normalizePlayer({ name: 'x' })).toBeNull();
  });

  it('migrates an old "eu_elite" save and fills missing fields', () => {
    const old = {
      name: 'Viejo', seasonsPlayed: 3, position: 'delantero',
      stats: { definicion: 80, potencia: 70, gambeta: 70, resistencia: 70, reflejos: 99 },
      currentClub: { id: 5004, name: 'Manchester City', league: 'eu_elite', reputation: 98 },
    };
    const p = normalizePlayer(old);
    expect(p.currentClub.league).toBe('eng_premier');
    expect(p.stats.reflejos).toBeUndefined(); // stat from another position removed
    expect(p.contract).toBeTruthy();
    expect(p.difficulty).toBe('normal');
    expect(p.workload).toBe('normal');
    expect(Array.isArray(p.moments)).toBe(true);
    expect(p.nationalTeam.status).toBe('none');
  });

  it('a save in the middle of the off-season keeps a free market this year', () => {
    const p = normalizePlayer({ ...createInitialPlayer({}), contract: undefined, offseasonStep: 'dilemma' });
    expect(p.contract.yearsLeft).toBe(0);
  });
});

describe('salaries and contracts', () => {
  it('rich leagues pay more for the same level', () => {
    const arg = findClub(451); // Boca
    const eng = findClub(5004); // Man City
    expect(computeSalary(eng, 80)).toBeGreaterThan(computeSalary(arg, 80));
  });

  it('young players can sign longer contracts', () => {
    expect(contractYearsRange(20).max).toBe(5);
    expect(contractYearsRange(35).max).toBe(2);
  });

  it('builds contracts with a release clause and a signing bonus', () => {
    const c = makeContract(100000, 4);
    expect(c).toMatchObject({ salary: 100000, years: 4, yearsLeft: 4 });
    expect(c.releaseClause).toBeGreaterThan(c.salary);
    expect(signingBonus(100000, 4)).toBe(40000);
  });

  it('a free agent always gets a renewal offer', () => {
    const p = { ...createInitialPlayer({ initialClubId: 451 }), contract: makeContract(50000, 1) };
    p.contract.yearsLeft = 0;
    const market = generateOffseasonMarket(p);
    expect(market.free).toBe(true);
    expect(market.offers.some(o => o.isRenewal)).toBe(true);
  });

  it('under contract with nobody interested there is no market', () => {
    mockRandom(0.99); // no club pays the clause
    // An adult (a kid this far below Boca would get loan offers)
    const p = { ...createInitialPlayer({ initialClubId: 451 }), age: 24 };
    expect(generateOffseasonMarket(p)).toBeNull();
  });

  it('transfer offers never include the current club twice or unknown clubs', () => {
    const p = createInitialPlayer({ initialClubId: 451 });
    const offers = generateTransferOffers(p);
    const ids = offers.filter(o => !o.isRenewal).map(o => o.club.id);
    expect(ids).not.toContain(p.currentClub.id);
    ids.forEach(id => expect(findClub(id)).toBeTruthy());
  });
});

describe('season simulation', () => {
  it('produces finite numbers and a table that includes your club', () => {
    for (const clubId of [1001, 451, 5004, CLUBS.find(c => c.league === 'usa_mls').id]) {
      const r = simulateSeasonMatches(createInitialPlayer({ initialClubId: clubId }));
      expect(r.matches).toBeGreaterThan(0);
      expect(Number.isFinite(r.goals + r.assists + r.cleanSheets + r.earnings)).toBe(true);
      expect(r.leagueStanding.position).toBeGreaterThan(0);
      expect(r.leagueStanding.miniTable.some(t => t.isPlayerTeam)).toBe(true);
    }
  });

  it('rotating means fewer matches than playing everything', () => {
    const base = createInitialPlayer({ initialClubId: 451 });
    const avg = (workload) => {
      let total = 0;
      for (let i = 0; i < 200; i++) total += simulateSeasonMatches({ ...base, workload }).baseMatches;
      return total / 200;
    };
    expect(avg('rotacion')).toBeLessThan(avg('total'));
  });

  it('suspensions from dilemmas are served', () => {
    mockRandom(0.99); // no injury
    const p = { ...createInitialPlayer({ initialClubId: 451 }), nextSeasonMods: { suspension: 6, labels: [] } };
    expect(simulateSeasonMatches(p).missedMatches).toBeGreaterThanOrEqual(6);
  });
});

describe('condition, difficulty and risk', () => {
  it('fresh and in form helps, exhausted hurts', () => {
    expect(getConditionBonus(2, 100).total).toBeGreaterThan(0);
    expect(getConditionBonus(-1, 20).total).toBeLessThan(0);
    expect(energyPerformance(100)).toBe(1);
    expect(energyPerformance(20)).toBeLessThan(1);
  });

  it('Leyenda makes minigames one level harder and Fácil gives a bonus', () => {
    expect(adjustMinigame({ difficulty: 'leyenda' }, 'normal', 0)).toEqual({ difficulty: 'medium', bonus: -5 });
    expect(adjustMinigame({ difficulty: 'leyenda' }, 'hard', 0).difficulty).toBe('hard');
    expect(adjustMinigame({ difficulty: 'facil' }, 'normal', 0)).toEqual({ difficulty: 'normal', bonus: 8 });
  });

  it('Leyenda raises injury risk', () => {
    const p = createInitialPlayer({});
    expect(getInjuryRisk({ ...p, difficulty: 'leyenda' })).toBeGreaterThan(getInjuryRisk({ ...p, difficulty: 'facil' }));
  });

  it('skipping a tournament keeps you out of the next call-up', () => {
    const star = createInitialPlayer({ country: 'ar' });
    Object.keys(star.stats).forEach(k => { star.stats[k] = 82; });
    expect(getNationalCallUp(star)).not.toBeNull();
    expect(getNationalCallUp({ ...star, nationalTeam: { status: 'called', skipNext: true } })).toBeNull();
  });
});
