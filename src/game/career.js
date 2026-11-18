// Career Engine & Season Simulator for El Ídolo
import { CLUBS, COUNTRIES, getClubById, getCountryById, getLeague, refreshClub } from '../data/clubs';

export const START_YEAR = 2026;
export const RETIREMENT_AGE = 38;
export const VOLUNTARY_RETIREMENT_AGE = 32;
export const TRAINING_REWARDS_PER_SEASON = 3;

const ELITE_NATIONS = ['ar', 'br', 'fr', 'es', 'de', 'it', 'en', 'pt', 'nl'];

/** Short display name of a league id (e.g. "Premier League"). */
export function leagueName(id) {
  return getLeague(id).short;
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
}) {
  const isWonderkid = archetype === 'pibe_maravilla';
  const stats = getPositionStats(position, isWonderkid ? 8 : 0);
  const initialClub = getClubById(initialClubId);

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
    seenDilemmas: [],
    gameMode,
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
  p.seasonBoosts ??= { finalBonus: false, specialConcentration: false, recoveryPhysio: false, secondCard: false };
  p.trainingRewardsLeft ??= TRAINING_REWARDS_PER_SEASON;
  p.offseasonStep ??= null;
  p.pendingCards ??= null;
  p.pendingDilemmaId ??= null;
  p.pendingOffers ??= null;
  p.currentClub = refreshClub(p.currentClub);
  if (Array.isArray(p.pendingOffers)) p.pendingOffers = p.pendingOffers.map(o => ({ ...o, club: refreshClub(o.club) }));
  p.seasonInProgress ??= null;
  p.clasicosWon ??= 0;
  if (!p.salary) p.salary = computeSalary(p.currentClub, getPlayerOverall(p));
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
  return Math.max(2, Math.min(32, Math.round(risk)));
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

function pickFinalTournament(club) {
  const league = getLeague(club.league);
  if (league.secondTier) return league.promotionFinal;
  const r = Math.random();
  // Only strong clubs play the continental cup final
  if (club.reputation >= 78 && r < 0.35) return league.continentalCup;
  return r < 0.75 ? league.short : league.cup;
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
  // A kid in a club far above his level gets fewer minutes
  if (player.age <= 20 && club.reputation - overall > 12) baseMatches = Math.round(baseMatches * 0.7);

  const injury = calculateInjury(player);
  const missedMatches = injury ? injury.missedMatches : 0;
  const matches = Math.max(8, baseMatches - missedMatches);
  const matchesRatio = matches / baseMatches;

  let seasonGoals = 0;
  let seasonAssists = 0;
  let seasonCleanSheets = 0;

  if (isGk) {
    const baseCleanSheets = Math.round((overall / 100) * 16) + (effectiveForm > 0 ? 3 : 0) + Math.round((club.reputation - 75) / 6);
    const unadjusted = Math.max(5, Math.min(26, baseCleanSheets + Math.floor(Math.random() * 5 - 2)));
    seasonCleanSheets = Math.max(2, Math.round(unadjusted * matchesRatio));
  } else if (player.position === 'delantero') {
    const baseGoals = Math.round((player.stats.definicion / 100) * 26) + (effectiveForm * 3) + Math.round((club.reputation - 75) / 8);
    const unadjusted = Math.max(4, Math.min(48, baseGoals + Math.floor(Math.random() * 8 - 4)));
    seasonGoals = Math.max(2, Math.round(unadjusted * matchesRatio));
    seasonAssists = Math.max(1, Math.floor(seasonGoals * 0.35 + Math.random() * 4));
  } else {
    const baseAssists = Math.round((player.stats.pegada / 100) * 20) + (effectiveForm * 2) + Math.round((club.reputation - 75) / 9);
    const unadjusted = Math.max(5, Math.min(32, baseAssists + Math.floor(Math.random() * 6 - 3)));
    seasonAssists = Math.max(3, Math.round(unadjusted * matchesRatio));
    seasonGoals = Math.max(1, Math.floor(seasonAssists * 0.5 + Math.random() * 5));
  }

  // Salary comes from the signed contract
  const seasonEarnings = player.salary || computeSalary(club, overall);

  // Key matches already played this season push the team up (or down)
  const keyResults = player.seasonInProgress?.results || [];
  const keyWins = keyResults.filter(r => r.won).length;
  const keyLosses = keyResults.length - keyWins;
  if (isGk) seasonCleanSheets += keyWins;
  else seasonGoals += keyWins;

  const chemBonus = (chemistry - 70) * 0.2;
  const teamPower = (club.reputation * 0.6) + (overall * 0.4) + chemBonus + effectiveForm * 1.5 + keyWins * 3 - keyLosses * 2;
  const reachedFinalChance = Math.max(0.1, Math.min(0.8, (teamPower - 48) / 58));
  const reachedFinal = Math.random() < reachedFinalChance;
  const finalTournament = reachedFinal ? pickFinalTournament(club) : null;

  // National team
  const isCalledUp = checkNationalTeamCallUp(player);
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
      reachedNationalFinal = Math.random() < Math.max(0.15, Math.min(0.6, (combinedPower - 50) / 60));
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
    const variance = (Math.random() * 14) - 7;
    return {
      clubId: c.id,
      name: c.name,
      shortName: c.shortName,
      points: Math.max(18, Math.min(88, Math.round((power * 0.75) + variance))),
      isPlayerTeam,
    };
  });

  if (reachedFinal) {
    const playerEntry = scoredClubs.find(c => c.isPlayerTeam);
    const maxPoints = Math.max(...scoredClubs.map(c => c.points));
    playerEntry.points = Math.max(playerEntry.points, maxPoints - 2);
  }

  scoredClubs.sort((a, b) => b.points - a.points || (a.isPlayerTeam ? -1 : 1));
  const playerPosition = scoredClubs.findIndex(c => c.isPlayerTeam) + 1;
  const playerPoints = scoredClubs[playerPosition - 1].points;
  const total = scoredClubs.length;

  const fullTable = scoredClubs.map((team, idx) => ({
    pos: idx + 1,
    name: team.shortName,
    points: team.points,
    isPlayerTeam: team.isPlayerTeam,
    zone: idx === 0 ? 'campeon' : idx < Math.max(2, Math.round(total * 0.3)) ? 'copa' : total >= 6 && idx >= total - 2 ? 'descenso' : 'medio'
  }));
  // Top 5 + always the player's row
  const miniTable = fullTable.slice(0, 5);
  if (playerPosition > 5) miniTable.push(fullTable[playerPosition - 1]);

  const energyLoss = 25 + (isCalledUp ? 6 : 0) + (injury ? 8 : 0);
  const recovery = 35 + (player.lifestyle?.includes('kinesiologo_veterano') ? 8 : 0) + (player.lifestyle?.includes('fisio_personal') ? 6 : 0);
  const nextEnergy = Math.max(20, Math.min(100, (player.energy ?? 100) - energyLoss + recovery));

  let newManagerRel = managerRel;
  let newChemistry = chemistry;
  if (reachedFinal || (player.position === 'delantero' && seasonGoals >= 18) || (player.position === 'enganche' && seasonAssists >= 15) || (isGk && seasonCleanSheets >= 12)) {
    newManagerRel = Math.min(100, newManagerRel + 4);
    newChemistry = Math.min(100, newChemistry + 3);
  } else if (missedMatches > 12) {
    newManagerRel = Math.max(25, newManagerRel - 2);
  }

  return {
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
    injury,
    nextEnergy,
    newManagerRel,
    newChemistry,
    nationalTeam: nationalActivity,
    leagueStanding: {
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

  // Serious injuries leave a mark
  if (seasonData.injury?.statImpact) {
    Object.entries(seasonData.injury.statImpact).forEach(([k, v]) => bump(k, v));
  }

  return { stats, changes };
}

export function generateTransferOffers(player) {
  const overall = getPlayerOverall(player);
  const currentClub = player.currentClub;
  const offers = [];
  const lawyerMultiplier = player.lifestyle?.includes('abogado_deportivo_top') ? 1.15 : 1.0;
  const fameBoost = (player.fame || 0) / 10;

  // 1. Renewal: small raise over the market value
  const renewalSalary = Math.round(Math.max(player.salary || 0, computeSalary(currentClub, overall)) * 1.08 * lawyerMultiplier);
  offers.push({
    club: currentClub,
    isRenewal: true,
    isRival: false,
    salary: renewalSalary,
    message: `Renovación en ${currentClub.name}: aumento de sueldo y +5 de idolatría por quedarte.`
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
  const league = getLeague(club.league);
  if (!league.secondTier && club.reputation >= 80) extras.push('copa');
  if (checkNationalTeamCallUp(player)) extras.push('seleccion');
  if (extras.length && Math.random() < 0.75) {
    const kind = pick(extras);
    if (kind === 'copa') {
      const sameContinent = CLUBS.filter(c => c.league !== club.league && c.reputation >= 82 && getLeague(c.league).continent === league.continent);
      const pool = sameContinent.length ? sameContinent : CLUBS.filter(c => c.league !== club.league && c.reputation >= 85);
      const opp = pick(pool);
      events.push(makeKeyEvent(player, 'copa', { id: opp.id, clubId: opp.id, name: opp.name, rep: opp.reputation }));
    } else {
      const country = pick(COUNTRIES.filter(c => c.id !== player.country));
      events.push(makeKeyEvent(player, 'seleccion', { id: country.id, country: country.id, name: country.name, rep: 85 }));
    }
  }
  return events;
}

/** Auto-resolve a key match (for players who prefer not to play the minigame). */
export function autoResolveKeyMatch(player, event) {
  const stat = player.stats?.[getKeyStat(player.position)] || 70;
  const penalty = event.difficulty === 'hard' ? 0.1 : event.difficulty === 'medium' ? 0.05 : 0;
  const chance = Math.max(0.2, Math.min(0.75, 0.42 + (stat - 70) * 0.012 + (player.form || 0) * 0.04 - penalty));
  return Math.random() < chance;
}
