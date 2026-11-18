import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  qualificationForPosition, computeQualification, getContinentalEntry, simulateContinental, simulateDomesticCup,
  leagueOutcome, buildFinals, domesticCupName, estimatedQualification, TITLE_WEIGHT,
} from '../competitions';
import { CLUBS, findClub, getLeague } from '../../data/clubs';
import { createInitialPlayer, normalizePlayer, simulateSeasonMatches } from '../career';
import { finalizeSeasonState } from '../season';
import { mockRandom } from './helpers';

afterEach(() => vi.restoreAllMocks());

const boca = findClub(451);
const chacarita = findClub(1001);
const city = findClub(5004);

describe('qualification', () => {
  it('Premier: top 4 Champions, then Europa League, then Conference', () => {
    expect(qualificationForPosition('eng_premier', 1).name).toBe('UEFA Champions League');
    expect(qualificationForPosition('eng_premier', 5).name).toBe('UEFA Europa League');
    expect(qualificationForPosition('eng_premier', 7).name).toBe('UEFA Conference League');
    expect(qualificationForPosition('eng_premier', 12)).toBeNull();
  });

  it('Argentina: Libertadores and Sudamericana', () => {
    expect(qualificationForPosition('arg_primera', 2).name).toBe('Copa Libertadores de América');
    expect(qualificationForPosition('arg_primera', 8).name).toBe('Copa Sudamericana');
  });

  it('second divisions never qualify by the table', () => {
    expect(qualificationForPosition('arg_ascenso', 1)).toBeNull();
  });

  it('winning the Copa Argentina from the second division gives the Libertadores', () => {
    const q = computeQualification(chacarita, null, true);
    expect(q).toMatchObject({ clubId: chacarita.id, tier: 'main', name: 'Copa Libertadores de América', viaCup: true });
  });

  it('winning the FA Cup gives the Europa League unless the table gave more', () => {
    expect(computeQualification(city, 10, true).name).toBe('UEFA Europa League');
    expect(computeQualification(city, 1, true).name).toBe('UEFA Champions League');
  });

  it('a new club without history is estimated from its reputation', () => {
    expect(estimatedQualification(findClub(5001)).tier).toBe('main'); // Real Madrid
  });

  it('the stored qualification only applies to the club that earned it', () => {
    const p = { ...createInitialPlayer({ initialClubId: 451 }), qualifiedFor: { clubId: 451, tier: null, name: null } };
    expect(getContinentalEntry(p)).toBeNull();
    const moved = { ...p, currentClub: city };
    expect(getContinentalEntry(moved)?.tier).toBe('main');
  });
});

describe('cups', () => {
  it('the national cup of a second division is the top division cup', () => {
    expect(domesticCupName('arg_ascenso')).toBe('Copa Argentina');
    expect(domesticCupName('eng_championship')).toBe('FA Cup');
  });

  it('the Copa Argentina only has Argentine clubs', () => {
    for (let i = 0; i < 50; i++) {
      const cup = simulateDomesticCup(chacarita, 70, 0);
      if (cup.eliminatedBy) expect(getLeague(CLUBS.find(c => c.name === cup.eliminatedBy).league).country).toBe('ar');
    }
  });

  it('international cups: group stage, knockouts and a final', () => {
    mockRandom(0.01); // win everything
    const res = simulateContinental({ tier: 'main', name: 'Copa Libertadores de América' }, boca, 90, 0);
    expect(res.group.advanced).toBe(true);
    expect(res.final.opponent).toBeTruthy();
  });

  it('weights: Champions > league > cup > Conference', () => {
    expect(TITLE_WEIGHT.continental_main).toBeGreaterThan(TITLE_WEIGHT.league);
    expect(TITLE_WEIGHT.league).toBeGreaterThan(TITLE_WEIGHT.cup);
    expect(TITLE_WEIGHT.cup).toBeGreaterThan(TITLE_WEIGHT.continental_third);
  });
});

describe('league by the table', () => {
  const table = (pts) => pts.map((p, i) => ({ name: `T${i}`, points: p, isPlayerTeam: i === 0 }));

  it('clear leader = champion, close race = last match day decider', () => {
    expect(leagueOutcome(boca, table([80, 60, 50]), 1)).toMatchObject({ champion: true, decider: null });
    expect(leagueOutcome(boca, table([80, 78, 50]), 1).decider).toMatchObject({ opponent: 'T1', leading: true });
  });

  it('second division: 1st promotes directly, 2nd-5th play the promotion final', () => {
    expect(leagueOutcome(chacarita, table([70, 60, 50]), 1).directPromotion).toBe(true);
    expect(leagueOutcome(chacarita, table([70, 60, 50]), 3).playoff).toBe(true);
  });

  it('finals come in calendar order', () => {
    const finals = buildFinals(boca, {
      cup: { name: 'Copa Argentina', final: { opponent: 'River Plate', opponentRep: 89 } },
      continental: { name: 'Copa Libertadores de América', tier: 'main', final: { opponent: 'Flamengo', opponentRep: 90 } },
      league: { decider: { opponent: 'River Plate' } },
    });
    expect(finals.map(f => f.kind)).toEqual(['cup', 'continental', 'league']);
    expect(finals[1].difficulty).toBe('hard');
  });
});

describe('season with several finals', () => {
  it('each final won is a trophy with its weight, and qualification is stored', () => {
    const prev = normalizePlayer({ ...createInitialPlayer({ initialClubId: 451 }), offseasonStep: null });
    const season = simulateSeasonMatches(prev);
    const { next, recap } = finalizeSeasonState(prev, season, {
      finals: [
        { stage: 'club', kind: 'cup', tournament: 'Copa Argentina', won: true, weight: 15, opponent: 'River Plate' },
        { stage: 'club', kind: 'continental', tier: 'main', tournament: 'Copa Libertadores de América', won: false, weight: 30, opponent: 'Flamengo' },
      ],
    });
    const cupTrophy = next.trophies.find(t => t.title === 'Copa Argentina');
    expect(cupTrophy).toMatchObject({ kind: 'cup', weight: 15 });
    expect(next.trophies.some(t => t.title.includes('Libertadores'))).toBe(false);
    expect(next.moments.some(m => m.type === 'final_lost' && m.text.includes('Flamengo'))).toBe(true);
    expect(recap.qualifiedFor.clubId).toBe(451);
    expect(recap.qualifiedFor.tier).toBe('main'); // the cup gives the Libertadores in Argentina
  });

  it('winning the last-match-day decider from 2nd puts you 1st in the table', () => {
    const prev = normalizePlayer({ ...createInitialPlayer({ initialClubId: 451 }), offseasonStep: null });
    const season = {
      ...simulateSeasonMatches(prev),
      leagueStanding: {
        league: 'arg_primera', position: 2, points: 67, totalTeams: 30,
        miniTable: [{ pos: 1, name: 'Racing', points: 70, isPlayerTeam: false }, { pos: 2, name: 'Boca', points: 67, isPlayerTeam: true }],
      },
    };
    const { recap } = finalizeSeasonState(prev, season, {
      finals: [{ stage: 'club', kind: 'league', tournament: 'Liga Profesional', won: true, weight: 25, opponent: 'Racing Club' }],
    });
    expect(recap.leagueStanding.position).toBe(1);
    expect(recap.leagueStanding.miniTable[0].name).toBe('Boca');
  });
});
