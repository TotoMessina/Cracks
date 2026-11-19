// The club's coach: has a name and a style that changes who plays.
// Coaches change every now and then (more often after a bad season).
import { getLeague } from '../data/clubs';
import { seededRandom, seededName } from './rivals';

export const COACH_STYLES = {
  pibes: { id: 'pibes', label: 'Apuesta por los pibes', short: 'pibes', icon: '🌱', young: 1.15, old: 0.85 },
  veteranos: { id: 'veteranos', label: 'Confía en los veteranos', short: 'veteranos', icon: '🧓', young: 0.82, old: 1.1 },
  equilibrado: { id: 'equilibrado', label: 'Equilibrado', short: 'equilibrado', icon: '⚖️', young: 1, old: 1 },
  exigente: { id: 'exigente', label: 'Exigente: juega el que está bien', short: 'exigente', icon: '📋', young: 1, old: 1, form: true },
};
const STYLE_IDS = Object.keys(COACH_STYLES);

/** A new coach for a club. `key` makes it stable (same key, same coach). */
export function makeCoach(club, since = 0, key = `${club.id}:${since}`, rng = null) {
  const r = (salt) => (rng ? rng() : seededRandom(`${key}:${salt}`));
  const country = getLeague(club.league).country || 'ar';
  return {
    clubId: club.id,
    name: seededName(country, `coach:${key}:${rng ? Math.floor(r('n') * 1e6) : ''}`),
    style: STYLE_IDS[Math.floor(r('s') * STYLE_IDS.length)],
    since,
  };
}

/** The coach of your current club (a stable one is made up if the save has none yet). */
export function getCoach(player) {
  const club = player.currentClub;
  if (!club) return null;
  if (player.coach?.clubId === club.id) return player.coach;
  return makeCoach(club, player.seasonsPlayed || 0);
}

export const ageGroup = (age) => (age <= 23 ? 'young' : age >= 30 ? 'old' : 'prime');

/** How the coach's style changes your minutes (1 = no effect). */
export function coachMinutesFactor(coach, player) {
  const style = COACH_STYLES[coach?.style];
  if (!style) return 1;
  let f = 1;
  const group = ageGroup(player.age);
  if (group === 'young') f *= style.young;
  if (group === 'old') f *= style.old;
  if (style.form) f *= (player.form || 0) > 0 ? 1.1 : (player.form || 0) < 0 ? 0.85 : 1;
  return f;
}

/** Does this coach's style suit you right now? 1 = yes, -1 = no, 0 = neutral. */
export function coachFit(coach, player) {
  const f = coachMinutesFactor(coach, player);
  return f > 1.02 ? 1 : f < 0.98 ? -1 : 0;
}

/**
 * End of season: the board may sack the coach.
 * Returns { coach, changed, previous }.
 */
export function rollCoachChange(player, { objectiveMet = true, relegated = false, rng = Math.random } = {}) {
  const coach = getCoach(player);
  if (!coach) return { coach, changed: false };
  const tenure = (player.seasonsPlayed || 0) - (coach.since || 0);
  let chance = 0.1 + (objectiveMet ? 0 : 0.18) + (relegated ? 0.35 : 0) + (tenure >= 4 ? 0.08 : 0);
  chance = Math.min(0.9, chance);
  if (rng() >= chance) return { coach, changed: false };
  const next = makeCoach(player.currentClub, (player.seasonsPlayed || 0) + 1, null, rng);
  // Never the same style twice in a row: a new coach brings new ideas
  if (next.style === coach.style) next.style = STYLE_IDS[(STYLE_IDS.indexOf(coach.style) + 1) % STYLE_IDS.length];
  return { coach: next, changed: true, previous: coach };
}
