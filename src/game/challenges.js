// Scenarios (a goal for the whole career) and modifiers (house rules with a reward).
import { CLUBS, LEAGUES, getLeague } from '../data/clubs';

export const CHALLENGES = {
  salvar: {
    id: 'salvar',
    title: 'Salvá a un chico',
    icon: '🛟',
    desc: 'Arrancás en el club más débil de primera. Objetivo: que no descienda en tus primeras 3 temporadas ahí.',
    seasons: 3,
    glory: 150,
  },
  ascenso: {
    id: 'ascenso',
    title: 'Del ascenso a la gloria',
    icon: '🚀',
    desc: 'Arrancás en un club de segunda. Objetivo: ganar la copa internacional más grande (Libertadores o Champions) con ese mismo club.',
    glory: 300,
  },
};

export const MODIFIERS = {
  glass: {
    id: 'glass',
    title: 'Piernas de cristal',
    icon: '🦴',
    desc: 'Te lesionás mucho más seguido (+60% de riesgo), pero tu gloria final vale ×1,3.',
    injuryMult: 1.6,
    gloryMult: 1.3,
  },
};

export const hasModifier = (player, id) => (player?.modifiers || []).includes(id);

export function injuryMultiplier(player) {
  return (player?.modifiers || []).reduce((m, id) => m * (MODIFIERS[id]?.injuryMult || 1), 1);
}

export function modifiersGloryMult(player) {
  return (player?.modifiers || []).reduce((m, id) => m * (MODIFIERS[id]?.gloryMult || 1), 1);
}

/** Top flight and second tier of the country of a league. */
function countryLeagues(leagueId) {
  const base = getLeague(leagueId);
  const same = LEAGUES.filter(l => l.countryName === base.countryName);
  return { top: same.find(l => !l.secondTier), second: same.find(l => l.secondTier) };
}

/** The club where a challenge starts (from the league you picked), or null if it doesn't apply. */
export function challengeStartClub(challengeId, leagueId) {
  const { top, second } = countryLeagues(leagueId);
  if (challengeId === 'salvar' && top) {
    return [...CLUBS].filter(c => c.league === top.id).sort((a, b) => a.reputation - b.reputation)[0] || null;
  }
  if (challengeId === 'ascenso' && second) {
    const clubs = [...CLUBS].filter(c => c.league === second.id).sort((a, b) => a.reputation - b.reputation);
    return clubs[Math.floor(clubs.length / 2)] || null;
  }
  return null;
}

export function newChallenge(challengeId, club) {
  if (!CHALLENGES[challengeId] || !club) return null;
  return { id: challengeId, clubId: club.id, clubName: club.name, status: 'active', seasonsDone: 0 };
}

/**
 * Check the challenge at the end of a season.
 * `prev` is the player before the season, `ctx` = { titles, relegated }.
 * Returns { challenge, event } where event = { status, text } when it was decided.
 */
export function updateChallenge(prev, { titles = [], relegated = false } = {}) {
  const ch = prev.challenge;
  if (!ch || ch.status !== 'active') return { challenge: ch, event: null };
  const def = CHALLENGES[ch.id];
  const atClub = prev.currentClub?.id === ch.clubId;
  const fail = (text) => ({ challenge: { ...ch, status: 'failed' }, event: { status: 'failed', text } });
  const done = (text) => ({ challenge: { ...ch, status: 'done' }, event: { status: 'done', text } });

  if (!atClub) return fail(`Te fuiste de ${ch.clubName}: el desafío "${def.title}" quedó sin cumplir.`);

  if (ch.id === 'salvar') {
    if (relegated) return fail(`${ch.clubName} descendió. El desafío "${def.title}" no se pudo cumplir.`);
    const seasonsDone = (ch.seasonsDone || 0) + 1;
    if (seasonsDone >= def.seasons) return done(`¡Desafío cumplido! Mantuviste a ${ch.clubName} en primera ${def.seasons} temporadas.`);
    return { challenge: { ...ch, seasonsDone }, event: null };
  }

  if (ch.id === 'ascenso') {
    const won = titles.some(t => t.kind === 'continental' && t.tier === 'main');
    if (won) return done(`¡Desafío cumplido! Llevaste a ${ch.clubName} del ascenso a ganar ${titles.find(t => t.kind === 'continental').title}.`);
    return { challenge: { ...ch, seasonsDone: (ch.seasonsDone || 0) + 1 }, event: null };
  }
  return { challenge: ch, event: null };
}

/** Glory points from a completed challenge. */
export function challengeGlory(player) {
  const ch = player?.challenge;
  return ch?.status === 'done' ? CHALLENGES[ch.id]?.glory || 0 : 0;
}
