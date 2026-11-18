// Career highlights ("momentos"): recorded as they happen, shown at retirement and in the trophy cabinet.
import { START_YEAR } from './career';

const MAX_MOMENTS = 80;

// Higher = more important (used to pick the best ones for the share card)
export const MOMENT_WEIGHT = {
  statue: 10, world_cup: 10, captain: 8, continental: 8, title: 7, national_title: 8, ballon: 9,
  promotion: 6, betrayal: 6, record: 5, transfer: 4, nt_debut: 4, final_lost: 3, clasico: 2, debut: 3, retire: 5, award: 4,
};

/** Returns a new player with the moment appended (never mutates). */
export function addMoment(player, moment) {
  const year = moment.year ?? (START_YEAR + (player.seasonsPlayed || 0));
  const entry = { year, age: moment.age ?? player.age, ...moment };
  return { ...player, moments: [...(player.moments || []), entry].slice(-MAX_MOMENTS) };
}

/** Moments for old saves that were created before this feature existed. */
export function getCareerMoments(player) {
  if (player?.moments?.length) return player.moments;
  const derived = [];
  (player?.trophies || []).forEach(t => derived.push({ year: t.year, type: 'title', icon: t.icon || '🏆', text: `Campeón: ${t.title} con ${t.clubName}` }));
  if (player?.hasStatue) derived.push({ year: START_YEAR + (player.seasonsPlayed || 0), type: 'statue', icon: '🗽', text: `Estatua en ${player.statueClubName || 'el club'}` });
  return derived.sort((a, b) => a.year - b.year);
}

/** The N most important moments, in chronological order. */
export function topMoments(player, n = 6) {
  return getCareerMoments(player)
    .map((m, i) => ({ ...m, i }))
    .sort((a, b) => (MOMENT_WEIGHT[b.type] || 1) - (MOMENT_WEIGHT[a.type] || 1) || a.i - b.i)
    .slice(0, n)
    .sort((a, b) => a.year - b.year || a.i - b.i);
}
