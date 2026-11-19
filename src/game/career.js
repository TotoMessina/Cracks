// Career Engine & Season Simulator for El Ídolo
import { CLUBS, COUNTRIES, getClubById, getCountryById, getLeague, refreshClub, setWorld } from '../data/clubs';
import { getClubObjective } from './world';
import { generateRivals, getNemesis } from './rivals';
import { getCoach, coachMinutesFactor } from './coach';
import { injuryMultiplier, newChallenge, challengeStartClub } from './challenges';
import { getContinentalEntry, simulateContinental, simulateDomesticCup, leagueOutcome, buildFinals, pickContinentalOpponent, estimatedQualification } from './competitions';

export const START_YEAR = 2026;
export const RETIREMENT_AGE = 38;
export const VOLUNTARY_RETIREMENT_AGE = 32;
export const TRAINING_REWARDS_PER_SEASON = 3;

const ELITE_NATIONS = ['ar', 'br', 'fr', 'es', 'de', 'it', 'en', 'pt', 'nl'];

/** Short display name of a league id (e.g. "Premier League"). */
export function leagueName(id) {
  return getLeague(id).short;
}

/**
 * Minutes plan chosen before each season.
 * matchesFactor: share of matches you play · energyCost: extra wear · injury: risk delta (%) · dt: coach reaction
 */
export const WORKLOADS = {
  rotacion: {
    id: 'rotacion', label: 'Rotar', icon: '🔄',
    desc: 'Jugás menos partidos (−20%), te cansás menos y te lesionás menos. Al DT no le gusta tanto.',
    matchesFactor: 0.8, energyCost: -12, injury: -5, dt: -2,
  },
  normal: {
    id: 'normal', label: 'Normal', icon: '⚖️',
    desc: 'La carga habitual de un titular.',
    matchesFactor: 1, energyCost: 0, injury: 0, dt: 0,
  },
  total: {
    id: 'total', label: 'Jugar todo', icon: '🔥',
    desc: 'Jugás todos los partidos (+12%): más goles y el DT feliz, pero terminás fundido y con más riesgo de lesión.',
    matchesFactor: 1.12, energyCost: 14, injury: 5, dt: 3,
  },
};

export function getWorkload(player) {
  return WORKLOADS[player?.workload] || WORKLOADS.normal;
}

/** Performance multiplier from energy at the start of the season (fresh = 1, exhausted = 0.85). */
export function energyPerformance(energy) {
  const e = energy ?? 100;
  if (e >= 70) return 1;
  return Math.max(0.85, 0.85 + ((e - 20) / 50) * 0.15);
}

/**
 * Bonus (in %) for the decisive minigames from form and end-of-season energy.
 * Returns { total, form, energy } so the UI can explain it.
 */
export function getConditionBonus(form = 0, energy = 100) {
  const formPart = Math.round((form || 0) * 4);
  const e = energy ?? 100;
  const energyPart = e >= 80 ? 3 : e >= 60 ? 0 : -Math.min(10, Math.round((60 - e) / 4));
  return { total: formPart + energyPart, form: formPart, energy: energyPart };
}

/**
 * Difficulty levels (chosen when the career starts).
 * powerAdj: team strength in the table · cupAdj: luck in cup ties · minigameBonus: % in decisive minigames · tierShift: makes tournaments harder
 * injury: risk delta · idolatryMult: how fast fans love you · keyAuto: simulated key matches · gloryMult: Hall of Fame score
 */
export const DIFFICULTIES = {
  facil: {
    id: 'facil', label: 'Fácil', icon: '🌱',
    desc: 'Tu equipo rinde más en la tabla y en las copas, minijuegos más amables, menos lesiones y la hinchada te quiere rápido. La gloria vale ×0,8.',
    powerAdj: 1.5, cupAdj: 0.04, rivalAdj: -2, minigameBonus: 8, tierShift: 0, injury: -3, idolatryMult: 1.2, keyAuto: 0.06, gloryMult: 0.8,
  },
  normal: {
    id: 'normal', label: 'Normal', icon: '⚽',
    desc: 'La experiencia pensada: los títulos cuestan y cada decisión pesa.',
    powerAdj: -1.5, cupAdj: -0.03, rivalAdj: 0, minigameBonus: 0, tierShift: 0, injury: 0, idolatryMult: 1, keyAuto: 0, gloryMult: 1,
  },
  leyenda: {
    id: 'leyenda', label: 'Leyenda', icon: '👑',
    desc: 'Tu equipo rinde menos en la tabla y en las copas, minijuegos un nivel más difíciles, más lesiones y una hinchada exigente. La gloria vale ×1,3.',
    powerAdj: -4, cupAdj: -0.08, rivalAdj: 2, minigameBonus: -5, tierShift: 1, injury: 3, idolatryMult: 0.8, keyAuto: -0.06, gloryMult: 1.3,
  },
};

export function getDifficulty(player) {
  return DIFFICULTIES[player?.difficulty] || DIFFICULTIES.normal;
}

const TIERS = ['normal', 'medium', 'hard'];
/** Minigame difficulty and bonus adjusted to the career difficulty. */
export function adjustMinigame(player, difficulty = 'normal', bonus = 0) {
  const d = getDifficulty(player);
  const idx = Math.min(TIERS.length - 1, Math.max(0, TIERS.indexOf(difficulty) + d.tierShift));
  return { difficulty: TIERS[idx] || difficulty, bonus: bonus + d.minigameBonus };
}

export function getKeyStat(position) {
  if (position === 'enganche') return 'pegada';
  if (position === 'arquero') return 'reflejos';
  return 'definicion';
}

export function getPositionStats(position, bonus = 0) {
  if (position === 'enganche') {
    return { pegada: 65 + bonus, gambeta: 63 + bonus, liderazgo: 60 + bonus, resistencia: 62 + bonus };
  }
  if (position === 'arquero') {
    return { reflejos: 66 + bonus, agilidad: 62 + bonus, salida: 60 + bonus, mando: 58 + bonus, resistencia: 68 + bonus };
  }
  return { definicion: 64 + bonus, potencia: 62 + bonus, gambeta: 60 + bonus, resistencia: 65 + bonus };
}

export function computeSalary(club, overall) {
  const rep = club?.reputation || 65;
  const skill = Math.max(0, overall - 55);
  const base = rep * rep * 12 + skill * skill * 250;
  const mult = getLeague(club?.league).salaryMult ?? 1;
  return Math.max(15000, Math.round((base * mult) / 1000) * 1000);
}

export function createInitialPlayer({
  name = "Pibe de Barrio",
  position = "delantero", // 'delantero', 'enganche', 'arquero'
  playstyle = "habilidoso", // 'habilidoso', 'cabulero', 'mixto'
  archetype = "normal", // 'normal', 'pibe_maravilla'
  country = "ar",
  initialClubId = 1001,
  gameMode = "standard", // 'standard', 'ultra', 'sin_reglas'
  difficulty = 'normal', // 'facil', 'normal', 'leyenda'
  challenge = null, // 'salvar' | 'ascenso'
  modifiers = [], // ['glass']
}) {
  const isWonderkid = archetype === 'pibe_maravilla';
  const stats = getPositionStats(position, isWonderkid ? 8 : 0);
  setWorld({}); // a new career starts with every club in its original league
  const chosenClub = getClubById(initialClubId);
  // A challenge decides where you start
  const initialClub = (challenge && challengeStartClub(challenge, chosenClub.league)) || chosenClub;

  const player = {
    id: 'career_' + Date.now(),
    name,
    age: 16,
    position,
    playstyle,
    archetype,
    country,
    stats,
    form: 0, // -2 to +2
    energy: 100,
    fame: isWonderkid ? 15 : 2,
    money: isWonderkid ? 25000 : 5000,
    coins: 20,
    currentClub: initialClub,
    salary: 0,
    idolatry: 15,
    hasStatue: false,
    seasonsPlayed: 0,
    totalGoals: 0,
    totalAssists: 0,
    totalMatches: 0,
    totalCleanSheets: 0,
    managerRelationship: 65,
    lockerRoomChemistry: 70,
    bonusFinal: 0,
    nationalTeamStats: { calledUp: false, matches: 0, goals: 0, assists: 0, cleanSheets: 0, titles: 0 },
    trophies: [],
    awards: [],
    clubHistory: [
      {
        clubId: initialClub.id,
        clubName: initialClub.name,
        seasons: 0,
        goals: 0,
        matches: 0,
        cleanSheets: 0,
        titles: 0,
        maxIdolatry: 15,
        leftAsRival: false,
      }
    ],
    lifestyle: [],
    seasonHistory: [],
    world: {},
    moments: [{ year: START_YEAR, age: 16, type: 'debut', icon: '🌱', text: `Debut profesional en ${initialClub.name}` }],
    seenDilemmas: [],
    gameMode,
    difficulty: DIFFICULTIES[difficulty] ? difficulty : 'normal',
    isRetired: false,
    // Off-season flow persisted in the save so a reload never skips a step
    offseasonStep: 'cards', // null | 'dilemma' | 'transfers' | 'cards'
    pendingCards: null,
    pendingDilemmaId: null,
    pendingOffers: null,
    seasonBoosts: { finalBonus: false, specialConcentration: false, recoveryPhysio: false, secondCard: false },
    trainingRewardsLeft: TRAINING_REWARDS_PER_SEASON,
  };

  if (gameMode === 'sin_reglas') {
    Object.keys(player.stats).forEach(k => { player.stats[k] = 99; });
    player.money = 50000000;
    player.fame = 90;
    player.coins = 999;
  }

  player.salary = computeSalary(initialClub, getPlayerOverall(player));
  player.contract = makeContract(player.salary, 3); // first professional contract
  player.rivals = generateRivals(player); // your generation (and your nemesis)
  player.nemesisDuel = { wins: 0, losses: 0 };
  player.challenge = challenge ? newChallenge(challenge, initialClub) : null;
  player.modifiers = Array.isArray(modifiers) ? [...modifiers] : [];
  player.marketValueHistory = [];
  return player;
}

/** Fill in fields missing from older saves so the game never crashes on load. */
export function normalizePlayer(saved) {
  if (!saved || !saved.name || !saved.currentClub || typeof saved.seasonsPlayed !== 'number') return null;
  const p = { ...saved };
  p.stats = { ...(p.stats || getPositionStats(p.position)) };
  // Old "sin reglas" saves had every stat of every position: keep only this position's
  const valid = Object.keys(getPositionStats(p.position));
  Object.keys(p.stats).forEach(k => { if (!valid.includes(k)) delete p.stats[k]; });
  valid.forEach(k => {
    const v = Number(p.stats[k]);
    p.stats[k] = Number.isFinite(v) ? v : 60;
  });
  p.energy ??= 100;
  p.managerRelationship ??= 65;
  p.lockerRoomChemistry ??= 70;
  p.form ??= 0;
  p.workload ??= 'normal';
  p.difficulty ??= 'normal';
  p.moments ??= [];
  p.pendingSupercups ??= [];
  if (!Array.isArray(p.rivals) || !p.rivals.length) p.rivals = generateRivals(p);
  p.nemesisDuel ??= { wins: 0, losses: 0 };
  if (p.qualifiedFor === undefined) {
    const q = estimatedQualification(p.currentClub);
    p.qualifiedFor = { clubId: p.currentClub.id, tier: q?.tier || null, name: q?.name || null };
  }
  p.coins ??= 0;
  p.money = Number.isFinite(p.money) ? p.money : 0;
  p.bonusFinal ??= 0;
  p.trophies ??= [];
  p.awards ??= [];
  p.lifestyle ??= [];
  p.seasonHistory ??= [];
  p.seenDilemmas ??= [];
  p.clubHistory ??= [];
  p.nationalTeamStats ??= { calledUp: false, matches: 0, goals: 0, assists: 0, cleanSheets: 0, titles: 0 };
  p.nationalTeam = getNationalCareer(p);
  if (p.nationalTeamStats.matches > 0 && p.nationalTeam.status === 'none') {
    p.nationalTeam = { ...p.nationalTeam, status: p.nationalTeamStats.matches >= 12 ? 'regular' : 'called', shirt: p.nationalTeamStats.matches >= 12 ? (p.position === 'arquero' ? 1 : p.position === 'enganche' ? 10 : 9) : 20 };
  }
  p.seasonBoosts ??= { finalBonus: false, specialConcentration: false, recoveryPhysio: false, secondCard: false };
  p.trainingRewardsLeft ??= TRAINING_REWARDS_PER_SEASON;
  p.offseasonStep ??= null;
  p.pendingCards ??= null;
  p.pendingDilemmaId ??= null;
  p.pendingOffers ??= null;
  p.world ??= {};
  setWorld(p.world);
  p.currentClub = refreshClub(p.currentClub);
  if (Array.isArray(p.pendingOffers)) p.pendingOffers = p.pendingOffers.map(o => ({ ...o, club: refreshClub(o.club) }));
  p.seasonInProgress ??= null;
  p.flags ??= {};
  p.scheduledDilemmas ??= [];
  p.nextSeasonMods ??= null;
  p.pendingDilemmaResult ??= null;
  p.clasicosWon ??= 0;
  if (!p.salary) p.salary = computeSalary(p.currentClub, getPlayerOverall(p));
  if (!p.contract) p.contract = { ...makeContract(p.salary, 1), yearsLeft: ['dilemma', 'transfers'].includes(p.offseasonStep) ? 0 : 1 };
  return p;
}

export function getIdolatryRank(score) {
  if (score >= 95) return { label: "Leyenda (Estatua)", color: "text-[#F6B40E]", icon: "🗽" };
  if (score >= 71) return { label: "Ídolo del Club", color: "text-[#22E748]", icon: "⭐" };
  if (score >= 46) return { label: "Referente", color: "text-blue-400", icon: "🛡️" };
  if (score >= 21) return { label: "Querido", color: "text-emerald-300", icon: "👏" };
  return { label: "Uno más del Plantel", color: "text-gray-400", icon: "👤" };
}

export function getPlayerOverall(player) {
  const vals = Object.values(player?.stats || {}).filter(v => Number.isFinite(v));
  if (vals.length === 0) return 60;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function checkNationalTeamCallUp(player) {
  const overall = getPlayerOverall(player);
  const fame = player.fame || 0;
  if (player.archetype === 'pibe_maravilla' && player.age <= 19 && overall >= 71) return true;
  if (ELITE_NATIONS.includes(player.country)) {
    return overall >= 77 || (overall >= 73 && fame >= 40);
  }
  return overall >= 72 || (overall >= 68 && fame >= 25);
}

export function getInternationalTournamentInfo(seasonsPlayed, countryCode) {
  const year = START_YEAR + seasonsPlayed;
  const country = getCountryById(countryCode);

  if (seasonsPlayed % 4 === 0) {
    return { type: 'world_cup', name: `Copa del Mundo ${year}`, shortName: 'Mundial', isMajor: true, isWorldCup: true, icon: '🌍' };
  }
  if (seasonsPlayed % 4 === 2) {
    let continentalName = `Copa América ${year}`;
    if (country.continent === 'eu') continentalName = `Eurocopa ${year}`;
    else if (country.continent === 'na') continentalName = `Copa Oro ${year}`;
    return { type: 'continental', name: continentalName, shortName: 'Copa Continental', isMajor: true, isWorldCup: false, icon: '🏆' };
  }
  return { type: 'qualifiers', name: `Eliminatorias ${year}`, shortName: 'Eliminatorias', isMajor: false, isWorldCup: false, icon: '⚽' };
}

export function getInjuryRisk(player) {
  const resistencia = player.stats?.resistencia || 65;
  const energy = player.energy ?? 100;
  let risk = 13;
  risk -= (resistencia - 60) * 0.25;
  if (player.lifestyle?.includes('fisio_personal')) risk -= 4;
  if (player.lifestyle?.includes('nutricionista_elite')) risk -= 3;
  if (player.lifestyle?.includes('kinesiologo_veterano')) risk -= 2;
  if (player.seasonBoosts?.recoveryPhysio) risk -= 3;
  if (player.age >= 32) risk += (player.age - 31) * 1.2;
  if (energy < 75) risk += (75 - energy) * 0.35;
  risk += getWorkload(player).injury;
  risk += getDifficulty(player).injury;
  if (player.seasonInProgress?.ntDecision === 'go') risk += 3; // a big summer tournament
  risk += player.nextSeasonMods?.injuryRisk || 0; // consequences of last season's decisions
  risk *= injuryMultiplier(player); // "Piernas de cristal"
  return Math.max(2, Math.min(45, Math.round(risk)));
}

export function calculateInjury(player) {
  if (Math.random() * 100 >= getInjuryRisk(player)) return null;

  const severityRoll = Math.random() * 100;
  if (severityRoll < 55) {
    return {
      type: 'leve',
      name: 'Contractura muscular / Esguince leve',
      desc: 'Molestia física que te obligó a perderte algunas fechas.',
      missedMatches: 4 + Math.floor(Math.random() * 4),
      formImpact: 0,
      statImpact: null
    };
  }
  if (severityRoll < 90) {
    return {
      type: 'moderada',
      name: 'Desgarro en el isquiotibial',
      desc: 'Pinchazo en pleno sprint. Te demandó más de un mes de kinesiología.',
      missedMatches: 9 + Math.floor(Math.random() * 7),
      formImpact: -1,
      statImpact: null
    };
  }
  return {
    type: 'grave',
    name: 'Rotura de ligamentos cruzados',
    desc: 'Giro en falso sobre el césped. Quirófano y largo tiempo sin tocar la pelota.',
    missedMatches: 18 + Math.floor(Math.random() * 10),
    formImpact: -1,
    statImpact: { resistencia: -2 }
  };
}


export function simulateSeasonMatches(player) {
  const overall = getPlayerOverall(player);
  const club = player.currentClub;
  const isGk = player.position === 'arquero';

  const hasMansion = player.lifestyle?.includes('mansion_nordelta') || player.lifestyle?.includes('mansion_cancha');
  const effectiveForm = hasMansion && player.form < 0 ? 0 : (player.form || 0);

  const managerRel = player.managerRelationship ?? 65;
  const chemistry = player.lockerRoomChemistry ?? 70;

  let baseMatches = 34 + Math.floor(Math.random() * 6);
  if (managerRel < 40) baseMatches = Math.max(18, Math.round(baseMatches * 0.8));
  else if (managerRel > 80) baseMatches += 3;
  // A kid in a club far above his level gets fewer minutes (less so with a coach who backs kids)
  const coach = getCoach(player);
  if (player.age <= 20 && club.reputation - overall > 12) baseMatches = Math.round(baseMatches * (coach?.style === 'pibes' ? 0.85 : 0.7));
  // The coach's style: some prefer kids, others veterans
  baseMatches = Math.round(baseMatches * coachMinutesFactor(coach, player));
  // Minutes plan (rotate / normal / play everything)
  const workload = getWorkload(player);
  baseMatches = Math.round(baseMatches * workload.matchesFactor);
  // Arriving exhausted makes you less decisive
  const perf = energyPerformance(player.energy);

  // Decisions from the last off-season (rotation, suspensions...)
  const mods = player.nextSeasonMods || {};
  if (mods.matchesFactor && mods.matchesFactor !== 1) baseMatches = Math.round(baseMatches * mods.matchesFactor);

  const injury = calculateInjury(player);
  const missedMatches = (injury ? injury.missedMatches : 0) + (mods.suspension || 0);
  const matches = Math.max(8, baseMatches - missedMatches);
  // Share of a standard 37-match season you actually played
  const matchesRatio = Math.max(0.2, Math.min(1.15, matches / 37));

  let seasonGoals = 0;
  let seasonAssists = 0;
  let seasonCleanSheets = 0;

  if (isGk) {
    const baseCleanSheets = Math.round((overall / 100) * 16) + (effectiveForm > 0 ? 3 : 0) + Math.round((club.reputation - 75) / 6);
    const unadjusted = Math.max(5, Math.min(26, (baseCleanSheets + Math.floor(Math.random() * 5 - 2)) * perf));
    seasonCleanSheets = Math.max(2, Math.round(unadjusted * matchesRatio));
  } else if (player.position === 'delantero') {
    const baseGoals = Math.round((player.stats.definicion / 100) * 26) + (effectiveForm * 3) + Math.round((club.reputation - 75) / 8);
    const unadjusted = Math.max(4, Math.min(48, (baseGoals + Math.floor(Math.random() * 8 - 4)) * perf));
    seasonGoals = Math.max(2, Math.round(unadjusted * matchesRatio));
    seasonAssists = Math.max(1, Math.floor(seasonGoals * 0.35 + Math.random() * 4));
  } else {
    const baseAssists = Math.round((player.stats.pegada / 100) * 20) + (effectiveForm * 2) + Math.round((club.reputation - 75) / 9);
    const unadjusted = Math.max(5, Math.min(32, (baseAssists + Math.floor(Math.random() * 6 - 3)) * perf));
    seasonAssists = Math.max(3, Math.round(unadjusted * matchesRatio));
    seasonGoals = Math.max(1, Math.floor(seasonAssists * 0.5 + Math.random() * 5));
  }

  // Salary comes from the signed contract
  const seasonEarnings = player.salary || computeSalary(club, overall);

  // Key matches already played this season push the team up (or down)
  const keyResults = player.seasonInProgress?.results || [];
  // Supercups are titles of their own: they don't change how the team does in the season
  const momentum = keyResults.filter(r => !r.isTitle);
  const keyWins = momentum.filter(r => r.won).length;
  const keyLosses = momentum.length - keyWins;
  if (isGk) seasonCleanSheets += keyWins;
  else seasonGoals += keyWins;

  const chemBonus = (chemistry - 70) * 0.2;
  const difficulty = getDifficulty(player);
  const teamPower = (club.reputation * 0.6) + (overall * 0.4) + chemBonus + effectiveForm * 1.5 + keyWins * 3 - keyLosses * 2 + difficulty.powerAdj;

  // National team
  const isCalledUp = playsForNationalTeam(player);
  const intlTournament = isCalledUp ? getInternationalTournamentInfo(player.seasonsPlayed, player.country) : null;
  let nationalActivity = null;

  if (isCalledUp && intlTournament) {
    const country = getCountryById(player.country);
    const isEliteNation = ELITE_NATIONS.includes(player.country);
    const intlMatches = intlTournament.isMajor ? (4 + Math.floor(Math.random() * 4)) : (3 + Math.floor(Math.random() * 2));
    let intlGoals = 0;
    let intlAssists = 0;
    let intlCleanSheets = 0;

    if (isGk) {
      intlCleanSheets = Math.max(1, Math.floor(intlMatches * 0.45 + (overall > 80 ? 1 : 0)));
    } else if (player.position === 'delantero') {
      intlGoals = Math.max(1, Math.floor(intlMatches * 0.6 + Math.random() * 2));
      intlAssists = Math.floor(intlGoals * 0.3);
    } else {
      intlAssists = Math.max(1, Math.floor(intlMatches * 0.5 + Math.random() * 2));
      intlGoals = Math.floor(intlAssists * 0.4);
    }

    let reachedNationalFinal = false;
    if (intlTournament.isMajor) {
      const nationBaseStrength = isEliteNation ? 75 : 55;
      const combinedPower = nationBaseStrength * 0.7 + overall * 0.3;
      const captainBoost = getNationalCareer(player).status === 'captain' ? 0.05 : 0;
      reachedNationalFinal = Math.random() < Math.max(0.15, Math.min(0.65, (combinedPower - 50) / 60 + captainBoost));
    }

    nationalActivity = {
      calledUp: true,
      tournament: intlTournament,
      countryName: country.name,
      countryFlag: country.flag,
      nationalTeamName: country.nationalTeam,
      matches: intlMatches,
      goals: intlGoals,
      assists: intlAssists,
      cleanSheets: intlCleanSheets,
      reachedFinal: reachedNationalFinal,
      finalTournament: reachedNationalFinal ? intlTournament.name : null,
    };
  }

  // League table (the player's club is always included, even after a promotion)
  let leagueClubs = CLUBS.filter(c => c.league === club.league && c.id !== club.id);
  leagueClubs = [...leagueClubs, club];
  const scoredClubs = leagueClubs.map(c => {
    const isPlayerTeam = c.id === club.id;
    const power = isPlayerTeam ? teamPower : c.reputation;
    const variance = (Math.random() * 18) - 9;
    return {
      clubId: c.id,
      name: c.name,
      shortName: c.shortName,
      points: Math.max(18, Math.min(88, Math.round((power * 0.75) + variance))),
      isPlayerTeam,
    };
  });

  scoredClubs.sort((a, b) => b.points - a.points || (a.isPlayerTeam ? -1 : 1));
  const playerPosition = scoredClubs.findIndex(c => c.isPlayerTeam) + 1;
  const playerPoints = scoredClubs[playerPosition - 1].points;
  const total = scoredClubs.length;

  const fullTable = scoredClubs.map((team, idx) => ({
    clubId: team.clubId,
    pos: idx + 1,
    name: team.shortName,
    points: team.points,
    isPlayerTeam: team.isPlayerTeam,
    zone: idx === 0 ? 'campeon' : idx < Math.max(2, Math.round(total * 0.3)) ? 'copa' : total >= 6 && idx >= total - 2 ? 'descenso' : 'medio'
  }));
  // Top 5 + always the player's row
  // ---- Competitions: league by the table, national cup, international cup ----
  const competitions = {
    league: leagueOutcome(club, scoredClubs, playerPosition),
    cup: simulateDomesticCup(club, teamPower, difficulty.cupAdj),
    continental: simulateContinental(getContinentalEntry(player), club, teamPower, difficulty.cupAdj),
  };
  const finals = buildFinals(club, competitions);
  const reachedFinal = finals.length > 0;
  const finalTournament = finals[0]?.tournament || null;

  const miniTable = fullTable.slice(0, 5);
  if (playerPosition > 5) miniTable.push(fullTable[playerPosition - 1]);

  // Energy: the season wears you down, the off-season gives part of it back
  const energyLoss = Math.max(8, 26 + workload.energyCost + (isCalledUp ? 4 : 0) + (injury ? 6 : 0) + (player.age >= 31 ? 3 : 0));
  const endEnergy = Math.max(10, (player.energy ?? 100) - energyLoss);
  const recovery = 30 + (player.lifestyle?.includes('kinesiologo_veterano') ? 8 : 0) + (player.lifestyle?.includes('fisio_personal') ? 6 : 0) + (player.lifestyle?.includes('mansion_nordelta') ? 4 : 0);
  const nextEnergy = Math.max(20, Math.min(100, endEnergy + recovery));

  let newManagerRel = managerRel;
  let newChemistry = chemistry;
  if (reachedFinal || (player.position === 'delantero' && seasonGoals >= 18) || (player.position === 'enganche' && seasonAssists >= 15) || (isGk && seasonCleanSheets >= 12)) {
    newManagerRel = Math.min(100, newManagerRel + 4);
    newChemistry = Math.min(100, newChemistry + 3);
  } else if (missedMatches > 12) {
    newManagerRel = Math.max(25, newManagerRel - 2);
  }
  newManagerRel = Math.max(0, Math.min(100, newManagerRel + workload.dt));

  return {
    workload: workload.id,
    startEnergy: player.energy ?? 100,
    endEnergy,
    keyMatches: keyResults,
    matches,
    baseMatches,
    missedMatches,
    goals: seasonGoals,
    assists: seasonAssists,
    cleanSheets: seasonCleanSheets,
    earnings: Math.round(seasonEarnings),
    reachedFinal,
    finalTournament,
    finals,
    competitions,
    injury,
    nextEnergy,
    newManagerRel,
    newChemistry,
    nationalTeam: nationalActivity,
    objective: getClubObjective(club),
    leagueStanding: {
      fullTable: fullTable.map(r => ({ clubId: r.clubId, points: r.points })),
      league: club.league,
      position: playerPosition,
      points: playerPoints,
      totalTeams: total,
      miniTable,
    }
  };
}

/**
 * Natural development: young players grow, veterans decline.
 * Returns { stats, changes } where changes = { stat: delta }.
 */
export function applySeasonDevelopment(player, seasonData) {
  const stats = { ...player.stats };
  const changes = {};
  const age = player.age; // age AFTER the season was played
  const isWonderkid = player.archetype === 'pibe_maravilla';
  const keyStat = getKeyStat(player.position);
  const bump = (k, d) => {
    if (stats[k] === undefined || d === 0) return;
    const before = stats[k];
    stats[k] = Math.max(45, Math.min(99, stats[k] + d));
    const real = stats[k] - before;
    if (real !== 0) changes[k] = (changes[k] || 0) + real;
  };

  Object.keys(stats).forEach(k => {
    let d = 0;
    const physical = ['resistencia', 'potencia', 'agilidad'].includes(k);
    const hasKinesio = player.lifestyle?.includes('kinesiologo_veterano');
    if (age <= 21) d = Math.floor(Math.random() * (isWonderkid ? 4 : 3)); // 0..+2 (0..+3 wonderkid)
    else if (age <= 25) d = Math.random() < 0.5 ? 1 : 0;
    else if (age <= 29) d = Math.random() < 0.25 ? 1 : 0;
    else if (age <= 32) d = physical && Math.random() < (hasKinesio ? 0.25 : 0.5) ? -1 : 0;
    else {
      if (physical) d = hasKinesio ? -1 : -2;
      else if (Math.random() < 0.5) d = -1;
    }
    bump(k, d);
  });

  // Great seasons sharpen your main weapon
  const greatSeason = (player.position === 'delantero' && seasonData.goals >= 20)
    || (player.position === 'enganche' && seasonData.assists >= 16)
    || (player.position === 'arquero' && seasonData.cleanSheets >= 14);
  if (greatSeason && age <= 32) bump(keyStat, 1);
  // Kids who play every week grow faster (the point of a loan)
  if (age <= 22 && seasonData.matches >= 30) bump(keyStat, 1);

  // Serious injuries leave a mark
  if (seasonData.injury?.statImpact) {
    Object.entries(seasonData.injury.statImpact).forEach(([k, v]) => bump(k, v));
  }

  return { stats, changes };
}

// ---------------------------------------------------------------------------
// Injuries with a decision: rush back (risk of relapse) or a full recovery
// ---------------------------------------------------------------------------
export const RELAPSE_CHANCE = { leve: 0.2, moderada: 0.3, grave: 0.45 };

/** Only injuries that cost a real chunk of the season ask you to decide. */
export const injuryNeedsDecision = (injury) => Boolean(injury) && injury.missedMatches >= 8 && !injury.choice;

/**
 * Apply the recovery choice to a simulated season.
 * - 'full': you miss every match, but no lasting damage.
 * - 'quick': you're back in about half the time; with a relapse you miss even more and it leaves a mark.
 */
export function applyInjuryChoice(result, choice, rng = Math.random) {
  const injury = result.injury;
  if (!injury || injury.choice) return result;
  const missed = injury.missedMatches;
  let delta = 0;
  let next = { ...injury, choice };
  if (choice === 'quick') {
    const relapse = rng() < (RELAPSE_CHANCE[injury.type] ?? 0.3);
    if (relapse) {
      delta = -Math.round(missed * 0.35);
      next = {
        ...next,
        relapse: true,
        missedMatches: missed - delta,
        statImpact: { ...(injury.statImpact || {}), resistencia: (injury.statImpact?.resistencia || 0) - 2 },
        outcome: `Volviste antes y recaíste: otras ${-delta} fechas afuera y la lesión te dejó secuelas.`,
      };
    } else {
      delta = Math.round(missed * 0.5);
      next = { ...next, relapse: false, missedMatches: missed - delta, outcome: `Te apuraste y salió bien: volviste ${delta} fechas antes.` };
    }
  } else {
    next = { ...next, statImpact: null, outcome: 'Recuperación completa: te perdiste todo lo que había que perderse, pero volviste sin secuelas.' };
  }
  const matches = Math.max(8, result.matches + delta);
  const ratio = result.matches > 0 ? matches / result.matches : 1;
  const scale = (v) => Math.max(0, Math.round((v || 0) * ratio));
  return {
    ...result,
    injury: next,
    matches,
    missedMatches: Math.max(0, (result.missedMatches || 0) - delta),
    goals: scale(result.goals),
    assists: scale(result.assists),
    cleanSheets: scale(result.cleanSheets),
    endEnergy: choice === 'quick' ? Math.max(10, (result.endEnergy ?? 70) - 6) : result.endEnergy,
  };
}

// ---------------------------------------------------------------------------
// Market value: level + last season + age + fame. It decides who comes for you.
// ---------------------------------------------------------------------------
const POSITION_NORM = { delantero: ['goals', 18], enganche: ['assists', 13], arquero: ['cleanSheets', 12] };

/** How your last season went compared with what's expected for your position (≈0.75..1.3). */
export function performanceIndex(player) {
  const last = player.seasonHistory?.[player.seasonHistory.length - 1];
  if (!last) return 1;
  const [stat, norm] = POSITION_NORM[player.position] || POSITION_NORM.delantero;
  const value = last[stat] ?? (stat === 'assists' ? Math.round((last.goals || 0) * 1.6) : 0);
  let idx = 0.75 + 0.3 * Math.min(1.7, value / norm);
  if (last.wonTitle) idx += 0.05;
  if ((last.matches || 0) < 20) idx -= 0.08;
  idx += (player.form || 0) * 0.02;
  return Math.max(0.75, Math.min(1.3, idx));
}

/** The level clubs see in you (it can be above or below your real level). */
export function marketRating(player) {
  const age = player.age;
  const ageAdj = age <= 21 ? 3 : age <= 24 ? 1 : age >= 33 ? -4 : age >= 30 ? -2 : 0;
  return Math.round(getPlayerOverall(player) + (performanceIndex(player) - 1) * 20 + ageAdj);
}

/** Market value in dollars. */
export function marketValue(player) {
  const rating = marketRating(player);
  const raw = 500000 * Math.pow(1.18, rating - 60) * (1 + (player.fame || 0) / 300);
  const step = raw >= 10000000 ? 100000 : 10000;
  return Math.max(50000, Math.round(raw / step) * step);
}

/** "$72,4 M" / "$850 mil" */
export function formatValue(v) {
  if (v >= 1000000) return `$${(v / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`;
  return `$${Math.round(v / 1000).toLocaleString('es-AR')} mil`;
}

export function generateTransferOffers(player) {
  // Clubs look at your market value (level + how you played + age), not only your level
  const overall = marketRating(player);
  const currentClub = player.currentClub;
  const offers = [];
  const lawyerMultiplier = player.lifestyle?.includes('abogado_deportivo_top') ? 1.15 : 1.0;
  const fameBoost = (player.fame || 0) / 10;

  // 1. Renewal: small raise over the market value
  const boardAngry = Boolean(player.flags?.boardAngry);
  const renewalSalary = Math.round(Math.max(player.salary || 0, computeSalary(currentClub, overall)) * (boardAngry ? 0.85 : 1.08) * lawyerMultiplier);
  offers.push({
    club: currentClub,
    isRenewal: true,
    isRival: false,
    salary: renewalSalary,
    message: boardAngry
      ? `La dirigencia de ${currentClub.name} no te perdona la protesta: te ofrece renovar, pero por menos de lo que valés.`
      : `Renovación en ${currentClub.name}: aumento de sueldo y +5 de idolatría por quedarte.`
  });

  // 2. The arch-rival tempts you
  if (currentClub.rivals?.length > 0 && overall >= 72) {
    const rivalClub = getClubById(currentClub.rivals[0]);
    if (rivalClub && rivalClub.id !== currentClub.id) {
      offers.push({
        club: rivalClub,
        isRenewal: false,
        isRival: true,
        salary: Math.round(computeSalary(rivalClub, overall) * 1.45 * lawyerMultiplier),
        message: `¡Oferta bomba del clásico rival! ${rivalClub.name} pone una fortuna para llevarte. Si firmás, serás el traidor.`
      });
    }
  }

  // 3. Clubs that match your level (a bit above or below).
  // Going abroad needs a decent level; the richest leagues want proven players.
  const homeContinent = getLeague(currentClub.league).continent;
  const canMoveTo = (c) => {
    const lg = getLeague(c.league);
    if (lg.salaryMult >= 1.8 && overall < 78) return false;
    if (lg.continent !== homeContinent && overall < 74) return false;
    return true;
  };
  const maxRep = overall + 10 + fameBoost;
  const minRep = Math.min(currentClub.reputation - 6, overall - 8);
  let candidates = CLUBS.filter(c =>
    c.id !== currentClub.id &&
    !(currentClub.rivals || []).includes(c.id) &&
    c.reputation <= maxRep &&
    c.reputation >= minRep &&
    canMoveTo(c)
  );
  if (candidates.length === 0) {
    candidates = CLUBS.filter(c => c.id !== currentClub.id && getLeague(c.league).continent === getLeague(currentClub.league).continent && c.reputation <= currentClub.reputation + 4);
  }

  // Prefer a "step up" club, then random
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const stepUp = Math.random() < 0.6 ? shuffled.find(c => c.reputation > currentClub.reputation) : null;
  const picks = stepUp ? [stepUp, ...shuffled.filter(c => c.id !== stepUp.id)] : shuffled;

  const hasYacht = player.lifestyle?.includes('yate_mediterraneo') || player.lifestyle?.includes('yate_lujo');
  const maxClubs = hasYacht ? 3 : 2;
  picks.slice(0, maxClubs).forEach(club => {
    offers.push({
      club,
      isRenewal: false,
      isRival: false,
      salary: Math.round(computeSalary(club, overall) * (1.05 + Math.random() * 0.15) * lawyerMultiplier),
      message: `${club.name} (${leagueName(club.league)}) te quiere como refuerzo. ${club.profile || ''}`.trim()
    });
  });

  // The European super-agent delivers what he promised
  if (player.flags?.europeanAgent) {
    const agentOffer = europeanAgentOffer(player);
    if (agentOffer && !offers.some(o => o.club.id === agentOffer.club.id)) offers.push(agentOffer);
  }

  return offers;
}

/** Pick the minigame for a given round, based on position + playstyle. */
export function pickMinigameType(player) {
  const r = Math.random();
  if (player?.playstyle === 'cabulero') return 'trile';
  if (player?.position === 'arquero') {
    return player?.playstyle === 'mixto' && r < 0.35 ? 'trile' : 'goalkeeper';
  }
  if (player?.playstyle === 'mixto' && r < 0.25) return 'trile';
  if (player?.position === 'enganche') return Math.random() < 0.6 ? 'freekick' : 'penalty';
  const r2 = Math.random();
  if (r2 < 0.45) return 'penalty';
  if (r2 < 0.8) return 'header';
  return 'freekick';
}


// ---------------------------------------------------------------------------
// Key matches: 1-2 big games per season that the player actually plays
// ---------------------------------------------------------------------------

const KEY_CONTEXTS = [
  'Minuto 88, empate 1-1. La última pelota del partido pasa por vos.',
  'Van 0-1 y quedan cinco minutos. La tribuna empuja.',
  'Minuto 90+3, 2-2. El que gana se lleva todo.',
  'Arranque del segundo tiempo, 0-0 y el partido está trabado.',
  'Minuto 80, ganan 1-0 pero el rival aprieta. Hay que liquidarlo.',
];
const GK_CONTEXTS = [
  'Minuto 90+2, ganan 1-0. Penal para el rival: todo depende de vos.',
  'Empate 1-1 en el descuento y el rival tiene un mano a mano.',
  'Minuto 85, 0-0. Les cobran un penal en contra.',
];

const difficultyForRep = (rep) => (rep >= 90 ? 'hard' : rep >= 80 ? 'medium' : 'normal');
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function makeKeyEvent(player, kind, opponent) {
  const isGk = player.position === 'arquero';
  const stakes = {
    clasico: { win: { idolatria: 6, dt: 3, forma: 1 }, lose: { idolatria: -4, dt: -2 } },
    decisivo: { win: { idolatria: 3, dt: 3 }, lose: { idolatria: -1, dt: -2 } },
    copa: { win: { idolatria: 4, fama: 3, dt: 2 }, lose: { idolatria: -2, dt: -1 } },
    seleccion: { win: { fama: 5, idolatria: 2 }, lose: { fama: -2 } },
  }[kind];
  const label = {
    clasico: 'Clásico',
    decisivo: 'Partido decisivo',
    copa: 'Noche de copa',
    seleccion: 'Selección',
  }[kind];
  return {
    id: `${kind}_${opponent.id}_${Math.random().toString(36).slice(2, 7)}`,
    kind,
    label,
    title: `${label} vs ${opponent.name}`,
    opponentName: opponent.name,
    opponentClubId: opponent.clubId || null,
    opponentCountry: opponent.country || null,
    context: pick(isGk ? GK_CONTEXTS : KEY_CONTEXTS),
    difficulty: difficultyForRep(opponent.rep),
    minigame: pickMinigameType(player),
    stakes,
  };
}

/** One-off title match (supercup, Recopa, Intercontinental) earned last season, played as a key match. */
export function makeSupercupEvent(player, sc) {
  const isGk = player.position === 'arquero';
  return {
    id: `${sc.kind}_${sc.opponent.id}_${Math.random().toString(36).slice(2, 7)}`,
    kind: sc.kind,
    isTitle: true,
    titleKind: sc.kind,
    tournament: sc.tournament,
    weight: sc.weight,
    label: sc.label,
    title: `${sc.tournament} vs ${sc.opponent.name}`,
    opponentName: sc.opponent.name,
    opponentClubId: sc.opponent.id,
    context: pick(isGk ? GK_CONTEXTS : KEY_CONTEXTS),
    difficulty: sc.difficulty,
    minigame: pickMinigameType(player),
    stakes: { win: { fama: sc.kind === 'intercontinental' ? 8 : 3 }, lose: {} },
  };
}

/** The title matches that open this season (only if you still play for the club that earned them). */
export function seasonOpeners(player) {
  return (player.pendingSupercups || [])
    .filter(sc => sc.clubId === player.currentClub?.id && sc.opponent)
    .map(sc => makeSupercupEvent(player, sc));
}

/** 1 or 2 key matches for the season: the derby (or a decisive league game) plus maybe a cup night or a national team game. */
export function generateKeyMatches(player) {
  const club = player.currentClub;
  const events = [];
  const rival = (club.rivals || []).map(id => CLUBS.find(c => c.id === id)).find(c => c && c.id !== club.id);
  if (rival) {
    events.push(makeKeyEvent(player, 'clasico', { id: rival.id, clubId: rival.id, name: rival.name, rep: rival.reputation }));
  } else {
    const strong = CLUBS.filter(c => c.league === club.league && c.id !== club.id).sort((a, b) => b.reputation - a.reputation).slice(0, 3);
    const opp = strong.length ? pick(strong) : pick(CLUBS.filter(c => c.id !== club.id));
    events.push(makeKeyEvent(player, 'decisivo', { id: opp.id, clubId: opp.id, name: opp.name, rep: opp.reputation }));
  }

  const extras = [];
  const continentalEntry = getContinentalEntry(player);
  if (continentalEntry) extras.push('copa');
  if (playsForNationalTeam(player)) extras.push('seleccion');
  if (extras.length && Math.random() < 0.75) {
    const kind = pick(extras);
    if (kind === 'copa') {
      const opp = pickContinentalOpponent(player, continentalEntry);
      const ev = makeKeyEvent(player, 'copa', { id: opp.id, clubId: opp.id, name: opp.name, rep: opp.reputation });
      ev.title = `${continentalEntry.name} vs ${opp.name}`;
      events.push(ev);
    } else {
      const country = pick(COUNTRIES.filter(c => c.id !== player.country));
      events.push(makeKeyEvent(player, 'seleccion', { id: country.id, country: country.id, name: country.name, rep: 85 }));
    }
  }
  // Your nemesis plays for that club? Everybody talks about the duel
  const nemesis = getNemesis(player);
  if (nemesis) {
    events.forEach(ev => {
      if (ev.opponentClubId && ev.opponentClubId === nemesis.clubId) {
        ev.nemesis = nemesis.name;
        ev.context = `Enfrente está ${nemesis.name}, tu némesis. ${ev.context}`;
      }
    });
  }
  return events;
}

/** Auto-resolve a key match (for players who prefer not to play the minigame). */
export function autoResolveKeyMatch(player, event) {
  const stat = player.stats?.[getKeyStat(player.position)] || 70;
  const penalty = event.difficulty === 'hard' ? 0.1 : event.difficulty === 'medium' ? 0.05 : 0;
  const energyAdj = ((player.energy ?? 100) - 70) * 0.003;
  const chance = Math.max(0.15, Math.min(0.8, 0.42 + (stat - 70) * 0.012 + (player.form || 0) * 0.04 + energyAdj - penalty + getDifficulty(player).keyAuto));
  return Math.random() < chance;
}

// ---------------------------------------------------------------------------
// Contracts: fixed salary for 1-5 years + release clause
// ---------------------------------------------------------------------------
/** Contract lengths a club offers depending on age (young players get long deals). */
export function contractYearsRange(age) {
  const max = age <= 23 ? 5 : age <= 29 ? 4 : age <= 32 ? 3 : 2;
  return { min: 1, max, suggested: Math.min(max, age <= 23 ? 4 : 3) };
}

/** One-off signing bonus: 10% of the yearly salary for each year signed. */
export function signingBonus(salary, years) {
  return Math.round((salary * 0.1 * years) / 1000) * 1000;
}

export function makeContract(salary, years) {
  const y = Math.max(1, Math.round(years));
  return {
    salary: Math.round(salary),
    years: y,
    yearsLeft: y,
    releaseClause: Math.round((salary * (3 + y)) / 10000) * 10000,
  };
}

/**
 * Off-season market.
 * - Contract expired: full market (renewal, other clubs, maybe the rival).
 * - Under contract: you stay, unless a bigger club pays your release clause
 *   or your club offers to renegotiate because you're underpaid.
 * Returns { free, offers } or null when there is nothing to decide.
 */
export function generateOffseasonMarket(player) {
  if (player.loan) return withContractTerms(player, loanEndMarket(player));
  return withContractTerms(player, buildOffseasonMarket(player));
}

function buildOffseasonMarket(player) {
  const contract = player.contract;
  const released = player.relegationRelease && player.relegationRelease === player.currentClub?.id;
  if (!contract || contract.yearsLeft <= 0 || released) {
    const offers = generateTransferOffers(player);
    if (released) {
      offers.forEach(o => {
        if (o.isRenewal) {
          o.loyalRelegation = true;
          o.message = `${player.currentClub.name} descendió. Si te quedás para devolverlo a primera, la hinchada no lo va a olvidar nunca.`;
        }
      });
    }
    return { free: true, offers, released: Boolean(released) };
  }

  const overall = getPlayerOverall(player);
  const club = player.currentClub;
  const lawyer = player.lifestyle?.includes('abogado_deportivo_top') ? 1.15 : 1.0;
  const offers = [{
    club,
    isStay: true,
    isRenewal: false,
    isRival: false,
    salary: contract.salary,
    years: contract.yearsLeft,
    message: `Seguís con tu contrato: ${contract.yearsLeft} ${contract.yearsLeft === 1 ? 'año' : 'años'} más a $${contract.salary.toLocaleString('es-AR')} por año.`,
  }];

  // Underpaid? The club offers a new, longer deal (if the coach backs you)
  const market = computeSalary(club, overall);
  if (market > contract.salary * 1.25 && (player.managerRelationship ?? 65) >= 50) {
    offers.push({
      club,
      isRenewal: true,
      isRenegotiation: true,
      isRival: false,
      salary: Math.round(market * lawyer),
      message: `Estás cobrando por debajo de tu nivel: ${club.shortName} te ofrece un contrato nuevo y mejor pago.`,
    });
  }

  // A bigger club pays the release clause (more likely if you outgrew your club)
  const chance = Math.max(0.05, Math.min(0.6, 0.15 + (marketRating(player) - club.reputation) * 0.03 + (player.fame || 0) / 400));
  if (Math.random() < chance) {
    const buyers = generateTransferOffers(player)
      .filter(o => !o.isRenewal && !o.isRival && o.club.reputation > club.reputation)
      .slice(0, 2);
    buyers.forEach(o => offers.push({
      ...o,
      paysClause: true,
      message: `${o.club.name} pagó tu cláusula de rescisión ($${contract.releaseClause.toLocaleString('es-AR')}) y te quiere ya. ${o.club.profile || ''}`.trim(),
    }));
  }

  // The European super-agent can get you out even with a contract
  if (player.flags?.europeanAgent && !offers.some(o => o.fromAgent)) {
    const agentOffer = europeanAgentOffer(player);
    if (agentOffer) offers.push(agentOffer);
  }

  // A kid without minutes: your club offers to loan you out for a year
  if (canGoOnLoan(player)) offers.push(...generateLoanOffers(player));

  return offers.length > 1 ? { free: false, offers } : null;
}

// ---------------------------------------------------------------------------
// Loans: a kid with no minutes at a big club goes to a smaller one for a year
// ---------------------------------------------------------------------------
export const LOAN_MAX_AGE = 21;

/** A kid too far below his club's level (the same gap that costs him minutes). */
export function canGoOnLoan(player, parentClub = player.currentClub) {
  if (!parentClub || player.age > LOAN_MAX_AGE) return false;
  return parentClub.reputation - getPlayerOverall(player) > 10;
}

/** Smaller clubs (same continent, ideally same country) where the kid would play every week. */
export function generateLoanOffers(player, parentClub = player.currentClub, count = 2) {
  const overall = getPlayerOverall(player);
  const home = getLeague(parentClub.league);
  const fits = (c) => c.id !== parentClub.id
    && c.id !== player.currentClub?.id
    && !(parentClub.rivals || []).includes(c.id)
    && c.reputation <= parentClub.reputation - 8
    && c.reputation >= overall - 8
    && c.reputation <= overall + 6;
  const sameCountry = CLUBS.filter(c => fits(c) && getLeague(c.league).countryName === home.countryName);
  const sameContinent = CLUBS.filter(c => fits(c) && getLeague(c.league).continent === home.continent);
  const pool = sameCountry.length >= count ? sameCountry : sameContinent;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count).map(club => ({
    club,
    isLoan: true,
    keepsContract: true,
    isRenewal: false,
    isRival: false,
    salary: player.contract?.salary || player.salary || 0,
    message: `${parentClub.shortName || parentClub.name} te cede un año a ${club.name} (${leagueName(club.league)}) para que sumes minutos. Seguís cobrando tu contrato y después elegís si volver.`,
  }));
}

/** End of a loan: go back to your club, stay for good, or (if you're still a kid) another loan. */
export function loanEndMarket(player) {
  const loan = player.loan;
  const parent = getClubById(loan.parentClubId) || player.currentClub;
  const loanClub = player.currentClub;
  const overall = getPlayerOverall(player);
  const yearsLeft = player.contract?.yearsLeft ?? 0;
  const lawyer = player.lifestyle?.includes('abogado_deportivo_top') ? 1.15 : 1.0;
  const offers = [];

  offers.push(yearsLeft > 0
    ? {
      club: parent,
      isLoanReturn: true,
      keepsContract: true,
      isRenewal: false,
      isRival: false,
      salary: player.contract.salary,
      message: `Volvés a ${parent.name} con más rodaje. Te ${yearsLeft === 1 ? 'queda 1 año' : `quedan ${yearsLeft} años`} de contrato.`,
    }
    : {
      club: parent,
      isLoanReturn: true,
      isRenewal: false,
      isRival: false,
      salary: Math.round(Math.max(player.salary || 0, computeSalary(parent, overall)) * 1.05 * lawyer),
      message: `Se terminó tu contrato, pero ${parent.name} te quiere de vuelta con un contrato nuevo.`,
    });

  // The loan club wants to keep you (if you were important there)
  if (overall >= loanClub.reputation - 6) {
    offers.push({
      club: loanClub,
      isLoanBuy: true,
      isRenewal: false,
      isRival: false,
      salary: Math.round(computeSalary(loanClub, overall) * 1.1 * lawyer),
      message: `${loanClub.name} quiere comprarte y ${parent.shortName || parent.name} acepta venderte. Te quedás donde jugás todos los domingos.`,
    });
  }

  // Still a kid without a place: another loan
  if (yearsLeft > 0 && canGoOnLoan(player, parent)) {
    offers.push(...generateLoanOffers(player, parent, 1));
  }

  return { free: yearsLeft <= 0, offers, loanEnd: true };
}

// ---------------------------------------------------------------------------
// Contract negotiation: ask for more money or more years, the club may walk away
// ---------------------------------------------------------------------------
/** Does accepting this offer mean signing a new contract? */
export function offerSignsContract(offer) {
  return Boolean(offer) && !offer.isStay && !offer.keepsContract;
}

/** Longest deal this club puts on the table (old players get shorter offers). */
export function offerMaxYears(player, offer) {
  const range = contractYearsRange(player.age);
  if (offer.isRenewal || offer.isLoanReturn) return range.max;
  return Math.max(1, range.max - (player.age >= 28 ? 1 : 0));
}

export const NEGOTIATION_ASKS = {
  money: { id: 'money', label: '+15% de sueldo', salary: 0.15, years: 0, risk: 0.15 },
  bigMoney: { id: 'bigMoney', label: '+30% de sueldo', salary: 0.30, years: 0, risk: 0.35 },
  years: { id: 'years', label: '+1 año de contrato', salary: 0, years: 1, risk: 0.12 },
};

/** How strong your position is in front of this club (0 = none, ~1 = a lot). */
export function negotiationLeverage(player, offer) {
  const overall = getPlayerOverall(player);
  let lev = 0.5 + (overall - offer.club.reputation) * 0.03 + (player.fame || 0) / 250;
  if (player.lifestyle?.includes('abogado_deportivo_top')) lev += 0.1;
  if (offer.isRival || offer.fromAgent) lev += 0.15; // they came for you
  if (offer.isRenewal && (player.idolatry || 0) >= 70) lev += 0.1; // the fans want you to stay
  if (offer.isRenewal && player.flags?.boardAngry) lev -= 0.2;
  return Math.max(0, Math.min(1.2, lev));
}

/** Chance the club says yes to an ask. */
export function negotiationOdds(player, offer, askId) {
  const ask = NEGOTIATION_ASKS[askId];
  const accept = Math.max(0.1, Math.min(0.9, 0.5 + negotiationLeverage(player, offer) * 0.45 - ask.risk));
  // If they don't accept, most of the time they counter; sometimes they walk away
  return { accept, counter: (1 - accept) * 0.6, withdraw: (1 - accept) * 0.4 };
}

/**
 * Ask the club for better terms. One try per offer.
 * Returns { outcome: 'accepted' | 'countered' | 'withdrawn', offer }.
 * `canWithdraw` is false when this is your only option (the club then counters).
 */
export function negotiateOffer(player, offer, askId, { rng = Math.random, canWithdraw = true } = {}) {
  const ask = NEGOTIATION_ASKS[askId];
  if (!ask || !offerSignsContract(offer) || offer.negotiated) return { outcome: null, offer };
  const odds = negotiationOdds(player, offer, askId);
  const roll = rng();
  const baseMax = offer.maxYears ?? offerMaxYears(player, offer);
  const club = offer.club.shortName || offer.club.name;
  let outcome = roll < odds.accept ? 'accepted' : roll < odds.accept + odds.counter || !canWithdraw ? 'countered' : 'withdrawn';

  if (outcome === 'withdrawn') {
    return {
      outcome,
      offer: { ...offer, negotiated: true, withdrawn: true, negotiation: { outcome, text: `${club} se ofendió y retiró la oferta.` } },
    };
  }
  const share = outcome === 'accepted' ? 1 : 0.5;
  const salary = Math.round((offer.salary * (1 + ask.salary * share)) / 1000) * 1000;
  const maxYears = outcome === 'accepted' ? Math.min(6, baseMax + ask.years) : baseMax;
  const text = outcome === 'accepted'
    ? `${club} aceptó: ${ask.salary ? `sueldo de $${salary.toLocaleString('es-AR')}` : `hasta ${maxYears} años de contrato`}.`
    : ask.salary
      ? `${club} no llega a tanto, pero sube a $${salary.toLocaleString('es-AR')}. Lo tomás o lo dejás.`
      : `${club} no da más años, pero mantiene la oferta.`;
  return {
    outcome,
    offer: { ...offer, salary, maxYears, negotiated: true, negotiation: { outcome, text } },
  };
}

/** Every market offer that signs a contract says how many years the club offers. */
function withContractTerms(player, market) {
  if (!market) return market;
  return {
    ...market,
    offers: market.offers.map(o => (offerSignsContract(o) && o.maxYears === undefined ? { ...o, maxYears: offerMaxYears(player, o) } : o)),
  };
}

/** Offer from the "European super-agent" (flag europeanAgent): a club from Europe near your level. */
export function europeanAgentOffer(player) {
  const overall = getPlayerOverall(player);
  const pool = CLUBS.filter(c => getLeague(c.league).continent === 'eu' && c.id !== player.currentClub.id && !getLeague(c.league).secondTier);
  const near = pool.filter(c => c.reputation <= overall + 6 && c.reputation >= overall - 10);
  const club = pick(near.length ? near : [...pool].sort((a, b) => a.reputation - b.reputation).slice(0, 8));
  if (!club) return null;
  return {
    club,
    isRenewal: false,
    isRival: false,
    paysClause: Boolean(player.contract?.yearsLeft > 0),
    fromAgent: true,
    salary: Math.round(computeSalary(club, overall) * 1.1),
    message: `Tu representante cumplió su promesa: ${club.name} (${getLeague(club.league).short}) te quiere en Europa.`,
  };
}


// ---------------------------------------------------------------------------
// National team career: call-ups, the decision to go, shirt number and status
// ---------------------------------------------------------------------------
export const NT_STATUS_LABEL = { none: 'Sin convocar', called: 'Convocado', regular: 'Titular', captain: 'Capitán' };

const DEFAULT_NT = { status: 'none', shirt: null, declined: 0, skipNext: false };

export function getNationalCareer(player) {
  return { ...DEFAULT_NT, ...(player?.nationalTeam || {}) };
}

/** Tournament you are called up for this season, or null. */
export function getNationalCallUp(player) {
  const nt = getNationalCareer(player);
  if (nt.skipNext) return null;
  const called = checkNationalTeamCallUp(player) || Boolean(player.nextSeasonMods?.forceCallUp);
  return called ? getInternationalTournamentInfo(player.seasonsPlayed, player.country) : null;
}

/** Will you actually play with the national team this season? */
export function playsForNationalTeam(player) {
  return Boolean(getNationalCallUp(player)) && player.seasonInProgress?.ntDecision !== 'decline';
}

function mainShirt(position) {
  return position === 'arquero' ? 1 : position === 'enganche' ? 10 : 9;
}

function benchShirt(position) {
  const pool = position === 'arquero' ? [12, 23] : [14, 16, 18, 19, 20, 21, 22, 24, 25, 26];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Bonus (%) in national-team finals: the captain carries the team. */
export function nationalFinalBonus(player) {
  return getNationalCareer(player).status === 'captain' ? 5 : 0;
}

/**
 * Updates status/shirt after a season. Returns { nationalTeam, messages }.
 * played: participated with the national team this season. declined: said no to a major tournament.
 */
export function updateNationalCareer(player, { played, declined, overall }) {
  const nt = getNationalCareer(player);
  const messages = [];
  const caps = player.nationalTeamStats?.matches || 0;
  const teamName = getCountryById(player.country).nationalTeam;

  if (declined) {
    nt.declined += 1;
    nt.skipNext = overall < 85;
    messages.push(nt.skipNext
      ? `El DT de ${teamName} no te perdonó el faltazo: la próxima temporada no te convoca.`
      : `Sos indiscutido: aunque faltaste, ${teamName} te va a seguir llamando.`);
  } else if (nt.skipNext) {
    nt.skipNext = false; // the punishment was served
  }

  if (played) {
    if (nt.status === 'none' || !nt.shirt) {
      nt.status = 'called';
      nt.shirt = benchShirt(player.position);
      messages.push(`Debutaste en ${teamName} con la camiseta número ${nt.shirt}.`);
    }
    if (player.flags?.nationalShirt10 && nt.shirt !== 10) {
      nt.shirt = 10;
      messages.push('Ganaste la pulseada: ahora usás la 10 de la Selección.');
    }
    if (nt.status === 'called' && caps >= 12 && overall >= 77) {
      nt.status = 'regular';
      const s = mainShirt(player.position);
      if (nt.shirt !== 10 || player.position === 'enganche') nt.shirt = s;
      messages.push(`Te ganaste la titularidad en ${teamName}: ahora sos el ${nt.shirt}.`);
    } else if (nt.status === 'regular' && caps >= 45 && player.age >= 27 && player.age <= 33 && overall >= 84
      && ((player.fame || 0) >= 75 || (player.stats?.liderazgo || 0) >= 84) && Math.random() < 0.25) {
      nt.status = 'captain';
      messages.push(`¡Te dieron la cinta de capitán de ${teamName}!`);
    }
  }
  return { nationalTeam: nt, messages };
}
