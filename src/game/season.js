// Pure season wrap-up logic: takes the previous player and returns a brand-new one.
// Never mutates its inputs (safe under React StrictMode double-invocation).
import {
  START_YEAR,
  RETIREMENT_AGE,
  TRAINING_REWARDS_PER_SEASON,
  getPlayerOverall,
  applySeasonDevelopment,
  computeSalary,
} from './career';
import { getLeague } from '../data/clubs';
import { addIdolatry, withStatueCheck, applyEffects } from './effects';

const PASSIVE_INCOME_DEPT = 35000;

function trophyIcon(title) {
  if (title.includes('Libertadores')) return '🏆';
  if (title.includes('Champions') || title.includes('Concacaf')) return '⭐';
  if (title.includes('Ascenso')) return '🎖️';
  if (title.includes('Mundo')) return '🌍';
  return '🥇';
}

export function finalizeSeasonState(prev, seasonData, {
  wonFinal = false,
  tournamentName = null,
  wonNationalFinal = false,
  nationalTournamentName = null,
} = {}) {
  const year = START_YEAR + prev.seasonsPlayed;
  const next = {
    ...prev,
    stats: { ...prev.stats },
    trophies: [...(prev.trophies || [])],
    awards: [...(prev.awards || [])],
    clubHistory: (prev.clubHistory || []).map(h => ({ ...h })),
    currentClub: { ...prev.currentClub },
  };

  next.seasonsPlayed += 1;
  next.age += 1;
  next.totalMatches += seasonData.matches;
  next.totalGoals += seasonData.goals;
  next.totalAssists += seasonData.assists;
  next.totalCleanSheets += seasonData.cleanSheets;

  next.energy = seasonData.nextEnergy ?? 100;
  next.managerRelationship = seasonData.newManagerRel ?? 65;
  next.lockerRoomChemistry = seasonData.newChemistry ?? 70;

  // Form drifts back toward 0 every season, injuries push it down
  let form = prev.form || 0;
  form = form > 0 ? form - 1 : form < 0 ? form + 1 : 0;
  if (seasonData.injury?.formImpact) form += seasonData.injury.formImpact;
  next.form = Math.max(-2, Math.min(2, form));

  // Money
  const passiveIncome = prev.lifestyle?.includes('departamento_puerto_madero') ? PASSIVE_INCOME_DEPT : 0;
  const titleBonus = (wonFinal ? Math.round(seasonData.earnings * 0.25) : 0) + (wonNationalFinal ? 150000 : 0);
  next.money = (prev.money || 0) + seasonData.earnings + passiveIncome + titleBonus;

  // Coins: base + performance
  let coinsEarned = 5;
  if (wonFinal) coinsEarned += 4;
  if (wonNationalFinal) coinsEarned += 4;
  if (seasonData.leagueStanding?.position === 1) coinsEarned += 2;
  next.coins = (prev.coins || 0) + coinsEarned;

  // Idolatry
  // A forgettable season makes the fans' memory fade a little
  let idolatryGain = 3;
  if (wonFinal) idolatryGain += 12;
  if (wonNationalFinal) idolatryGain += 6;
  if (seasonData.goals > 20 || seasonData.cleanSheets > 14 || seasonData.assists > 16) idolatryGain += 6;
  if (seasonData.matches < 20) idolatryGain -= 4;
  if (!wonFinal && !wonNationalFinal && (seasonData.leagueStanding?.position || 99) > 3) idolatryGain -= 4;

  let promotedToPrimera = false;
  const clubLeague = getLeague(prev.currentClub.league);
  if (wonFinal && clubLeague.secondTier && clubLeague.promotesTo && tournamentName === clubLeague.promotionFinal) {
    promotedToPrimera = true;
    idolatryGain += 12;
    next.currentClub = {
      ...next.currentClub,
      league: clubLeague.promotesTo,
      reputation: Math.min(82, (next.currentClub.reputation || 65) + 5),
    };
  }

  next.idolatry = addIdolatry(prev.idolatry, idolatryGain);
  idolatryGain = next.idolatry - (prev.idolatry || 0);

  // Club trophy
  if (wonFinal && tournamentName) {
    next.trophies.push({ title: tournamentName, year, clubName: next.currentClub.name, icon: trophyIcon(tournamentName) });
  }

  // National team
  if (seasonData.nationalTeam) {
    const nt = seasonData.nationalTeam;
    const prevNt = prev.nationalTeamStats || { matches: 0, goals: 0, assists: 0, cleanSheets: 0, titles: 0 };
    next.nationalTeamStats = {
      calledUp: true,
      matches: prevNt.matches + nt.matches,
      goals: prevNt.goals + nt.goals,
      assists: prevNt.assists + nt.assists,
      cleanSheets: prevNt.cleanSheets + nt.cleanSheets,
      titles: prevNt.titles + (wonNationalFinal ? 1 : 0),
    };

    if (wonNationalFinal && nationalTournamentName) {
      const isWc = nationalTournamentName.includes('Mundo');
      next.trophies.push({ title: nationalTournamentName, year, clubName: nt.nationalTeamName, icon: isWc ? '🌍' : '🏆' });
      next.fame = Math.min(100, (next.fame || 0) + (isWc ? 35 : 20));
      next.awards.push({
        name: isWc ? `Campeón del Mundo (${year})` : `Campeón Continental (${year})`,
        year,
        description: `Consagración histórica vistiendo los colores de ${nt.nationalTeamName}.`,
        icon: isWc ? '🌍' : '🏆',
      });
    }
  }

  // Fame grows a bit with every good season
  next.fame = Math.min(100, (next.fame || 0) + (wonFinal ? 6 : 2) + (seasonData.goals >= 20 ? 3 : 0));

  if (promotedToPrimera) {
    next.awards.push({
      name: `Héroe del Ascenso (${year})`,
      year,
      description: `Llevaste a ${next.currentClub.name} a la máxima categoría.`,
      icon: '🎖️',
    });
  }

  if (next.position === 'delantero' && seasonData.goals >= 24) {
    next.awards.push({ name: 'Botín de Oro de la Temporada', year, description: `Máximo artillero con ${seasonData.goals} goles.`, icon: '👟' });
  } else if (next.position === 'arquero' && seasonData.cleanSheets >= 16) {
    next.awards.push({ name: 'Guante de Oro al Mejor Arquero', year, description: `Récord de ${seasonData.cleanSheets} vallas invictas.`, icon: '🧤' });
  } else if (next.position === 'enganche' && seasonData.assists >= 18) {
    next.awards.push({ name: 'Rey de las Asistencias', year, description: `Líder en creación con ${seasonData.assists} asistencias.`, icon: '🎯' });
  }

  // Natural development (growth / decline) — computed after aging
  const { stats, changes } = applySeasonDevelopment(next, seasonData);
  next.stats = stats;
  const overall = getPlayerOverall(next);

  if (next.age <= 21 && overall >= 74 && Math.random() < 0.7) {
    next.awards.push({ name: 'Pibe Revelación del Año', year, description: 'Elegido la mayor promesa juvenil del continente.', icon: '⭐' });
  }
  if (wonFinal && Math.random() < 0.75) {
    next.awards.push({ name: `Figura de la Final (${tournamentName || 'Copa'})`, year, description: 'Determinante en la noche más importante.', icon: '🎖️' });
  }
  if (overall >= 86 && (wonFinal || wonNationalFinal) && Math.random() < 0.6) {
    next.awards.push({ name: 'Balón de Oro / Mejor Jugador', year, description: 'Elegido el futbolista más determinante del continente.', icon: '🌕' });
  }
  if (next.totalGoals >= 100 && !next.awards.some(a => a.name === 'Club de los 100 Goles')) {
    next.awards.push({ name: 'Club de los 100 Goles', year, description: `Hito histórico: ${next.totalGoals} goles oficiales.`, icon: '⚽' });
  }
  if (next.totalCleanSheets >= 50 && !next.awards.some(a => a.name === 'Muro Imbatible (50 Vallas Invictas)')) {
    next.awards.push({ name: 'Muro Imbatible (50 Vallas Invictas)', year, description: `${next.totalCleanSheets} partidos con el arco en cero.`, icon: '🛡️' });
  }

  // Club history
  let entry = next.clubHistory.find(h => h.clubId === next.currentClub.id);
  if (!entry) {
    entry = { clubId: next.currentClub.id, clubName: next.currentClub.name, seasons: 0, goals: 0, matches: 0, cleanSheets: 0, titles: 0, maxIdolatry: 0, leftAsRival: false };
    next.clubHistory.push(entry);
  }
  entry.seasons += 1;
  entry.matches += seasonData.matches;
  entry.goals += seasonData.goals;
  entry.cleanSheets += seasonData.cleanSheets;
  if (wonFinal) entry.titles += 1;
  entry.maxIdolatry = Math.max(entry.maxIdolatry, next.idolatry);

  // Retirement
  if (next.age >= RETIREMENT_AGE || (next.gameMode === 'ultra' && next.seasonsPlayed >= 2)) {
    next.isRetired = true;
  }

  next.bonusFinal = 0;
  next.seasonBoosts = { finalBonus: false, specialConcentration: false, recoveryPhysio: false, secondCard: false };
  next.trainingRewardsLeft = TRAINING_REWARDS_PER_SEASON;

  // Keep salary realistic after a promotion
  if (promotedToPrimera) {
    next.salary = Math.max(next.salary || 0, computeSalary(next.currentClub, overall));
  }

  next.seasonHistory = [...(prev.seasonHistory || []), {
    seasonNumber: next.seasonsPlayed,
    year,
    age: next.age,
    clubName: next.currentClub.name,
    ovr: overall,
    matches: seasonData.matches,
    goals: seasonData.goals,
    cleanSheets: seasonData.cleanSheets,
    trophiesCount: next.trophies.length,
    wonTitle: wonFinal || wonNationalFinal,
  }];

  const recap = {
    ...seasonData,
    year,
    passiveIncome,
    titleBonus,
    coinsEarned,
    idolatryGain,
    statChanges: changes,
    wonFinal,
    tournamentName,
    wonNationalFinal,
    nationalTournamentName,
    promotedToPrimera,
    newAwards: next.awards.slice((prev.awards || []).length),
  };

  // Consequences of the key matches (derby, cup night, national team)
  let withKeys = next;
  (seasonData.keyMatches || []).forEach(r => {
    withKeys = applyEffects(withKeys, r.won ? r.stakes?.win : r.stakes?.lose);
  });
  withKeys.seasonInProgress = null;
  withKeys.clasicosWon = (prev.clasicosWon || 0) + (seasonData.keyMatches || []).filter(r => r.kind === 'clasico' && r.won).length;
  recap.idolatryAfterKeys = withKeys.idolatry;

  const checked = withStatueCheck(withKeys);
  recap.earnedStatue = checked.hasStatue && !prev.hasStatue;
  checked.lastRecap = recap;
  return { next: checked, recap };
}
