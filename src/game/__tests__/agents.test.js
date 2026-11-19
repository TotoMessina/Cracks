import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createInitialPlayer, normalizePlayer, makeContract, generateTransferOffers, generateOffseasonMarket,
  simulateSeasonMatches, negotiationOdds, getPlayerOverall,
} from '../career';
import { finalizeSeasonState } from '../season';
import {
  AGENTS, getAgent, agentFee, salaryWithTerms, contractPayouts, resaleShare, canChangeAgent, clauseBuyerMult,
} from '../agents';
import { getLeague, getClubById } from '../../data/clubs';

afterEach(() => vi.restoreAllMocks());

// An adult around level 76 at Boca, free to move
const pro = (over = {}) => {
  const p = createInitialPlayer({ initialClubId: 451, country: 'ar' });
  Object.keys(p.stats).forEach(k => { p.stats[k] = 76; });
  return normalizePlayer({ ...p, age: 26, offseasonStep: null, ...over });
};

describe('agents', () => {
  it('a new career and an old save start with the friend from the neighbourhood', () => {
    expect(createInitialPlayer({}).agent).toBe('amigo');
    const old = { ...createInitialPlayer({}) };
    delete old.agent;
    expect(normalizePlayer(old).agent).toBe('amigo');
    expect(getAgent({}).id).toBe('amigo');
  });

  it('the friend struggles to get you abroad; the super-agent opens Europe', () => {
    const abroad = (agent) => {
      let n = 0;
      for (let i = 0; i < 40; i++) {
        n += generateTransferOffers(pro({ agent })).filter(o => getLeague(o.club.league).continent !== 'sa').length;
      }
      return n;
    };
    expect(getPlayerOverall(pro())).toBeLessThan(AGENTS.amigo.abroadLevel);
    expect(abroad('amigo')).toBe(0);
    expect(abroad('super')).toBeGreaterThan(0);
  });

  it('the super-agent brings more offers and squeezes harder', () => {
    const count = (agent) => generateTransferOffers(pro({ agent })).filter(o => !o.isRenewal && !o.isRival && !o.fromAgent).length;
    expect(count('super')).toBe(count('amigo') + 1);
    const p = pro();
    const offer = generateTransferOffers(p).find(o => !o.isRenewal);
    expect(negotiationOdds({ ...p, agent: 'super' }, offer, 'money').accept).toBeGreaterThan(negotiationOdds(p, offer, 'money').accept);
  });

  it('only the super-agent forces exits', () => {
    const forced = (agent) => {
      let n = 0;
      for (let i = 0; i < 60; i++) {
        const m = generateOffseasonMarket(pro({ agent, contract: makeContract(500000, 3), currentClub: getClubById(1001) }));
        n += (m?.offers || []).filter(o => o.forcedByAgent).length;
      }
      return n;
    };
    expect(forced('amigo')).toBe(0);
    expect(forced('super')).toBeGreaterThan(0);
  });

  it('the agent takes his commission from what you earn', () => {
    expect(agentFee({ agent: 'amigo' }, 1000000)).toBe(50000);
    expect(agentFee({ agent: 'super' }, 1000000)).toBe(180000);
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // no media drama, stable season
    const base = pro();
    const season = simulateSeasonMatches(base);
    const money = (agent) => finalizeSeasonState({ ...base, agent }, season, { finals: [] }).next.money;
    expect(money('amigo') - money('super')).toBe(agentFee({ agent: 'super' }, season.earnings) - agentFee({ agent: 'amigo' }, season.earnings));
  });

  it('you can change agent once per season and not mid-season', () => {
    const p = pro();
    expect(canChangeAgent(p)).toBe(true);
    expect(canChangeAgent({ ...p, agentChangedSeason: p.seasonsPlayed })).toBe(false);
    expect(canChangeAgent({ ...p, seasonInProgress: { results: [{}] } })).toBe(false);
  });
});

describe('contract clauses', () => {
  it('a low release clause costs salary and is cheaper to pay; a high one the opposite', () => {
    expect(salaryWithTerms(1000000, { release: 'baja' })).toBe(920000);
    expect(salaryWithTerms(1000000, { release: 'alta' })).toBe(1050000);
    const low = makeContract(1000000, 3, { release: 'baja' });
    const high = makeContract(1000000, 3, { release: 'alta' });
    expect(low.releaseClause).toBeLessThan(makeContract(1000000, 3).releaseClause);
    expect(high.releaseClause).toBeGreaterThan(makeContract(1000000, 3).releaseClause);
    expect(clauseBuyerMult(low)).toBeGreaterThan(clauseBuyerMult(high));
  });

  it('bonuses pay per goal and for qualifying to a cup', () => {
    const p = { position: 'delantero', contract: makeContract(1000000, 3, { bonus: 'primas' }) };
    const pay = contractPayouts(p, { goals: 20 }, { qualified: true });
    expect(pay.perStat).toBe(240000);
    expect(pay.cup).toBe(150000);
    expect(contractPayouts({ ...p, contract: makeContract(1000000, 3) }, { goals: 20 }, { qualified: true }).total).toBe(0);
  });

  it('a share of your next transfer pays when a club pays the clause', () => {
    const c = makeContract(1000000, 3, { resale: 'diez' });
    expect(resaleShare(c)).toBe(Math.round(c.releaseClause * 0.1));
    expect(resaleShare(makeContract(1000000, 3))).toBe(0);
  });

  it('the season close pays the bonuses (minus the agent)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const base = pro({ contract: makeContract(500000, 3, { bonus: 'primas' }), salary: 500000 });
    const season = { ...simulateSeasonMatches(base), goals: 15 };
    const { recap } = finalizeSeasonState(base, season, { finals: [] });
    expect(recap.contractBonus.perStat).toBe(Math.round(500000 * 0.012 * 15));
    expect(recap.agentFee).toBe(agentFee(base, season.earnings + recap.contractBonus.total));
  });
});
