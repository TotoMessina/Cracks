import { describe, it, expect } from 'vitest';
import { generateRivals, advanceRivals, computeAwards, creditRivalAwards, getNemesis, rivalOverall } from '../rivals';
import { createInitialPlayer, normalizePlayer, simulateSeasonMatches, generateKeyMatches } from '../career';
import { finalizeSeasonState } from '../season';
import { findClub } from '../../data/clubs';

const me = (over = {}) => ({ name: 'Yo', position: 'delantero', ovr: 70, goals: 10, assists: 3, cleanSheets: 0, titleWeight: 0, nationalBonus: 0, rep: 75, country: 'ar', ...over });

describe('your generation', () => {
  it('a new career has 18 named rivals and exactly one nemesis like you', () => {
    const p = createInitialPlayer({ position: 'enganche', country: 'ar' });
    expect(p.rivals).toHaveLength(18);
    const nemesis = getNemesis(p);
    expect(nemesis).toMatchObject({ position: 'enganche', age: 16 });
    expect(nemesis.country).not.toBe('ar');
    expect(p.rivals.filter(r => r.nemesis)).toHaveLength(1);
    expect(new Set(p.rivals.map(r => r.name)).size).toBe(18); // unique names
    p.rivals.forEach(r => expect(findClub(r.clubId)).toBeTruthy());
  });

  it('rivals peak around 27-30 and decline later', () => {
    expect(rivalOverall(90, 18)).toBeLessThan(rivalOverall(90, 27));
    expect(rivalOverall(90, 29)).toBe(90);
    expect(rivalOverall(90, 34)).toBeLessThan(90);
  });

  it('a season ages them, gives them stats and replaces the retired ones', () => {
    const rivals = generateRivals(createInitialPlayer({})).map(r => ({ ...r, age: 35 }));
    const { rivals: next, seasonStats } = advanceRivals(rivals, { playerAge: 25 });
    expect(seasonStats).toHaveLength(18);
    expect(next.filter(r => !r.retired).length).toBe(18); // every retirement brought a new kid
    next.filter(r => !r.retired).forEach(r => expect(r.age).toBeLessThanOrEqual(36));
  });

  it('old saves get a generation too', () => {
    const old = { ...createInitialPlayer({}) };
    delete old.rivals;
    delete old.nemesisDuel;
    const p = normalizePlayer(old);
    expect(p.rivals.length).toBeGreaterThan(0);
    expect(p.nemesisDuel).toEqual({ wins: 0, losses: 0 });
  });
});

describe('awards by ranking', () => {
  const rivalsStats = [
    { rivalId: 'a', name: 'Rival A', position: 'delantero', ovr: 92, goals: 35, assists: 8, cleanSheets: 0, titleWeight: 30, clubId: 5001, clubName: 'Real Madrid', country: 'fr' },
    { rivalId: 'b', name: 'Rival B', position: 'arquero', ovr: 88, goals: 0, assists: 0, cleanSheets: 20, titleWeight: 0, clubId: 451, clubName: 'Boca', country: 'br' },
  ];

  it('a modest season loses the Balón de Oro to a star', () => {
    const awards = computeAwards(me(), rivalsStats);
    expect(awards.ballon.winner.name).toBe('Rival A');
    expect(awards.ballon.playerPos).toBeGreaterThan(1);
    expect(awards.boot.top[0].name).toBe('Rival A');
  });

  it('a historic season wins it', () => {
    const awards = computeAwards(me({ ovr: 95, goals: 45, titleWeight: 60, nationalBonus: 25, rep: 97 }), rivalsStats);
    expect(awards.ballon.playerPos).toBe(1);
    expect(awards.boot.playerPos).toBe(1);
  });

  it('only goalkeepers compete for the Golden Glove', () => {
    const awards = computeAwards(me({ position: 'arquero', cleanSheets: 25 }), rivalsStats);
    expect(awards.glove.top.every(r => r.position === 'arquero')).toBe(true);
    expect(awards.glove.playerPos).toBe(1);
  });

  it('rivals keep the prizes they win', () => {
    const rivals = [{ id: 'a', ballons: 0, boots: 0 }, { id: 'b', ballons: 0, boots: 0 }];
    const credited = creditRivalAwards(rivals, computeAwards(me(), rivalsStats));
    expect(credited.find(r => r.id === 'a')).toMatchObject({ ballons: 1, boots: 1 });
  });
});

describe('in the season', () => {
  it('the season close ranks you, records the nemesis duel and advances the rivals', () => {
    const prev = normalizePlayer({ ...createInitialPlayer({ initialClubId: 451 }), offseasonStep: null });
    const { next, recap } = finalizeSeasonState(prev, simulateSeasonMatches(prev), { finals: [] });
    expect(recap.ranking.ballon.top.length).toBe(10);
    expect(recap.ranking.ballon.playerPos).toBeGreaterThan(0);
    expect(recap.nemesis.name).toBe(getNemesis(prev).name);
    expect(next.nemesisDuel.wins + next.nemesisDuel.losses).toBe(1);
    expect(getNemesis(next).age).toBe(getNemesis(prev).age + 1);
  });

  it('the Balón de Oro award only exists when you win the vote', () => {
    const prev = normalizePlayer({ ...createInitialPlayer({ initialClubId: 1001 }), offseasonStep: null });
    const { next, recap } = finalizeSeasonState(prev, simulateSeasonMatches(prev), { finals: [] });
    const won = next.awards.some(a => a.name.startsWith('Balón de Oro'));
    expect(won).toBe(recap.ranking.ballon.playerPos === 1);
  });

  it('key matches against your nemesis club say so', () => {
    const p = createInitialPlayer({ initialClubId: 451 });
    const nemesis = getNemesis(p);
    // put the nemesis at the arch-rival club
    const rivalId = findClub(451).rivals[0];
    const withNemesis = { ...p, rivals: p.rivals.map(r => (r.nemesis ? { ...r, clubId: rivalId } : r)) };
    const derby = generateKeyMatches(withNemesis).find(e => e.kind === 'clasico');
    expect(derby.nemesis).toBe(nemesis.name);
    expect(derby.context).toContain(nemesis.name);
  });
});
