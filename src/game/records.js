// Club and national-team records: every club has a historical legend to chase.
// The legends are fictional and stable (same club, same legend in every career).
import { getClubById, getLeague, getCountryById } from '../data/clubs';
import { seededRandom, seededName } from './rivals';

/** What each position chases: goals (9), appearances (10) or clean sheets (1). */
export function recordStat(position) {
  if (position === 'arquero') return 'cleanSheets';
  if (position === 'enganche') return 'matches';
  return 'goals';
}

export const RECORD_INFO = {
  goals: { holder: 'goleador histórico', unit: 'goles', icon: '⚽' },
  matches: { holder: 'jugador con más partidos', unit: 'partidos', icon: '🎽' },
  cleanSheets: { holder: 'arquero con más vallas invictas', unit: 'vallas invictas', icon: '🧤' },
};

const BASE = {
  club: { goals: [70, 1.5, 50], matches: [230, 2.6, 90], cleanSheets: [60, 1.1, 40] },
  national: { goals: [18, 0.3, 25], matches: [50, 0.4, 40], cleanSheets: [18, 0.2, 20] },
};

function legendValue(kind, stat, prestige, key) {
  const [base, perPrestige, jitter] = BASE[kind][stat];
  return Math.round(base + prestige * perPrestige + seededRandom(`${key}:v`) * jitter);
}

/** The club's all-time record for your position. */
export function clubRecord(club, position) {
  if (!club) return null;
  const stat = recordStat(position);
  const key = `club:${club.id}:${stat}`;
  const country = getLeague(club.league).country || 'ar';
  return {
    scope: 'club',
    id: club.id,
    stat,
    value: legendValue('club', stat, club.prestige ?? club.reputation ?? 70, key),
    holder: seededName(country, key),
    year: 1950 + Math.floor(seededRandom(`${key}:y`) * 60),
    teamName: club.name,
  };
}

/** The national team's all-time record for your position. */
export function nationalRecord(countryId, position) {
  const stat = recordStat(position);
  const key = `nt:${countryId}:${stat}`;
  const country = getCountryById(countryId);
  return {
    scope: 'national',
    id: countryId,
    stat,
    value: legendValue('national', stat, 80, key),
    holder: seededName(countryId, key),
    year: 1950 + Math.floor(seededRandom(`${key}:y`) * 60),
    teamName: country?.nationalTeam || 'la Selección',
  };
}

/** Your number at that club / national team. */
export function playerRecordValue(player, scope, id) {
  const stat = recordStat(player.position);
  if (scope === 'national') return player.nationalTeamStats?.[stat] || 0;
  return player.clubHistory?.find(h => h.clubId === id)?.[stat] || 0;
}

const keyOf = (rec) => `${rec.scope}:${rec.id}`;

/** Records still to beat at your current club and national team, closest first. */
export function recordChase(player) {
  const list = [];
  const club = clubRecord(getClubById(player.currentClub?.id) || player.currentClub, player.position);
  if (club) list.push({ ...club, mine: playerRecordValue(player, 'club', club.id) });
  if ((player.nationalTeamStats?.matches || 0) > 0) {
    const nt = nationalRecord(player.country, player.position);
    list.push({ ...nt, mine: playerRecordValue(player, 'national', nt.id) });
  }
  const broken = new Set(player.recordsBroken || []);
  return list.map(r => ({ ...r, broken: broken.has(keyOf(r)), missing: Math.max(0, r.value + 1 - r.mine) }));
}

/**
 * After a season: did you beat a legend? Returns the new list of broken records
 * and one entry per record broken this season.
 */
export function checkRecords(player) {
  const broken = new Set(player.recordsBroken || []);
  const fresh = [];
  recordChase(player).forEach(r => {
    if (!r.broken && r.mine > r.value) {
      broken.add(keyOf(r));
      const info = RECORD_INFO[r.stat];
      fresh.push({
        ...r,
        text: `¡Superaste a ${r.holder}! Sos el ${info.holder} de ${r.teamName} con ${r.mine} ${info.unit} (él tenía ${r.value}).`,
      });
    }
  });
  return { recordsBroken: [...broken], fresh };
}
