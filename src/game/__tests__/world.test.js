import { describe, it, expect } from 'vitest';
import { updateWorld, getClubObjective, evaluateObjective, leaguePairs } from '../world';
import { CLUBS, findClub, setWorld } from '../../data/clubs';
import { createInitialPlayer, normalizePlayer, simulateSeasonMatches, generateOffseasonMarket, makeContract } from '../career';
import { finalizeSeasonState } from '../season';
import { createManager, simulateManagerSeason, applyManagerSeason } from '../manager';

const ids = (league) => CLUBS.filter(c => c.league === league).map(c => c.id);
const tableOf = (league) => ids(league).map((clubId, i) => ({ clubId, points: 100 - i }));

describe('promotions and relegations', () => {
  it('only countries with two divisions in the data have them', () => {
    expect(leaguePairs()).toEqual(expect.arrayContaining([
      { top: 'arg_primera', second: 'arg_ascenso' },
      { top: 'eng_premier', second: 'eng_championship' },
    ]));
  });

  it('Argentina: 2 down, 2 up; England: 3 down, 3 up; league sizes stay the same', () => {
    const sizes = { arg_primera: ids('arg_primera').length, eng_premier: ids('eng_premier').length };
    const { world, moves } = updateWorld({}, { playerLeague: 'arg_primera', playerTable: tableOf('arg_primera') });
    const argDown = moves.filter(m => m.from === 'arg_primera');
    const argUp = moves.filter(m => m.to === 'arg_primera');
    const engDown = moves.filter(m => m.from === 'eng_premier');
    const engUp = moves.filter(m => m.to === 'eng_premier');
    expect([argDown.length, argUp.length, engDown.length, engUp.length]).toEqual([2, 2, 3, 3]);
    // the two last of the real table go down
    const real = tableOf('arg_primera');
    expect(argDown.map(m => m.clubId).sort()).toEqual(real.slice(-2).map(r => r.clubId).sort());
    setWorld(world);
    expect(ids('arg_primera').length).toBe(sizes.arg_primera);
    expect(ids('eng_premier').length).toBe(sizes.eng_premier);
  });

  it('a club that goes back to its original league leaves no override behind', () => {
    const relegated = tableOf('arg_primera').at(-1).clubId;
    const { world } = updateWorld({}, { playerLeague: 'arg_primera', playerTable: tableOf('arg_primera') });
    expect(world[relegated]).toBe('arg_ascenso');
    setWorld(world);
    // next year it wins the second division
    const second = [{ clubId: relegated, points: 99 }, ...tableOf('arg_ascenso').filter(r => r.clubId !== relegated)];
    const back = updateWorld(world, { playerLeague: 'arg_ascenso', playerTable: second });
    expect(back.world[relegated]).toBeUndefined();
  });

  it('the player losing the promotion play-off means another club goes up', () => {
    const table = tableOf('arg_ascenso');
    const me = table[2].clubId; // 3rd: play-off
    const { moves } = updateWorld({}, { playerLeague: 'arg_ascenso', playerTable: table, playerClubId: me, playerPromotion: false });
    expect(moves.some(m => m.clubId === me && m.type === 'promoted')).toBe(false);
    const won = updateWorld({}, { playerLeague: 'arg_ascenso', playerTable: table, playerClubId: me, playerPromotion: true });
    expect(won.moves.some(m => m.clubId === me && m.type === 'promoted')).toBe(true);
  });
});

describe('your club goes down', () => {
  it('the club changes division, you can leave for free and the world is saved', () => {
    const p = normalizePlayer({ ...createInitialPlayer({ initialClubId: 452 }), offseasonStep: null }); // Banfield
    const season = simulateSeasonMatches(p);
    const total = season.leagueStanding.totalTeams;
    const forced = {
      ...season,
      competitions: { ...season.competitions, league: { ...season.competitions.league, position: total, relegated: true, champion: false, decider: null } },
      leagueStanding: { ...season.leagueStanding, position: total },
    };
    const { next, recap } = finalizeSeasonState(p, forced, { finals: [] });
    expect(recap.relegated).toBe(true);
    expect(next.currentClub.league).toBe('arg_ascenso');
    expect(next.relegationRelease).toBe(452);
    expect(next.moments.some(m => m.type === 'relegation')).toBe(true);
    // even with years left on the contract, the market is free
    const market = generateOffseasonMarket({ ...next, contract: makeContract(100000, 3) });
    expect(market.free).toBe(true);
    expect(market.released).toBe(true);
    expect(market.offers.find(o => o.isRenewal).loyalRelegation).toBe(true);
  });
});

describe('board objectives', () => {
  it('big clubs must win, small ones must survive, second division clubs must go up', () => {
    expect(getClubObjective(findClub(435)).id).toBe('title'); // River
    expect(getClubObjective(findClub(1001)).id).toMatch(/promote|playoff/); // Chacarita
    const smallest = CLUBS.filter(c => c.league === 'arg_primera').sort((a, b) => a.reputation - b.reputation)[0];
    expect(getClubObjective(smallest).id).toBe('survive');
  });

  it('evaluates the season', () => {
    expect(evaluateObjective({ id: 'survive' }, { position: 29, total: 30, relegated: true })).toBe(false);
    expect(evaluateObjective({ id: 'continental' }, { position: 3, total: 30, qualified: true })).toBe(true);
    expect(evaluateObjective({ id: 'title' }, { position: 2, total: 30, titles: [{ kind: 'cup' }] })).toBe(true);
  });
});

describe('manager mode on the shared engine', () => {
  it('relegation gets you sacked and moves the club down, in the manager world only', () => {
    const m = createManager({ clubId: 452 });
    const r = { ...simulateManagerSeason(m), relegated: true, verdict: 'fired', promoted: false, isChampion: false, titles: [] };
    const next = applyManagerSeason(m, r);
    expect(next.fired).toBe(true);
    expect(next.club.league).toBe('arg_ascenso');
  });

  it('the manager season does not change the player career world', () => {
    setWorld({});
    const before = findClub(452).league;
    simulateManagerSeason({ ...createManager({ clubId: 452 }), world: { 452: 'arg_ascenso' } });
    expect(findClub(452).league).toBe(before);
  });
});
