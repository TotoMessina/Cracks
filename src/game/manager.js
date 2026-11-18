// Manager (DT) career engine — pure functions, no React.
import { CLUBS, LEAGUES, getClubById, getLeague, refreshClub, withWorld } from '../data/clubs';
import { estimatedQualification, simulateContinental, simulateDomesticCup, leagueOutcome, computeQualification } from './competitions';
import { updateWorld } from './world';
import { START_YEAR } from './career';

export const DT_STYLES = [
  { id: 'lirico', title: 'Lírico', desc: 'Posesión, toque corto y búsqueda constante del arco rival.', badge: '⚽ Ataque total', att: 5, def: -4 },
  { id: 'resultadista', title: 'Resultadista', desc: 'Orden táctico, pelota parada y no regalar ni un metro.', badge: '🛡️ Cerrojo', att: -3, def: 5 },
  { id: 'intenso', title: 'Intenso', desc: 'Presión asfixiante y transiciones a mil por hora.', badge: '⚡ Vértigo', att: 3, def: 0 },
  { id: 'copero', title: 'Copero', desc: 'Lectura de partido y temple en las noches decisivas (+copas).', badge: '🏆 Mística', att: 1, def: 0, cup: 0.08 },
];

export const FORMATIONS = {
  '4-3-3': { label: '4-3-3 · ofensivo con extremos', att: 3, def: -3 },
  '4-4-2': { label: '4-4-2 · clásico equilibrado', att: 1, def: 0 },
  '3-5-2': { label: '3-5-2 · carrileros y presión', att: 2, def: -1 },
  '4-2-3-1': { label: '4-2-3-1 · enganche libre', att: 2, def: 1 },
  '5-4-1': { label: '5-4-1 · línea de 5', att: -4, def: 4 },
};

export const APPROACHES = {
  Ofensivo: { label: 'Presión alta y ataque', att: 4, def: -4 },
  Equilibrado: { label: 'Equilibrio y posesión', att: 0, def: 0 },
  Contraataque: { label: 'Líneas cortas y contra (mejor contra grandes)', att: -3, def: 3, giantKiller: 4 },
};

export const CABALAS = [
  { id: 'traje_negro', name: 'Traje negro de gala', desc: '+2 de solidez defensiva.' },
  { id: 'rosario', name: 'Rosario en el bolsillo', desc: '10% de chances de dar vuelta un empate en el descuento.' },
  { id: 'pie_derecho', name: 'Entrar con el pie derecho', desc: '+2 de ataque.' },
  { id: 'caramelos', name: 'Caramelos en el banco', desc: '+4% en cada partido de copa.' },
];

export function getLeagueLabel(league) {
  return getLeague(league).short;
}

export function getDtLeagues() {
  return LEAGUES;
}

export function getDtClubs(leagueId = null) {
  return leagueId ? CLUBS.filter(c => c.league === leagueId) : CLUBS;
}

/** International cup for a club with no previous table (estimated from its standing in the league). */
const estimatedEntry = (club) => {
  const q = estimatedQualification(club);
  return { clubId: club.id, tier: q?.tier || null, name: q?.name || null };
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);

function poisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do { k += 1; p *= Math.random(); } while (p > L);
  return k - 1;
}

export function createManager({ name, clubId, style = 'lirico', cabala = 'traje_negro', legacy = null }) {
  const club = getClubById(clubId);
  return {
    version: 2,
    name: name || 'El Míster',
    style,
    cabala,
    formation: '4-4-2',
    approach: 'Equilibrado',
    club: { ...club },
    legacy, // { clubId, clubName, fame, hasStatue } from the retired player, or null
    seasons: 0,
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    titles: 0,
    trophyNames: [],
    history: [],
    strikes: 0,
    inCup: Boolean(estimatedEntry(club).tier),
    qualifiedFor: estimatedEntry(club),
    world: {}, // the manager career has its own promotions/relegations
    pendingOffers: null,
    fired: false,
  };
}

/** Migrate the old manager save format (team: { id: 'boca', rep, ... }). */
export function normalizeManager(raw) {
  if (!raw) return null;
  if (raw.version === 2 && raw.club) {
    const world = raw.world || {};
    return withWorld(world, () => {
      const club = refreshClub(raw.club);
      return {
        ...raw,
        world,
        club,
        qualifiedFor: raw.qualifiedFor || estimatedEntry(club),
        pendingOffers: raw.pendingOffers?.map(c => refreshClub(c)) || null,
      };
    });
  }
  const byName = raw.team?.name ? CLUBS.find(c => raw.team.name.startsWith(c.name) || c.name.startsWith(raw.team.name)) : null;
  const club = byName || getClubById(451);
  const styleMap = { menotti: 'lirico', bilardo: 'resultadista', bielsa: 'intenso', gallardo: 'copero' };
  return {
    ...createManager({ name: raw.name, clubId: club.id, style: styleMap[raw.style] || 'lirico', cabala: raw.cabala || 'traje_negro' }),
    formation: FORMATIONS[raw.formation] ? raw.formation : '4-4-2',
    approach: APPROACHES[raw.approach] ? raw.approach : 'Equilibrado',
    seasons: raw.seasons || 0,
    matches: raw.matches || 0,
    wins: raw.wins || 0,
    draws: raw.draws || 0,
    losses: raw.losses || 0,
    titles: raw.titles || 0,
    trophyNames: raw.trophyNames || [],
    history: (raw.history || []).map(h => ({ ...h, club: h.club || h.team })),
  };
}

export function getPrestige(m) {
  const winPct = m.matches ? m.wins / m.matches : 0.4;
  const legacyBoost = m.legacy ? Math.round((m.legacy.fame || 0) / 6) : 0;
  return Math.round(clamp(66 + m.titles * 4 + Math.min(10, m.seasons) + (winPct - 0.4) * 40 + legacyBoost, 55, 99));
}

export function getTactics(m) {
  const s = DT_STYLES.find(x => x.id === m.style) || DT_STYLES[0];
  const f = FORMATIONS[m.formation] || FORMATIONS['4-4-2'];
  const a = APPROACHES[m.approach] || APPROACHES.Equilibrado;
  let att = s.att + f.att + a.att;
  let def = s.def + f.def + a.def;
  if (m.cabala === 'traje_negro') def += 2;
  if (m.cabala === 'pie_derecho') att += 2;
  const legacyHome = m.legacy && m.legacy.clubId === m.club.id ? 3 : 0;
  return { att, def, giantKiller: a.giantKiller || 0, cupBonus: (s.cup || 0) + (m.cabala === 'caramelos' ? 0.04 : 0), legacyHome };
}

function playMatch(power, tactics, oppPower, home, cabala, incidents, label) {
  const giant = oppPower > power ? tactics.giantKiller : 0;
  const att = power + tactics.att + giant + (home ? 2 : -1);
  const def = power + tactics.def + (home ? 2 : -1);
  const xgFor = clamp(1.3 + (att - oppPower) * 0.032, 0.3, 3.2);
  const xgAgainst = clamp(1.3 + (oppPower - def) * 0.032, 0.3, 3.2);
  let gf = poisson(xgFor);
  const ga = poisson(xgAgainst);
  if (gf === ga && cabala === 'rosario' && Math.random() < 0.1) {
    gf += 1;
    if (incidents.length < 4) incidents.push(`${label}: ¡el rosario hizo efecto! Gol en el minuto 94.`);
  }
  return { gf, ga };
}

function simulateManagerSeasonInWorld(m) {
  const tactics = getTactics(m);
  const power = m.club.reputation + tactics.legacyHome;
  const leagueClubs = CLUBS.filter(c => c.league === m.club.league && c.id !== m.club.id);
  const rounds = Math.max(1, Math.ceil(30 / Math.max(1, leagueClubs.length)));
  const incidents = [];

  let w = 0; let d = 0; let l = 0; let gf = 0; let ga = 0;
  let fecha = 0;
  for (let r = 0; r < rounds; r++) {
    leagueClubs.forEach(opp => {
      fecha += 1;
      const res = playMatch(power, tactics, opp.reputation + rnd(-4, 4), (r + fecha) % 2 === 0, m.cabala, incidents, `Fecha ${fecha} vs ${opp.shortName}`);
      gf += res.gf; ga += res.ga;
      if (res.gf > res.ga) {
        w += 1;
        if (res.gf - res.ga >= 3 && incidents.length < 4) incidents.push(`Fecha ${fecha}: goleada ${res.gf}-${res.ga} a ${opp.shortName}.`);
      } else if (res.gf === res.ga) d += 1;
      else {
        l += 1;
        if (opp.rivals?.includes(m.club.id) && incidents.length < 4) incidents.push(`Fecha ${fecha}: derrota dolorosa en el clásico ante ${opp.shortName}.`);
      }
    });
  }
  const games = w + d + l;
  const points = w * 3 + d;

  // Rest of the league plays under the same match model (neutral tactics)
  const neutral = { att: 0, def: 0, giantKiller: 0 };
  const allClubs = [...leagueClubs, { ...m.club, reputation: power }];
  const table = leagueClubs.map(c => {
    let pts = 0;
    let k = 0;
    for (let i = 0; i < games; i++) {
      const pool = allClubs.filter(o => o.id !== c.id);
      const opp = pool[k++ % pool.length];
      const res = playMatch(c.reputation + rnd(-3, 3), neutral, opp.reputation + rnd(-4, 4), i % 2 === 0, null, [], '');
      pts += res.gf > res.ga ? 3 : res.gf === res.ga ? 1 : 0;
    }
    return { clubId: c.id, name: c.shortName, points: pts, isUs: false };
  });
  table.push({ clubId: m.club.id, name: m.club.shortName, points, isUs: true });
  table.sort((a, b) => b.points - a.points || (a.isUs ? -1 : 1));
  const position = table.findIndex(t => t.isUs) + 1;

  // Expected finishing position by reputation
  const expected = [...leagueClubs, m.club].sort((a, b) => b.reputation - a.reputation).findIndex(c => c.id === m.club.id) + 1;
  const league = getLeague(m.club.league);
  const cupPower = power + (tactics.att + tactics.def) / 2;
  const finalWin = (oppRep) => Math.random() < clamp(0.5 + (cupPower - oppRep) / 50 + tactics.cupBonus, 0.15, 0.85);

  // League: title, promotion (direct or play-off) and relegation
  const lg = leagueOutcome(m.club, table, position);
  const isChampion = !league.secondTier && position === 1;
  let promoted = lg.directPromotion;
  let playoffWon = null;
  if (lg.playoff) {
    playoffWon = Math.random() < clamp(0.3 + (power - 70) / 40, 0.15, 0.7);
    promoted = playoffWon;
  }
  const relegated = lg.relegated;

  // National cup (lower divisions included) and international cup (if qualified)
  const domestic = simulateDomesticCup(m.club, cupPower, tactics.cupBonus);
  const domesticWon = Boolean(domestic?.final && finalWin(domestic.final.opponentRep));
  const entry = m.qualifiedFor?.clubId === m.club.id
    ? (m.qualifiedFor.tier ? { tier: m.qualifiedFor.tier, name: m.qualifiedFor.name } : null)
    : (estimatedEntry(m.club).tier ? { tier: estimatedEntry(m.club).tier, name: estimatedEntry(m.club).name } : null);
  const continental = simulateContinental(entry, m.club, cupPower, tactics.cupBonus);
  const continentalWon = Boolean(continental?.final && finalWin(continental.final.opponentRep));
  const cup = continental ? {
    name: continental.name,
    reached: continental.final ? 'Final' : continental.reached,
    won: continentalWon,
    eliminatedBy: continental.final && !continentalWon ? continental.final.opponent : continental.eliminatedBy,
  } : null;

  const titles = [];
  const year = START_YEAR + m.seasons;
  if (isChampion) titles.push(`${league.short} (${m.club.shortName}, ${year})`);
  if (promoted && league.promotesTo) titles.push(`Ascenso a ${getLeague(league.promotesTo).short} (${m.club.shortName}, ${year})`);
  if (domesticWon) titles.push(`${domestic.name} (${m.club.shortName}, ${year})`);
  if (continentalWon) titles.push(`${continental.name} (${m.club.shortName}, ${year})`);

  // Next season and the world
  const qualifiedFor = computeQualification(m.club, league.secondTier ? null : position, domesticWon);
  const { world, moves } = updateWorld(m.world || {}, {
    playerLeague: m.club.league,
    playerTable: table.map(t => ({ clubId: t.clubId, points: t.points })),
    playerClubId: m.club.id,
    playerPromotion: playoffWon,
  });

  // Board verdict: relegation = sacked; two bad seasons in a row (or finishing last) too
  let verdict = 'ok';
  const bad = position > expected + 4;
  if (relegated) verdict = 'fired';
  else if (isChampion || continentalWon || promoted || domesticWon) verdict = 'praised';
  else if (position === table.length && table.length >= 6) verdict = 'fired';
  else if (bad) verdict = m.strikes >= 1 ? 'fired' : 'warning';

  return {
    year, games, w, d, l, gf, ga, points, position, expected,
    table, isChampion, cup, domestic: domestic ? { name: domestic.name, reached: domestic.final ? 'Final' : domestic.reached, won: domesticWon, eliminatedBy: domestic.eliminatedBy } : null,
    titles, incidents, verdict, promoted, relegated, playoff: lg.playoff, qualifiedFor, world, moves,
  };
}

export function simulateManagerSeason(m) {
  return withWorld(m.world || {}, () => simulateManagerSeasonInWorld(m));
}

export function generateManagerOffers(m, prestige = getPrestige(m)) {
  return withWorld(m.world || {}, () => offersInWorld(m, prestige));
}

function offersInWorld(m, prestige) {
  const pool = getDtClubs().filter(c => c.id !== m.club.id && c.reputation <= prestige + 4);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const up = shuffled.filter(c => c.reputation > m.club.reputation).slice(0, 2);
  const rest = shuffled.filter(c => !up.includes(c)).slice(0, 3 - up.length);
  const offers = [...up, ...rest].slice(0, 3);
  // The club where you are a legend always calls back
  if (m.legacy?.clubId && m.legacy.clubId !== m.club.id && !offers.some(c => c.id === m.legacy.clubId)) {
    const home = getClubById(m.legacy.clubId);
    if (home) offers.unshift(home);
  }
  return offers.slice(0, 4);
}

export function applyManagerSeason(m, result) {
  const next = {
    ...m,
    seasons: m.seasons + 1,
    matches: m.matches + result.games,
    wins: m.wins + result.w,
    draws: m.draws + result.d,
    losses: m.losses + result.l,
    titles: m.titles + result.titles.length,
    trophyNames: [...m.trophyNames, ...result.titles],
    history: [{
      year: result.year, club: m.club.name, points: result.points, position: result.position,
      wins: result.w, draws: result.d, losses: result.l, gf: result.gf, ga: result.ga,
      isChampion: result.isChampion, cup: result.cup,
    }, ...m.history].slice(0, 40),
    inCup: Boolean(result.qualifiedFor?.tier),
    qualifiedFor: result.qualifiedFor,
    world: result.world || m.world || {},
    strikes: result.verdict === 'warning' ? m.strikes + 1 : 0,
    fired: result.verdict === 'fired',
  };
  // Promotion / relegation of your club
  const lg = getLeague(m.club.league);
  if (result.promoted && lg.secondTier && lg.promotesTo) {
    next.club = { ...m.club, league: lg.promotesTo, reputation: Math.min(82, m.club.reputation + 5) };
  } else if (result.relegated) {
    const second = LEAGUES.find(l => l.secondTier && l.promotesTo === m.club.league);
    if (second) next.club = { ...m.club, league: second.id };
  }
  next.pendingOffers = next.fired || result.isChampion || result.cup?.won || result.promoted || Math.random() < 0.5
    ? generateManagerOffers(next)
    : null;
  return next;
}

export function signWithClub(m, clubId) {
  return withWorld(m.world || {}, () => signInWorld(m, clubId));
}

function signInWorld(m, clubId) {
  const club = getClubById(clubId);
  return {
    ...m,
    club: { ...club },
    strikes: 0,
    fired: false,
    pendingOffers: null,
    inCup: Boolean(estimatedEntry(club).tier),
    qualifiedFor: estimatedEntry(club),
  };
}
