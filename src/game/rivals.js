// Named rivals: a generation of fictional cracks that play their own careers next to yours.
// They compete with you for the Balón de Oro, the Golden Boot/Glove and the assists crown.
// One of them is your nemesis (same age and position, star potential).
import { CLUBS, getLeague, findClub } from '../data/clubs';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);

// Fictional name pools by language (combined at random: they are not real players)
const NAMES = {
  es: {
    first: ['Mateo', 'Thiago', 'Santino', 'Benjamín', 'Joaquín', 'Bautista', 'Valentín', 'Tomás', 'Ignacio', 'Facundo', 'Agustín', 'Bruno', 'Franco', 'Gonzalo', 'Nicolás', 'Felipe', 'Emiliano', 'Lisandro', 'Ramiro', 'Julián'],
    last: ['Ferreyra', 'Aguirre', 'Benítez', 'Quiroga', 'Medina', 'Olivera', 'Cabral', 'Ledesma', 'Vera', 'Ojeda', 'Barrios', 'Sosa', 'Godoy', 'Peralta', 'Arce', 'Villalba', 'Correa', 'Navarro', 'Bustos', 'Coronel'],
  },
  pt: {
    first: ['Gabriel', 'Rafael', 'Lucas', 'Matheus', 'Thiago', 'Caio', 'Diogo', 'Rodrigo', 'Igor', 'Vitor', 'Luan', 'Henrique', 'Duarte', 'Tiago', 'Rúben'],
    last: ['Souza', 'Almeida', 'Ribeiro', 'Teixeira', 'Moraes', 'Cardoso', 'Barbosa', 'Nogueira', 'Pacheco', 'Lacerda', 'Moura', 'Figueira', 'Tavares', 'Quaresma', 'Batista'],
  },
  en: {
    first: ['Jack', 'Harry', 'Oliver', 'Callum', 'Mason', 'Reece', 'Tyler', 'Lewis', 'Jordan', 'Ethan', 'Noah', 'Declan'],
    last: ['Whitmore', 'Ashworth', 'Hargreaves', 'Pemberton', 'Fletcher', 'Lowell', 'Barrett', 'Holloway', 'Carver', 'Prescott', 'Thornton', 'Bradshaw'],
  },
  fr: {
    first: ['Lucas', 'Hugo', 'Théo', 'Mathis', 'Enzo', 'Rayan', 'Kylian', 'Nolan', 'Ilyes', 'Yanis', 'Maxence', 'Sacha'],
    last: ['Lefèvre', 'Moreau', 'Garnier', 'Rousseau', 'Mercier', 'Blanchard', 'Fournier', 'Diallo', 'Camara', 'Traoré', 'Lambert', 'Chevalier'],
  },
  it: {
    first: ['Lorenzo', 'Matteo', 'Alessandro', 'Federico', 'Riccardo', 'Davide', 'Simone', 'Gabriele', 'Niccolò', 'Tommaso'],
    last: ['Bianchi', 'Ferraro', 'Colombo', 'Marchetti', 'Galli', 'Esposito', 'Santoro', 'Conti', 'Mancini', 'Fontana'],
  },
  de: {
    first: ['Leon', 'Jonas', 'Finn', 'Luca', 'Niklas', 'Felix', 'Moritz', 'Julian', 'Paul', 'Lennart'],
    last: ['Hoffmann', 'Wagner', 'Becker', 'Schreiber', 'Krüger', 'Hartmann', 'Brandt', 'Vogel', 'Lange', 'Zimmer'],
  },
  nl: {
    first: ['Daan', 'Sem', 'Bram', 'Jesse', 'Thijs', 'Milan', 'Ruben', 'Stijn'],
    last: ['de Vries', 'van Dijkstra', 'Bakker', 'Visser', 'Smit', 'Mulder', 'de Boer', 'van Leeuwen'],
  },
};
const COUNTRY_LANG = { ar: 'es', uy: 'es', co: 'es', cl: 'es', py: 'es', pe: 'es', mx: 'es', es: 'es', br: 'pt', pt: 'pt', en: 'en', fr: 'fr', it: 'it', de: 'de', nl: 'nl' };
const RIVAL_COUNTRIES = ['ar', 'br', 'fr', 'es', 'en', 'de', 'it', 'pt', 'nl', 'uy', 'co', 'br', 'fr', 'ar', 'es', 'en'];

function makeName(country, taken) {
  const pool = NAMES[COUNTRY_LANG[country] || 'es'];
  for (let i = 0; i < 30; i++) {
    const name = `${pick(pool.first)} ${pick(pool.last)}`;
    if (!taken.has(name)) { taken.add(name); return name; }
  }
  return `${pick(pool.first)} ${pick(pool.last)} Jr.`;
}

/** Overall from potential and age: grows until the peak (~27), then declines. */
export function rivalOverall(potential, age) {
  if (age <= 27) return Math.round(potential - Math.max(0, 27 - age) * 2.2);
  if (age <= 30) return potential;
  return Math.round(potential - (age - 30) * 2.4);
}

/** A club that fits the rival's level (big clubs for cracks). */
function clubFor(ovr, country, excludeId) {
  const top = CLUBS.filter(c => !getLeague(c.league).secondTier && c.id !== excludeId);
  let pool = top.filter(c => Math.abs(c.reputation - ovr) <= 5 + (ovr >= 86 ? 4 : 0));
  // Young or modest players usually stay in their own country
  if (ovr < 80) {
    const home = pool.filter(c => c.country === country);
    if (home.length) pool = home;
  }
  if (!pool.length) pool = [...top].sort((a, b) => Math.abs(a.reputation - ovr) - Math.abs(b.reputation - ovr)).slice(0, 8);
  return pick(pool);
}

let nextRivalId = 1;
function makeRival({ position, age, potential, country, taken, nemesis = false }) {
  const ovr = rivalOverall(potential, age);
  const club = clubFor(ovr, country);
  return {
    id: `r${Date.now().toString(36)}${(nextRivalId++).toString(36)}`,
    name: makeName(country, taken),
    position, age, potential, country,
    ovr, clubId: club?.id ?? null,
    nemesis,
    ballons: 0, boots: 0, totalGoals: 0, totalAssists: 0, totalCleanSheets: 0, titles: 0,
    retired: false,
  };
}

/** The generation you'll fight with during the whole career. */
export function generateRivals(player) {
  const taken = new Set([player.name]);
  const baseAge = player.age || 16;
  const rivals = [];
  // Your nemesis: same position, same age, star potential
  rivals.push(makeRival({
    position: player.position, age: baseAge, potential: Math.round(rnd(89, 94)),
    country: pick(RIVAL_COUNTRIES.filter(c => c !== player.country)), taken, nemesis: true,
  }));
  const positions = ['delantero', 'delantero', 'delantero', 'delantero', 'delantero', 'delantero', 'delantero',
    'enganche', 'enganche', 'enganche', 'enganche', 'enganche', 'arquero', 'arquero', 'arquero', 'arquero', 'delantero'];
  positions.forEach((position, i) => {
    rivals.push(makeRival({
      position,
      age: clamp(baseAge + Math.round(rnd(-1, 11)), 16, 33),
      potential: Math.round(rnd(83, 94)),
      country: RIVAL_COUNTRIES[i % RIVAL_COUNTRIES.length],
      taken,
    }));
  });
  return rivals;
}

export function getNemesis(player) {
  return (player?.rivals || []).find(r => r.nemesis && !r.retired) || null;
}

/** One season of every rival (stats + titles weight), with development, transfers and retirements. */
export function advanceRivals(rivals = [], { difficultyAdj = 0, playerAge = 20 } = {}) {
  const taken = new Set(rivals.map(r => r.name));
  const seasonStats = [];
  const next = rivals.map(r => {
    if (r.retired) return r;
    const ovr = clamp(r.ovr + difficultyAdj, 50, 97);
    const club = findClub(r.clubId);
    const rep = club?.reputation ?? 75;
    const form = rnd(-4, 4);
    let goals = 0; let assists = 0; let cleanSheets = 0;
    if (r.position === 'delantero') {
      goals = Math.max(0, Math.round((ovr - 58) * 0.95 + (rep - 75) / 6 + form));
      assists = Math.round(goals * 0.3 + rnd(0, 4));
    } else if (r.position === 'enganche') {
      assists = Math.max(0, Math.round((ovr - 60) * 0.85 + (rep - 75) / 8 + form));
      goals = Math.round(assists * 0.45 + rnd(0, 4));
    } else {
      cleanSheets = Math.max(0, Math.round((ovr - 62) * 0.6 + (rep - 75) / 5 + form / 2));
    }
    // Titles: big clubs win more (weights like the player's: league 25, cup 15, Champions/Libertadores 30)
    let titleWeight = 0;
    if (Math.random() < clamp((rep - 72) / 45, 0.03, 0.5)) titleWeight += pick([15, 25, 25]);
    if (rep >= 88 && Math.random() < 0.15) titleWeight += 30;
    seasonStats.push({ rivalId: r.id, name: r.name, position: r.position, country: r.country, clubId: r.clubId, clubName: club?.name || '', ovr, goals, assists, cleanSheets, titleWeight, nemesis: r.nemesis });

    // Development, career moves and retirement
    const age = r.age + 1;
    const newOvr = rivalOverall(r.potential, age);
    let clubId = r.clubId;
    if (Math.abs(newOvr - rep) > 6 || Math.random() < 0.15) clubId = clubFor(newOvr, r.country, r.clubId)?.id ?? r.clubId;
    const retired = age >= 36 || (age >= 33 && newOvr < 72 && Math.random() < 0.5);
    return {
      ...r, age, ovr: newOvr, clubId, retired,
      totalGoals: r.totalGoals + goals, totalAssists: r.totalAssists + assists, totalCleanSheets: r.totalCleanSheets + cleanSheets,
      titles: r.titles + (titleWeight > 0 ? 1 : 0),
    };
  });

  // Every retirement makes room for a new kid with talent
  const retiredNow = next.filter((r, i) => r.retired && !rivals[i].retired).length;
  for (let i = 0; i < retiredNow; i++) {
    next.push(makeRival({
      position: pick(['delantero', 'delantero', 'enganche', 'arquero']),
      age: clamp(playerAge - Math.round(rnd(4, 10)), 17, 22),
      potential: Math.round(rnd(84, 94)),
      country: pick(RIVAL_COUNTRIES),
      taken,
    }));
  }
  // Keep the save small: drop long-retired rivals that never won anything
  const trimmed = next.filter(r => !r.retired || r.ballons > 0 || r.nemesis || r.boots > 0);
  return { rivals: trimmed, seasonStats };
}

/** Ballon d'Or points: level + numbers + titles + national team + visibility. */
function ballonScore({ ovr, goals = 0, assists = 0, cleanSheets = 0, titleWeight = 0, nationalBonus = 0, rep = 75, position }) {
  const numbers = position === 'arquero' ? cleanSheets * 1.3 : position === 'enganche' ? assists * 0.8 + goals * 0.4 : goals * 0.8 + assists * 0.3;
  return Math.round(ovr * 1.0 + numbers + titleWeight * 0.6 + nationalBonus + (rep - 75) * 0.15 + rnd(-3, 3));
}

/**
 * Season awards against the rivals.
 * me: { name, position, ovr, goals, assists, cleanSheets, titleWeight, nationalBonus, rep, clubName }
 */
export function computeAwards(me, seasonStats) {
  const meRow = { ...me, isPlayer: true };
  const candidates = [
    { ...meRow, points: ballonScore(meRow) },
    ...seasonStats.map(s => {
      const rep = findClub(s.clubId)?.reputation ?? 75;
      return { ...s, rep, points: ballonScore({ ...s, rep, nationalBonus: s.titleWeight >= 30 ? 6 : 0 }) };
    }),
  ].sort((a, b) => b.points - a.points);
  const ballon = candidates.slice(0, 10).map((c, i) => ({ pos: i + 1, ...c }));
  const ballonPos = candidates.findIndex(c => c.isPlayer) + 1;

  const ranking = (filterFn, statKey) => {
    const list = [meRow, ...seasonStats].filter(filterFn).sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0));
    return { top: list.slice(0, 5).map((c, i) => ({ pos: i + 1, ...c })), playerPos: list.findIndex(c => c.isPlayer) + 1, stat: statKey };
  };
  return {
    ballon: { top: ballon, playerPos: ballonPos, winner: candidates[0] },
    boot: ranking(c => c.position !== 'arquero', 'goals'),
    assists: ranking(c => c.position === 'enganche' || c.isPlayer && me.position === 'enganche', 'assists'),
    glove: ranking(c => c.position === 'arquero', 'cleanSheets'),
  };
}

/** Adds the prizes won by rivals to their record. */
export function creditRivalAwards(rivals, awards) {
  const winner = (rank) => rank.top[0] && !rank.top[0].isPlayer ? rank.top[0].rivalId : null;
  const ballonId = winner(awards.ballon);
  const bootId = winner(awards.boot);
  return rivals.map(r => ({
    ...r,
    ballons: r.ballons + (r.id === ballonId ? 1 : 0),
    boots: r.boots + (r.id === bootId ? 1 : 0),
  }));
}
