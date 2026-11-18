// Real season structure: league decided by the table, national cup (open to second divisions),
// international cups by tier (Champions / Europa / Conference, Libertadores / Sudamericana, ...)
// and qualification for next season from the final league position or winning the cup.
import { CLUBS, CONTINENTAL_COMPETITIONS, CONTINENTAL_SUPERCUP, INTERCONTINENTAL, getLeague } from '../data/clubs';

const TIER_INDEX = { main: 0, second: 1, third: 2 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** How much each title is worth (glory points, idolatry, prize money). */
export const TITLE_WEIGHT = {
  continental_main: 30, continental_second: 18, continental_third: 12,
  league: 25, cup: 15, promotion: 15,
  supercup: 8, continental_supercup: 12, intercontinental: 30,
};

export function competitionName(continent, tier) {
  const list = CONTINENTAL_COMPETITIONS[continent] || [];
  return list[TIER_INDEX[tier]] || null;
}

export function domesticCupName(leagueId) {
  const league = getLeague(leagueId);
  return league.secondTier && league.promotesTo ? getLeague(league.promotesTo).cup : league.cup;
}

/** Which competition a final league position gives access to. */
export function qualificationForPosition(leagueId, position) {
  const league = getLeague(leagueId);
  if (league.secondTier) return null;
  const { main = 0, second = 0, third = 0 } = league.slots || {};
  let tier = null;
  if (position <= main) tier = 'main';
  else if (position <= main + second) tier = 'second';
  else if (position <= main + second + third) tier = 'third';
  if (!tier) return null;
  const name = competitionName(league.continent, tier);
  return name ? { tier, name } : null;
}

/** Qualification for a club we have no previous table for: estimated from its reputation rank in its league. */
export function estimatedQualification(club) {
  if (!club) return null;
  const leagueClubs = CLUBS.filter(c => c.league === club.league).sort((a, b) => b.reputation - a.reputation);
  const rank = leagueClubs.findIndex(c => c.id === club.id) + 1 || leagueClubs.length;
  return qualificationForPosition(club.league, rank);
}

/** The international competition the player's club plays this season (or null). */
export function getContinentalEntry(player) {
  const club = player?.currentClub;
  if (!club) return null;
  const q = player.qualifiedFor;
  // Qualified last season with this same club (table position or winning the cup)
  if (q && q.clubId === club.id) return q.tier ? { tier: q.tier, name: q.name } : null;
  // New club / old save: estimate from the club's standing in its league
  if (getLeague(club.league).secondTier) return null;
  return estimatedQualification(club);
}

/** Next season's qualification after the table and the cup. */
export function computeQualification(club, leaguePosition, wonCup) {
  const league = getLeague(club.league);
  let q = leaguePosition ? qualificationForPosition(club.league, leaguePosition) : null;
  if (wonCup) {
    // The cup belongs to the top division (Copa Argentina, FA Cup...): its rules apply even to second-division winners
    const cupLeague = league.secondTier && league.promotesTo ? getLeague(league.promotesTo) : league;
    const cupTier = cupLeague.cupTo || 'second';
    const cupQ = competitionName(cupLeague.continent, cupTier) ? { tier: cupTier, name: competitionName(cupLeague.continent, cupTier) } : null;
    if (cupQ && (!q || TIER_INDEX[cupQ.tier] < TIER_INDEX[q.tier])) q = { ...cupQ, viaCup: true };
  }
  return { clubId: club.id, tier: q?.tier || null, name: q?.name || null, viaCup: Boolean(q?.viaCup) };
}

/** Pool of clubs that play a given continental competition (by reputation band within the continent). */
function continentalPool(continent, tier, excludeId) {
  const clubs = CLUBS
    .filter(c => getLeague(c.league).continent === continent && !getLeague(c.league).secondTier && c.id !== excludeId)
    .sort((a, b) => b.reputation - a.reputation);
  const [from, to] = tier === 'main' ? [0, 40] : tier === 'second' ? [25, 90] : [50, 140];
  const band = clubs.slice(from, to);
  return band.length >= 8 ? band : clubs;
}

export function pickContinentalOpponent(player, entry) {
  const club = player.currentClub;
  const pool = continentalPool(getLeague(club.league).continent, entry.tier, club.id).filter(c => c.league !== club.league);
  return pick(pool.length ? pool : continentalPool(getLeague(club.league).continent, entry.tier, club.id));
}

// Knockout ties are less predictable than a full league: rotations, penalties, a bad night...
function winProb(power, oppRep, adj, spread = 50, max = 0.85) {
  return clamp(0.5 + (power - oppRep) / spread + adj, 0.15, max);
}

/** Group of 4 (home and away). Returns { points, position, advanced, opponents }. */
function playGroup(power, opponents, adj) {
  const teams = [{ id: 'me', power, pts: 0 }, ...opponents.map(o => ({ id: o.id, power: o.reputation, pts: 0 }))];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      for (let leg = 0; leg < 2; leg++) {
        const a = teams[i];
        const b = teams[j];
        const extra = a.id === 'me' ? adj : b.id === 'me' ? -adj : 0;
        const pWin = clamp(0.375 + (a.power - b.power) / 40 + extra, 0.05, 0.8);
        const r = Math.random();
        if (r < pWin) a.pts += 3;
        else if (r < pWin + 0.25) { a.pts += 1; b.pts += 1; } else b.pts += 3;
      }
    }
  }
  const sorted = [...teams].sort((x, y) => y.pts - x.pts || (x.id === 'me' ? -1 : 1));
  const position = sorted.findIndex(t => t.id === 'me') + 1;
  return { points: teams[0].pts, position, advanced: position <= 2 };
}

/** International competition: group stage + knockouts. A final returns { final: { opponent } } to be played. */
export function simulateContinental(entry, club, power, adj = 0) {
  if (!entry) return null;
  const continent = getLeague(club.league).continent;
  const pool = continentalPool(continent, entry.tier, club.id);
  const groupRivals = [...pool].filter(c => c.league !== club.league).sort(() => Math.random() - 0.5).slice(0, 3);
  const group = playGroup(power, groupRivals, adj);
  const result = { name: entry.name, tier: entry.tier, group, reached: 'Fase de grupos', eliminatedBy: null, final: null };
  if (!group.advanced) return result;

  const rounds = ['Octavos de final', 'Cuartos de final', 'Semifinal'];
  for (let i = 0; i < rounds.length; i++) {
    // Rivals get stronger as the cup advances
    const top = Math.max(6, Math.round(pool.length * (1 - i * 0.3)));
    const opp = pick(pool.slice(0, top));
    result.reached = rounds[i];
    if (Math.random() >= winProb(power, opp.reputation, adj)) {
      result.eliminatedBy = opp.name;
      return result;
    }
  }
  const finalOpp = pick(pool.slice(0, Math.max(5, Math.round(pool.length * 0.25))));
  result.reached = 'Final';
  result.final = { opponent: finalOpp.name, opponentRep: finalOpp.reputation };
  return result;
}

/** National cup (straight knockout, lower divisions included: upsets happen). */
export function simulateDomesticCup(club, power, adj = 0) {
  const league = getLeague(club.league);
  const name = domesticCupName(club.league);
  const country = league.country;
  const pool = CLUBS.filter(c => c.id !== club.id && getLeague(c.league).country === country);
  if (pool.length < 4) return null;
  const rounds = ['Dieciseisavos de final', 'Octavos de final', 'Cuartos de final', 'Semifinal'];
  const result = { name, reached: rounds[0], eliminatedBy: null, final: null, upset: null };
  for (let i = 0; i < rounds.length; i++) {
    const opp = pick(pool);
    result.reached = rounds[i];
    const won = Math.random() < winProb(power, opp.reputation, adj, 60, 0.8);
    if (!won) {
      result.eliminatedBy = opp.name;
      if (opp.reputation < power - 10) result.upset = `Batacazo de ${opp.name}`;
      return result;
    }
    if (opp.reputation > power + 8 && !result.upset) result.upset = `Le ganaste a ${opp.name}`;
  }
  const finalOpp = pick([...pool].sort((a, b) => b.reputation - a.reputation).slice(0, 10));
  result.reached = 'Final';
  result.final = { opponent: finalOpp.name, opponentRep: finalOpp.reputation };
  return result;
}

/**
 * League outcome from the final table.
 * - Top division: 1st = champion; if the gap with 2nd is ≤ 4 points (or you are 2nd at ≤ 3) the title is decided on the last match day.
 * - Second division: 1st = direct promotion; 2nd–5th play the promotion final.
 */
export function leagueOutcome(club, table, position) {
  const league = getLeague(club.league);
  const me = table[position - 1];
  const out = { name: league.short, position, total: table.length, points: me?.points ?? 0, champion: false, decider: null, directPromotion: false, playoff: false, relegated: false };
  if (league.secondTier) {
    const direct = league.directUp || 1;
    if (position <= direct) out.directPromotion = true;
    else if (position <= direct + 4) out.playoff = true;
    return out;
  }
  if (league.relegations && position > table.length - league.relegations) out.relegated = true;
  if (position === 1) {
    const second = table[1];
    if (second && me.points - second.points <= 4) out.decider = { opponent: second.name, leading: true };
    else out.champion = true;
  } else if (position === 2 && table[0].points - me.points <= 3) {
    out.decider = { opponent: table[0].name, leading: false };
  }
  return out;
}

/** Finals to play this season, in calendar order. */
export function buildFinals(club, competitions) {
  const league = getLeague(club.league);
  const finals = [];
  const { cup, continental, league: lg } = competitions;
  if (cup?.final) {
    finals.push({
      kind: 'cup', tournament: cup.name, opponent: cup.final.opponent, weight: TITLE_WEIGHT.cup,
      difficulty: cup.final.opponentRep >= 85 ? 'medium' : 'normal', title: `Final de ${cup.name} vs ${cup.final.opponent}`,
    });
  }
  if (continental?.final) {
    finals.push({
      kind: 'continental', tier: continental.tier, tournament: continental.name, opponent: continental.final.opponent,
      weight: TITLE_WEIGHT[`continental_${continental.tier}`],
      difficulty: continental.tier === 'main' ? 'hard' : continental.tier === 'second' ? 'medium' : 'normal',
      title: `Final de ${continental.name} vs ${continental.final.opponent}`,
    });
  }
  if (lg?.decider) {
    finals.push({
      kind: 'league', tournament: league.short, opponent: lg.decider.opponent, weight: TITLE_WEIGHT.league, difficulty: 'medium',
      title: `Última fecha: ${league.short} en juego vs ${lg.decider.opponent}`,
    });
  }
  if (lg?.playoff && league.promotionFinal) {
    finals.push({
      kind: 'promotion', tournament: league.promotionFinal, weight: TITLE_WEIGHT.promotion, difficulty: 'normal', title: league.promotionFinal,
    });
  }
  return finals;
}

// ---------------------------------------------------------------------------
// Phase 2: one-off title matches at the start of next season
// ---------------------------------------------------------------------------
const clubByName = (name) => CLUBS.find(c => c.shortName === name || c.name === name) || null;
const asOpponent = (c) => (c ? { id: c.id, name: c.name, rep: c.reputation } : null);

/**
 * Which title matches your club earned for next season.
 * titles: [{ kind: 'league'|'cup'|'continental'|..., tier }] won this season.
 * table: final league table (to find the league runner-up / champion).
 */
export function buildSupercups(club, titles, table = []) {
  const league = getLeague(club.league);
  const topLeague = league.secondTier && league.promotesTo ? getLeague(league.promotesTo) : league;
  const out = [];
  const wonLeague = titles.some(t => t.kind === 'league');
  const wonCup = titles.some(t => t.kind === 'cup');

  // National supercup: league champion vs cup champion
  if (topLeague.supercup && (wonLeague || wonCup)) {
    let opp = null;
    if (wonLeague && wonCup) opp = clubByName(table[1]?.name); // double: you face the runner-up
    else if (wonLeague) {
      const contenders = CLUBS.filter(c => getLeague(c.league).country === topLeague.country && c.id !== club.id)
        .sort((a, b) => b.reputation - a.reputation).slice(0, 12);
      opp = pick(contenders); // whoever won the cup
    } else if (!league.secondTier && table[0] && clubByName(table[0].name)?.id !== club.id) {
      opp = clubByName(table[0].name); // the league champion
    } else {
      opp = pick(CLUBS.filter(c => c.league === topLeague.id && c.id !== club.id).sort((a, b) => b.reputation - a.reputation).slice(0, 5));
    }
    if (opp) {
      out.push({
        kind: 'supercup', tournament: topLeague.supercup, opponent: asOpponent(opp), weight: TITLE_WEIGHT.supercup,
        difficulty: opp.reputation >= 85 ? 'medium' : 'normal', label: 'Supercopa',
      });
    }
  }

  const continent = topLeague.continent;
  const wonMain = titles.some(t => t.kind === 'continental' && t.tier === 'main');
  const wonSecond = titles.some(t => t.kind === 'continental' && t.tier === 'second');
  // Recopa / UEFA Super Cup: main cup winner vs second cup winner
  if (CONTINENTAL_SUPERCUP[continent] && (wonMain || wonSecond)) {
    const pool = continentalPool(continent, wonMain ? 'second' : 'main', club.id);
    const opp = pick(pool.slice(0, wonMain ? 20 : 10));
    out.push({
      kind: 'continental_supercup', tournament: CONTINENTAL_SUPERCUP[continent], opponent: asOpponent(opp),
      weight: TITLE_WEIGHT.continental_supercup, difficulty: 'medium', label: 'Recopa',
    });
  }
  // Intercontinental: champion of South America vs champion of Europe (and the rest vs Europe)
  if (wonMain) {
    const rivalContinent = INTERCONTINENTAL.rival[continent] || 'eu';
    const opp = pick(continentalPool(rivalContinent, 'main', club.id).slice(0, 8));
    out.push({
      kind: 'intercontinental', tournament: INTERCONTINENTAL.name, opponent: asOpponent(opp),
      weight: TITLE_WEIGHT.intercontinental, difficulty: 'hard', label: 'Intercontinental',
    });
  }
  return out.filter(sc => sc.opponent).map(sc => ({ ...sc, clubId: club.id }));
}
