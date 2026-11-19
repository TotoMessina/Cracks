import { describe, it, expect } from 'vitest';
import {
  createInitialPlayer, normalizePlayer, getPlayerOverall, makeContract,
  canGoOnLoan, generateLoanOffers, generateOffseasonMarket,
  negotiateOffer, negotiationOdds, offerSignsContract, offerMaxYears,
} from '../career';
import { CLUBS, findClub } from '../../data/clubs';

// A 18-year-old far below a giant (Real Madrid-like: the top club of the world)
const bigClub = () => [...CLUBS].sort((a, b) => b.reputation - a.reputation)[0];
const kidAtGiant = (over = {}) => {
  const p = createInitialPlayer({ position: 'delantero', country: 'ar' });
  return normalizePlayer({
    ...p, age: 18, currentClub: bigClub(), contract: makeContract(100000, 4),
    clubHistory: [{ clubId: bigClub().id, clubName: bigClub().name, seasons: 1, goals: 0, matches: 10, cleanSheets: 0, titles: 0, maxIdolatry: 10 }],
    ...over,
  });
};

describe('loans', () => {
  it('a kid far below his club can be loaned; a veteran or a kid at his level cannot', () => {
    const kid = kidAtGiant();
    expect(bigClub().reputation - getPlayerOverall(kid)).toBeGreaterThan(10);
    expect(canGoOnLoan(kid)).toBe(true);
    expect(canGoOnLoan({ ...kid, age: 26 })).toBe(false);
    const modest = [...CLUBS].find(c => Math.abs(c.reputation - getPlayerOverall(kid)) <= 3);
    expect(canGoOnLoan({ ...kid, currentClub: modest })).toBe(false);
  });

  it('loan offers go to smaller clubs, keep your contract and avoid the rival', () => {
    const kid = kidAtGiant();
    const offers = generateLoanOffers(kid);
    expect(offers.length).toBeGreaterThan(0);
    offers.forEach(o => {
      expect(o).toMatchObject({ isLoan: true, keepsContract: true, salary: 100000 });
      expect(o.club.reputation).toBeLessThanOrEqual(kid.currentClub.reputation - 8);
      expect(kid.currentClub.rivals || []).not.toContain(o.club.id);
      expect(offerSignsContract(o)).toBe(false);
    });
  });

  it('under contract, the market offers the loan next to staying', () => {
    const market = generateOffseasonMarket(kidAtGiant());
    expect(market.free).toBe(false);
    expect(market.offers[0].isStay).toBe(true);
    expect(market.offers.some(o => o.isLoan)).toBe(true);
  });

  it('at the end of the loan you choose: go back (same contract) or be sold', () => {
    const parent = bigClub();
    const kid = kidAtGiant();
    const smaller = generateLoanOffers(kid)[0].club;
    const onLoan = {
      ...kid, age: 19, currentClub: smaller, contract: makeContract(100000, 3),
      loan: { parentClubId: parent.id, parentClubName: parent.name, parentIdolatry: 20, year: 2026 },
    };
    const market = generateOffseasonMarket(onLoan);
    expect(market.loanEnd).toBe(true);
    const back = market.offers.find(o => o.isLoanReturn);
    expect(back.club.id).toBe(parent.id);
    expect(back.keepsContract).toBe(true);
    // The loan club buys you only if you were important there
    const buy = market.offers.find(o => o.isLoanBuy);
    if (buy) {
      expect(buy.club.id).toBe(smaller.id);
      expect(offerSignsContract(buy)).toBe(true);
      expect(buy.maxYears).toBeGreaterThan(0);
    }
  });

  it('if the contract ran out during the loan, going back means a new contract', () => {
    const parent = bigClub();
    const kid = kidAtGiant();
    const onLoan = {
      ...kid, currentClub: generateLoanOffers(kid)[0].club, contract: { ...makeContract(100000, 1), yearsLeft: 0 },
      loan: { parentClubId: parent.id, parentClubName: parent.name, parentIdolatry: 20, year: 2026 },
    };
    const market = generateOffseasonMarket(onLoan);
    expect(market.free).toBe(true);
    const back = market.offers.find(o => o.isLoanReturn);
    expect(back.keepsContract).toBeFalsy();
    expect(offerSignsContract(back)).toBe(true);
  });
});

describe('contract negotiation', () => {
  const free = () => normalizePlayer({ ...createInitialPlayer({ initialClubId: 451 }), age: 27, contract: { ...makeContract(500000, 1), yearsLeft: 0 } });
  const transferOffer = (p) => generateOffseasonMarket(p).offers.find(o => !o.isRenewal && !o.isRival);

  it('every offer that signs a contract says how many years the club gives', () => {
    const p = free();
    generateOffseasonMarket(p).offers.forEach(o => expect(o.maxYears).toBe(offerMaxYears(p, o)));
  });

  it('asking for a lot is riskier than asking a little', () => {
    const p = free();
    const o = transferOffer(p);
    expect(negotiationOdds(p, o, 'bigMoney').accept).toBeLessThan(negotiationOdds(p, o, 'money').accept);
  });

  it('accepted: better salary; countered: half; withdrawn: the offer is gone', () => {
    const p = free();
    const o = transferOffer(p);
    const yes = negotiateOffer(p, o, 'money', { rng: () => 0 });
    expect(yes.outcome).toBe('accepted');
    expect(yes.offer.salary).toBeGreaterThan(o.salary * 1.14);

    const odds = negotiationOdds(p, o, 'money');
    const meh = negotiateOffer(p, o, 'money', { rng: () => odds.accept + odds.counter / 2 });
    expect(meh.outcome).toBe('countered');
    expect(meh.offer.salary).toBeLessThan(yes.offer.salary);
    expect(meh.offer.salary).toBeGreaterThan(o.salary);

    const no = negotiateOffer(p, o, 'money', { rng: () => 0.999 });
    expect(no.outcome).toBe('withdrawn');
    expect(no.offer.withdrawn).toBe(true);
  });

  it('more years raises the length the club offers', () => {
    const p = free();
    const o = transferOffer(p);
    const r = negotiateOffer(p, o, 'years', { rng: () => 0 });
    expect(r.offer.maxYears).toBe(o.maxYears + 1);
  });

  it('only one try per offer, and your last option is never withdrawn', () => {
    const p = free();
    const o = transferOffer(p);
    const once = negotiateOffer(p, o, 'money', { rng: () => 0 }).offer;
    expect(negotiateOffer(p, once, 'money', { rng: () => 0 }).outcome).toBeNull();
    expect(negotiateOffer(p, o, 'bigMoney', { rng: () => 0.999, canWithdraw: false }).outcome).toBe('countered');
  });

  it('you cannot negotiate a loan or staying with your contract', () => {
    const kid = kidAtGiant();
    const market = generateOffseasonMarket(kid);
    market.offers.filter(o => o.isStay || o.isLoan).forEach(o => {
      expect(negotiateOffer(kid, o, 'money', { rng: () => 0 }).outcome).toBeNull();
    });
  });

  it('findClub still finds the clubs used here', () => {
    expect(findClub(451)).toBeTruthy();
  });
});
