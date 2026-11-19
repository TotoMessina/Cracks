// Phase 3: promotions/relegations for every club and the board's objectives.
import { CLUBS, LEAGUES, getLeague } from '../data/clubs';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Top division + its second division (only countries that have both in the data). */
export function leaguePairs() {
  return LEAGUES.filter(l => l.secondTier && l.promotesTo).map(l => ({ top: l.promotesTo, second: l.id }));
}

/** Quick table for a league nobody is watching (same scoring as the player's league). */
export function simulateTable(leagueId) {
  return CLUBS.filter(c => c.league === leagueId)
    .map(c => ({ clubId: c.id, points: Math.round(c.reputation * 0.75 + (Math.random() * 18 - 9)) }))
    .sort((a, b) => b.points - a.points);
}

/**
 * End-of-season movements. Returns { world, moves: [{ clubId, from, to, type }] }.
 * playerLeague / playerTable: the real table of the player's league ([{ clubId, points }] sorted).
 * playerPromotion: true / false / null — result of the player's promotion play-off (if any).
 */
export function updateWorld(prevWorld, { playerLeague = null, playerTable = null, playerClubId = null, playerPromotion = null } = {}) {
  const world = { ...(prevWorld || {}) };
  const moves = [];
  const setLeague = (clubId, leagueId) => {
    const base = CLUBS.find(c => c.id === clubId)?.baseLeague;
    if (base === leagueId) delete world[clubId];
    else world[clubId] = leagueId;
  };

  leaguePairs().forEach(({ top, second }) => {
    const topLeague = getLeague(top);
    const secondLeague = getLeague(second);
    const topTable = top === playerLeague && playerTable ? playerTable : simulateTable(top);
    const secondTable = second === playerLeague && playerTable ? playerTable : simulateTable(second);
    if (topTable.length < 4 || secondTable.length < 4) return;

    const nDown = topLeague.relegations || 2;
    const relegated = topTable.slice(-nDown).map(r => r.clubId);

    const direct = secondLeague.directUp || 1;
    const promoted = secondTable.slice(0, direct).map(r => r.clubId);
    const candidates = secondTable.slice(direct, direct + 4).map(r => r.clubId);
    let playoffWinner;
    if (candidates.includes(playerClubId) && playerPromotion !== null) {
      playoffWinner = playerPromotion ? playerClubId : pick(candidates.filter(id => id !== playerClubId));
    } else {
      // Better placed teams win the play-off more often
      playoffWinner = Math.random() < 0.6 ? candidates[Math.floor(Math.random() * 2)] : pick(candidates);
    }
    if (playoffWinner) promoted.push(playoffWinner);

    relegated.forEach(id => { setLeague(id, second); moves.push({ clubId: id, from: top, to: second, type: 'relegated' }); });
    promoted.forEach(id => { setLeague(id, top); moves.push({ clubId: id, from: second, to: top, type: 'promoted' }); });
  });

  return { world, moves };
}

// ---------------------------------------------------------------------------
// Board objectives (depend on how big the club is in its league)
// ---------------------------------------------------------------------------
export const OBJECTIVES = {
  title: { id: 'title', label: 'Salir campeón', icon: '🏆' },
  continental: { id: 'continental', label: 'Clasificar a copa internacional', icon: '✈️' },
  midtable: { id: 'midtable', label: 'Terminar en la mitad de arriba', icon: '📈' },
  survive: { id: 'survive', label: 'Evitar el descenso', icon: '🛟' },
  promote: { id: 'promote', label: 'Ascender', icon: '🎖️' },
  playoff: { id: 'playoff', label: 'Meterse en el reducido', icon: '🎯' },
};

/** The board's objective for this season. */
export function getClubObjective(club) {
  if (!club) return OBJECTIVES.midtable;
  const league = getLeague(club.league);
  const clubs = CLUBS.filter(c => c.league === club.league).sort((a, b) => b.reputation - a.reputation);
  const rank = Math.max(1, clubs.findIndex(c => c.id === club.id) + 1);
  const share = rank / Math.max(1, clubs.length);
  if (league.secondTier) return share <= 0.2 ? OBJECTIVES.promote : OBJECTIVES.playoff;
  if (rank <= 2 || share <= 0.1) return OBJECTIVES.title;
  const slots = Object.values(league.slots || {}).reduce((a, b) => a + b, 0);
  if (rank <= Math.max(3, slots)) return OBJECTIVES.continental;
  if (league.relegations && share >= 0.75) return OBJECTIVES.survive;
  return OBJECTIVES.midtable;
}

/** Did you meet it? */
export function evaluateObjective(objective, { position, total, titles = [], promoted = false, relegated = false, qualified = false, playoff = false }) {
  switch (objective?.id) {
    case 'title': return titles.some(t => ['league', 'cup', 'continental'].includes(t.kind));
    case 'continental': return qualified || titles.some(t => t.kind === 'league' || t.kind === 'continental');
    case 'midtable': return position <= Math.ceil(total / 2);
    case 'survive': return !relegated;
    case 'promote': return promoted;
    case 'playoff': return promoted || playoff || position <= 5;
    default: return true;
  }
}

// ---------------------------------------------------------------------------
// Clubs grow and shrink over the years: results, money, promotions/relegations,
// the board (investors, crises) and their history (big clubs tend to come back).
// The world stores the exact level in world.rep = { [clubId]: level }.
// ---------------------------------------------------------------------------
export const CLUB_DRIFT_LIMIT = 15; // never further than this from the original level

const POSITIVE_EVENTS = [
  { icon: '🤑', text: (n) => `Llega un inversor millonario a ${n}` },
  { icon: '🏛️', text: (n) => `${n} tiene una dirigencia nueva que ordena todo` },
  { icon: '🌱', text: (n) => `Sale una camada dorada de las inferiores de ${n}` },
  { icon: '📺', text: (n) => `${n} firma un contrato de TV y sponsors récord` },
];
const NEGATIVE_EVENTS = [
  { icon: '💸', text: (n) => `Crisis económica en ${n}: deudas y sueldos atrasados` },
  { icon: '🧾', text: (n) => `Mala gestión en ${n}: la dirigencia vende a sus figuras` },
  { icon: '⚖️', text: (n) => `${n} sancionado: inhibición para incorporar` },
  { icon: '🔥', text: (n) => `Interna feroz en ${n}: renuncia la comisión directiva` },
];

/**
 * One year of change for every club. Returns { world, news }.
 * - playerTable: real table of the player's league ([{ clubId, points }] best first)
 * - moves: promotions/relegations of this season (from updateWorld)
 * - playerClubId / playerTitles: your titles make your club bigger
 */
export function evolveClubs(world, { playerTable = null, playerClubId = null, playerTitles = [], moves = [], rng = Math.random } = {}) {
  const prevRep = world?.rep || {};
  const rep = {};
  const news = [];
  const moved = new Map(moves.map(m => [m.clubId, m.type]));
  const tablePos = new Map((playerTable || []).map((r, i) => [r.clubId, { pos: i, total: playerTable.length }]));
  // Expected position in the player's league = rank by level
  const expected = new Map();
  if (playerTable?.length) {
    const ids = new Set(playerTable.map(r => r.clubId));
    CLUBS.filter(c => ids.has(c.id)).sort((a, b) => b.reputation - a.reputation).forEach((c, i) => expected.set(c.id, i));
  }

  CLUBS.forEach(c => {
    const base = c.baseReputation ?? c.reputation;
    const current = prevRep[c.id] ?? base;
    const reasons = [];
    let delta = 0;

    // 1) Results: better or worse than expected
    const t = tablePos.get(c.id);
    if (t && expected.has(c.id)) {
      const diff = (expected.get(c.id) - t.pos) / Math.max(1, t.total);
      delta += Math.max(-2, Math.min(2, diff * 6));
    } else {
      delta += (rng() + rng() - 1) * 1.6; // a season nobody watched: good or bad
    }

    // 2) Money: rich leagues and the continental elite earn more
    const league = getLeague(c.league);
    delta += ((league.salaryMult ?? 1) - 1) * 0.08;
    if (current >= 85) delta += 0.08;

    // 3) Promotion / relegation
    if (moved.get(c.id) === 'promoted') { delta += 2; reasons.push('ascenso'); }
    if (moved.get(c.id) === 'relegated') { delta -= 3; reasons.push('descenso'); }

    // 4) Your titles lift your club
    if (c.id === playerClubId && playerTitles.length) {
      delta += Math.min(3, playerTitles.reduce((sum, ti) => sum + (ti.weight >= 15 ? 1 : 0.5), 0));
      reasons.push('títulos');
    }

    // 5) History: big clubs come back, small ones that grew go back little by little
    const gap = base - current;
    delta += gap * (gap > 0 && (c.prestige ?? base) >= 85 ? 0.18 : 0.1);

    // 6) The board: investors, new presidents, crises...
    let event = null;
    if (rng() < 0.05) {
      const positive = rng() < 0.5;
      const size = 4 + rng() * 4;
      const list = positive ? POSITIVE_EVENTS : NEGATIVE_EVENTS;
      event = { ...list[Math.floor(rng() * list.length)], positive };
      delta += positive ? size : -size;
    }

    const next = Math.max(45, Math.min(97, Math.max(base - CLUB_DRIFT_LIMIT, Math.min(base + CLUB_DRIFT_LIMIT, current + delta))));
    const exact = Math.round(next * 10) / 10;
    if (exact !== base) rep[c.id] = exact;

    const change = Math.round(exact) - Math.round(current);
    if (event || Math.abs(change) >= 3) {
      news.push({
        clubId: c.id,
        name: c.name,
        icon: event ? event.icon : change > 0 ? '📈' : '📉',
        text: event ? event.text(c.name) : `${c.name} ${change > 0 ? 'crece' : 'se achica'}${reasons.length ? ` (${reasons.join(', ')})` : ''}`,
        from: Math.round(current),
        to: Math.round(exact),
        league: c.league,
        prestige: c.prestige ?? base,
      });
    }
  });

  return { world: { ...(world || {}), rep }, news };
}

/** The news a player cares about: their club, their league and the big names. */
export function relevantNews(news, { clubId = null, leagueId = null, limit = 6 } = {}) {
  const score = (n) => (n.clubId === clubId ? 100 : 0) + (n.league === leagueId ? 50 : 0) + n.prestige / 10 + Math.abs(n.to - n.from);
  return [...news].sort((a, b) => score(b) - score(a)).slice(0, limit);
}
