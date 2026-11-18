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
