import { describe, it, expect } from 'vitest';
import {
  createInitialPlayer, normalizePlayer, simulateSeasonMatches, getInjuryRisk, getPlayerOverall,
  applyInjuryChoice, injuryNeedsDecision, marketValue, marketRating, performanceIndex, formatValue,
  generateTransferOffers,
} from '../career';
import { finalizeSeasonState } from '../season';
import { clubRecord, nationalRecord, checkRecords, recordChase, recordStat } from '../records';
import { getCoach, coachMinutesFactor, rollCoachChange, makeCoach, coachFit } from '../coach';
import { challengeStartClub, updateChallenge, CHALLENGES } from '../challenges';
import { computeGlory } from '../../utils/storage';
import { getClubById, getLeague } from '../../data/clubs';

const base = (over = {}) => normalizePlayer({ ...createInitialPlayer({ initialClubId: 451 }), offseasonStep: null, ...over });

describe('injuries with a decision', () => {
  const season = (missed = 12, type = 'moderada') => ({
    matches: 25, missedMatches: missed, goals: 10, assists: 4, cleanSheets: 0, endEnergy: 60,
    injury: { type, name: 'x', desc: 'y', missedMatches: missed, statImpact: type === 'grave' ? { resistencia: -2 } : null },
  });

  it('only long injuries ask for a decision', () => {
    expect(injuryNeedsDecision({ missedMatches: 5 })).toBe(false);
    expect(injuryNeedsDecision({ missedMatches: 12 })).toBe(true);
    expect(injuryNeedsDecision({ missedMatches: 12, choice: 'full' })).toBe(false);
  });

  it('quick recovery without relapse gives back half the matches (and more goals)', () => {
    const r = applyInjuryChoice(season(), 'quick', () => 0.99);
    expect(r.injury.relapse).toBe(false);
    expect(r.matches).toBe(31);
    expect(r.goals).toBeGreaterThan(10);
  });

  it('a relapse costs more matches and resistance', () => {
    const r = applyInjuryChoice(season(), 'quick', () => 0);
    expect(r.injury.relapse).toBe(true);
    expect(r.matches).toBeLessThan(25);
    expect(r.injury.statImpact.resistencia).toBe(-2);
  });

  it('a full recovery keeps the matches lost but leaves no mark', () => {
    const r = applyInjuryChoice(season(20, 'grave'), 'full');
    expect(r.matches).toBe(25);
    expect(r.injury.statImpact).toBeNull();
  });
});

describe('club and national records', () => {
  it('every club has a stable legend for each position', () => {
    const boca = getClubById(451);
    expect(clubRecord(boca, 'delantero')).toEqual(clubRecord(boca, 'delantero'));
    expect(clubRecord(boca, 'delantero').stat).toBe('goals');
    expect(recordStat('arquero')).toBe('cleanSheets');
    expect(recordStat('enganche')).toBe('matches');
    expect(clubRecord(boca, 'delantero').value).toBeGreaterThan(150);
    expect(nationalRecord('ar', 'delantero').value).toBeGreaterThan(30);
  });

  it('beating the legend is announced once', () => {
    const p = base();
    const rec = clubRecord(p.currentClub, p.position);
    const scorer = { ...p, clubHistory: [{ ...p.clubHistory[0], goals: rec.value + 1 }] };
    const first = checkRecords(scorer);
    expect(first.fresh).toHaveLength(1);
    expect(first.fresh[0].text).toContain(rec.holder);
    expect(checkRecords({ ...scorer, recordsBroken: first.recordsBroken }).fresh).toHaveLength(0);
    expect(recordChase({ ...scorer, recordsBroken: first.recordsBroken })[0].broken).toBe(true);
  });

  it('the season close credits the record', () => {
    const p = base();
    const rec = clubRecord(p.currentClub, p.position);
    const prev = { ...p, clubHistory: [{ ...p.clubHistory[0], goals: rec.value - 1 }] };
    const data = { ...simulateSeasonMatches(prev), goals: 10 };
    const { next, recap } = finalizeSeasonState(prev, data, { finals: [] });
    expect(recap.records.length).toBeGreaterThan(0);
    expect(next.recordsBroken).toContain(`club:${p.currentClub.id}`);
    expect(next.moments.some(m => m.type === 'record')).toBe(true);
  });
});

describe('coaches with a personality', () => {
  it('a kids coach gives minutes to kids and takes them from veterans', () => {
    const coach = { ...makeCoach(getClubById(451)), style: 'pibes' };
    expect(coachMinutesFactor(coach, { age: 19 })).toBeGreaterThan(1);
    expect(coachMinutesFactor(coach, { age: 33 })).toBeLessThan(1);
    expect(coachMinutesFactor({ ...coach, style: 'veteranos' }, { age: 33 })).toBeGreaterThan(1);
    expect(coachFit(coach, { age: 19 })).toBe(1);
  });

  it('the coach is stable while you stay and changes with the club', () => {
    const p = base();
    expect(getCoach(p)).toEqual(getCoach(p));
    const other = { ...p, currentClub: getClubById(1001) };
    expect(getCoach(other).clubId).toBe(1001);
  });

  it('a failed season makes a sacking more likely', () => {
    const p = base();
    const sacked = (opts) => Array.from({ length: 400 }, (_, i) => rollCoachChange(p, { ...opts, rng: (() => { let k = i * 7919; return () => ((k = (k * 16807) % 2147483647) / 2147483647); })() }).changed).filter(Boolean).length;
    expect(sacked({ objectiveMet: false })).toBeGreaterThan(sacked({ objectiveMet: true }));
  });

  it('a new coach never repeats the style', () => {
    const p = base();
    const r = rollCoachChange(p, { rng: () => 0 });
    expect(r.changed).toBe(true);
    expect(r.coach.style).not.toBe(r.previous.style);
  });
});

describe('market value', () => {
  it('a great season raises the value and the clubs that come', () => {
    const p = base({ age: 24 });
    const poor = { ...p, seasonHistory: [{ goals: 3, matches: 30 }] };
    const great = { ...p, seasonHistory: [{ goals: 30, matches: 36, wonTitle: true }] };
    expect(performanceIndex(great)).toBeGreaterThan(performanceIndex(poor));
    expect(marketValue(great)).toBeGreaterThan(marketValue(poor));
    expect(marketRating(great)).toBeGreaterThan(getPlayerOverall(great));
    const best = (q) => Math.max(...generateTransferOffers(q).filter(o => !o.isRenewal).map(o => o.club.reputation));
    // over many tries, the top club interested is better after a great season
    let higher = 0;
    for (let i = 0; i < 40; i++) if (best(great) > best(poor)) higher += 1;
    expect(higher).toBeGreaterThan(10);
  });

  it('formats like the game', () => {
    expect(formatValue(72400000)).toBe('$72,4 M');
    expect(formatValue(850000)).toBe('$850 mil');
  });

  it('the season close records the value', () => {
    const p = base();
    const { next, recap } = finalizeSeasonState(p, simulateSeasonMatches(p), { finals: [] });
    expect(next.marketValueHistory).toHaveLength(1);
    expect(recap.marketValue.value).toBe(next.marketValueHistory[0].value);
  });
});

describe('challenges and modifiers', () => {
  it('"Salvá a un chico" starts at the weakest top-flight club', () => {
    const club = challengeStartClub('salvar', 'arg_ascenso');
    expect(getLeague(club.league).secondTier).toBe(false);
    const p = createInitialPlayer({ initialClubId: 1001, challenge: 'salvar' });
    expect(p.currentClub.id).toBe(club.id);
    expect(p.challenge).toMatchObject({ id: 'salvar', status: 'active', clubId: club.id });
  });

  it('"Del ascenso a la gloria" starts in the second tier', () => {
    const p = createInitialPlayer({ initialClubId: 451, challenge: 'ascenso' });
    expect(getLeague(p.currentClub.league).secondTier).toBe(true);
  });

  it('the save challenge is won after 3 seasons and lost with a relegation or leaving', () => {
    const p = createInitialPlayer({ challenge: 'salvar' });
    let ch = p.challenge;
    for (let i = 0; i < 2; i++) ch = updateChallenge({ ...p, challenge: ch }).challenge;
    const done = updateChallenge({ ...p, challenge: ch });
    expect(done.event.status).toBe('done');
    expect(updateChallenge(p, { relegated: true }).event.status).toBe('failed');
    expect(updateChallenge({ ...p, currentClub: getClubById(451) }).event.status).toBe('failed');
  });

  it('winning the big continental cup completes the promotion challenge and adds glory', () => {
    const p = createInitialPlayer({ challenge: 'ascenso' });
    const r = updateChallenge(p, { titles: [{ kind: 'continental', tier: 'main', title: 'Copa Libertadores de América' }] });
    expect(r.event.status).toBe('done');
    const glory = (q) => computeGlory(q).total;
    expect(glory({ ...p, challenge: r.challenge })).toBe(glory(p) + CHALLENGES.ascenso.glory);
  });

  it('glass legs: more injuries, more glory', () => {
    const normal = createInitialPlayer({});
    const glass = { ...normal, modifiers: ['glass'] };
    expect(getInjuryRisk(glass)).toBeGreaterThan(getInjuryRisk(normal));
    const withTitles = (q) => ({ ...q, trophies: [{ weight: 25 }, { weight: 30 }] });
    expect(computeGlory(withTitles(glass)).total).toBeGreaterThan(computeGlory(withTitles(normal)).total);
  });
});
