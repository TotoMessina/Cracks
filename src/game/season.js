// Pure season wrap-up logic: takes the previous player and returns a brand-new one.
// Never mutates its inputs (safe under React StrictMode double-invocation).
import {
  START_YEAR,
  RETIREMENT_AGE,
  TRAINING_REWARDS_PER_SEASON,
  getPlayerOverall,
  getDifficulty,
  updateNationalCareer,
  applySeasonDevelopment,
  computeSalary,
} from './career';
import { getLeague } from '../data/clubs';
import { addIdolatry, withStatueCheck, applyEffects } from './effects';
import { addMoment } from './moments';
import { TITLE_WEIGHT, computeQualification } from './competitions';

const PASSIVE_INCOME_DEPT = 35000;

const KIND_ICON = { continental: '⭐', league: '🏆', cup: '🥇', promotion: '🎖️' };

/** Old call style ({ wonFinal, tournamentName }) -> list of club finals. */
function legacyClubFinals(prev, tournamentName, wonFinal) {
  if (!tournamentName) return [];
  const league = getLeague(prev.currentClub.league);
  let kind = 'cup';
  if (tournamentName === league.promotionFinal) kind = 'promotion';
  else if (/Libertadores|Sudamericana|Champions|Europa League|Conference|Concacaf|AFC/.test(tournamentName)) kind = 'continental';
  else if (tournamentName === league.short) kind = 'league';
  const weight = kind === 'continental' ? TITLE_WEIGHT.continental_main : TITLE_WEIGHT[kind];
  return [{ stage: 'club', kind, tournament: tournamentName, won: wonFinal, weight }];
}

export function finalizeSeasonState(prev, seasonData, {
  finals = null, // [{ stage: 'club'|'national', kind, tournament, won, weight, opponent }]
  wonFinal: legacyWonFinal = false,
  tournamentName: legacyTournament = null,
  wonNationalFinal: legacyWonNational = false,
  nationalTournamentName: legacyNational = null,
} = {}) {
  const year = START_YEAR + prev.seasonsPlayed;
  const clubLeague = getLeague(prev.currentClub.league);
  const comps = seasonData.competitions || null;

  // ---- What was won this season ----
  const clubFinals = finals ? finals.filter(f => f.stage !== 'national') : legacyClubFinals(prev, legacyTournament, legacyWonFinal);
  const ntFinal = finals
    ? finals.find(f => f.stage === 'national') || null
    : (legacyNational ? { tournament: legacyNational, won: legacyWonNational } : null);
  const titles = clubFinals.filter(f => f.won).map(f => ({ title: f.tournament, kind: f.kind, weight: f.weight || 15, viaFinal: true }));
  if (comps?.league?.champion) titles.push({ title: comps.league.name, kind: 'league', weight: TITLE_WEIGHT.league, viaFinal: false });
  if (comps?.league?.directPromotion) titles.push({ title: `Ascenso: campeón de ${clubLeague.short}`, kind: 'promotion', weight: TITLE_WEIGHT.promotion, viaFinal: false });
  const wonFinal = titles.length > 0;
  const tournamentName = titles[0]?.title || legacyTournament || null;
  const wonNationalFinal = Boolean(ntFinal?.won);
  const nationalTournamentName = ntFinal?.tournament || null;
  const titleWeight = titles.reduce((sum, t) => sum + t.weight, 0);
  const promotedToPrimera = Boolean(clubLeague.secondTier && clubLeague.promotesTo && titles.some(t => t.kind === 'promotion'));
  const wonCup = titles.some(t => t.kind === 'cup');
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
  // Prize money grows with the importance of the titles won
  const titleBonus = Math.round(seasonData.earnings * Math.min(0.6, titleWeight / 100)) + (wonNationalFinal ? 150000 : 0);
  next.money = (prev.money || 0) + seasonData.earnings + passiveIncome + titleBonus;

  // Coins: base + performance
  let coinsEarned = 5;
  coinsEarned += Math.min(10, Math.round(titleWeight / 8));
  if (wonNationalFinal) coinsEarned += 4;
  if (seasonData.leagueStanding?.position === 1) coinsEarned += 2;
  next.coins = (prev.coins || 0) + coinsEarned;

  // Idolatry
  // A forgettable season makes the fans' memory fade a little
  let idolatryGain = 3;
  idolatryGain += Math.round(titleWeight * 0.45); // Libertadores/Champions > league > cup > Conference
  if (wonNationalFinal) idolatryGain += 6;
  if (seasonData.goals > 20 || seasonData.cleanSheets > 14 || seasonData.assists > 16) idolatryGain += 6;
  if (seasonData.matches < 20) idolatryGain -= 4;
  if (!wonFinal && !wonNationalFinal && (seasonData.leagueStanding?.position || 99) > 3) idolatryGain -= 4;

  if (promotedToPrimera) {
    idolatryGain += 6;
    next.currentClub = {
      ...next.currentClub,
      league: clubLeague.promotesTo,
      reputation: Math.min(82, (next.currentClub.reputation || 65) + 5),
    };
  }

  // Difficulty: how fast the fans fall in love with you
  if (idolatryGain > 0) idolatryGain = Math.round(idolatryGain * getDifficulty(prev).idolatryMult);
  next.idolatry = addIdolatry(prev.idolatry, idolatryGain);
  idolatryGain = next.idolatry - (prev.idolatry || 0);

  // Club trophies (each with its weight for the glory score)
  titles.forEach(t => {
    next.trophies.push({ title: t.title, year, clubName: prev.currentClub.name, icon: KIND_ICON[t.kind] || '🥇', kind: t.kind, weight: t.weight });
  });

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
  const finalWon = titles.find(t => t.viaFinal);
  if (finalWon && Math.random() < 0.75) {
    next.awards.push({ name: `Figura de la Final (${finalWon.title})`, year, description: 'Determinante en la noche más importante.', icon: '🎖️' });
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
  entry.titles += titles.length;
  entry.maxIdolatry = Math.max(entry.maxIdolatry, next.idolatry);

  // Retirement
  if (next.age >= RETIREMENT_AGE || (next.gameMode === 'ultra' && next.seasonsPlayed >= 2)) {
    next.isRetired = true;
  }

  next.bonusFinal = 0;
  next.nextSeasonMods = null; // last off-season's consequences are now served
  next.seasonBoosts = { finalBonus: false, specialConcentration: false, recoveryPhysio: false, secondCard: false };
  next.trainingRewardsLeft = TRAINING_REWARDS_PER_SEASON;

  // Keep salary realistic after a promotion (promotion bonus in the contract)
  if (promotedToPrimera) {
    next.salary = Math.max(next.salary || 0, computeSalary(next.currentClub, overall));
  }

  // One more year of the contract is gone
  if (prev.contract) {
    next.contract = {
      ...prev.contract,
      salary: next.salary || prev.contract.salary,
      yearsLeft: Math.max(0, (prev.contract.yearsLeft ?? 1) - 1),
    };
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
    titles,
    finalsPlayed: clubFinals,
    contractYearsLeft: next.contract?.yearsLeft ?? 0,
    servedMods: prev.nextSeasonMods?.labels || [],
    newAwards: next.awards.slice((prev.awards || []).length),
  };

  // The table reflects the last-match-day decider (the winner overtakes / keeps the lead)
  const decider = clubFinals.find(f => f.kind === 'league');
  const st = seasonData.leagueStanding;
  if (decider && st?.miniTable?.length >= 2 && st.position <= 2) {
    const newPos = decider.won ? 1 : 2;
    if (newPos !== st.position) {
      const rows = st.miniTable.map(r => ({ ...r }));
      const me = rows.find(r => r.isPlayerTeam);
      const other = rows.find(r => r.pos === newPos && !r.isPlayerTeam);
      if (me && other) {
        const winner = decider.won ? me : other;
        const loser = decider.won ? other : me;
        winner.points = Math.max(winner.points, loser.points) + 1;
        [me.pos, other.pos] = [other.pos, me.pos];
        rows.sort((x, y) => x.pos - y.pos);
        recap.leagueStanding = { ...st, position: newPos, points: me.points, miniTable: rows };
      }
    }
  }

  // Consequences of the key matches (derby, cup night, national team)
  let withKeys = next;
  (seasonData.keyMatches || []).forEach(r => {
    withKeys = applyEffects(withKeys, r.won ? r.stakes?.win : r.stakes?.lose);
  });
  withKeys.seasonInProgress = null;
  withKeys.clasicosWon = (prev.clasicosWon || 0) + (seasonData.keyMatches || []).filter(r => r.kind === 'clasico' && r.won).length;
  recap.idolatryAfterKeys = withKeys.idolatry;

  // National team career (status, shirt, punishment for skipping a tournament)
  const ntUpdate = updateNationalCareer(withKeys, {
    played: Boolean(seasonData.nationalTeam),
    declined: prev.seasonInProgress?.ntDecision === 'decline',
    overall,
  });
  withKeys.nationalTeam = ntUpdate.nationalTeam;
  if (withKeys.flags?.nationalShirt10 && seasonData.nationalTeam) withKeys.flags = { ...withKeys.flags, nationalShirt10: false };
  recap.ntMessages = ntUpdate.messages;

  let checked = withStatueCheck(withKeys);
  recap.earnedStatue = checked.hasStatue && !prev.hasStatue;

  // ---- Career highlights of this season ----
  const at = { year, age: next.age };
  const clubName = checked.currentClub.name;
  (ntUpdate.messages || []).forEach(msg => {
    if (/Debutaste/.test(msg)) checked = addMoment(checked, { ...at, type: 'nt_debut', icon: '🎽', text: msg });
    if (/capitán/.test(msg)) checked = addMoment(checked, { ...at, type: 'captain', icon: '©️', text: msg.replace('¡', '').replace('!', '') });
  });
  const clubAtTitle = prev.currentClub.name;
  titles.forEach(t => {
    const type = t.kind === 'continental' ? 'continental' : t.kind === 'promotion' ? 'promotion' : 'title';
    if (t.kind === 'promotion') return; // promotion has its own moment below
    checked = addMoment(checked, { ...at, type, icon: KIND_ICON[t.kind] || '🏆', text: `Campeón de ${t.title} con ${clubAtTitle}` });
  });
  clubFinals.filter(f => !f.won).forEach(f => {
    checked = addMoment(checked, { ...at, type: 'final_lost', icon: '🥈', text: f.kind === 'league' ? `Se te escapó ${f.tournament} en la última fecha` : `Perdiste la final de ${f.tournament}${f.opponent ? ` ante ${f.opponent}` : ''}` });
  });
  if (nationalTournamentName && seasonData.nationalTeam) {
    const isWc = nationalTournamentName.includes('Mundo');
    checked = wonNationalFinal
      ? addMoment(checked, { ...at, type: isWc ? 'world_cup' : 'national_title', icon: isWc ? '🌍' : '🏆', text: `¡Campeón de ${nationalTournamentName} con ${seasonData.nationalTeam.nationalTeamName}!` })
      : addMoment(checked, { ...at, type: 'final_lost', icon: '🥈', text: `Subcampeón de ${nationalTournamentName} con la Selección` });
  }
  if (promotedToPrimera) checked = addMoment(checked, { ...at, type: 'promotion', icon: '🎖️', text: `Ascenso histórico con ${clubName}` });
  if (recap.earnedStatue) checked = addMoment(checked, { ...at, type: 'statue', icon: '🗽', text: `Inauguraron tu estatua en ${clubName}` });
  recap.newAwards.forEach(a => {
    if (/Balón de Oro/.test(a.name)) checked = addMoment(checked, { ...at, type: 'ballon', icon: '🌕', text: `Ganaste el ${a.name}` });
    else if (/Botín de Oro|Guante de Oro|Rey de las Asistencias/.test(a.name)) checked = addMoment(checked, { ...at, type: 'award', icon: a.icon, text: `${a.name}: ${a.description}` });
  });
  const isGkPos = prev.position === 'arquero';
  if ((!isGkPos && seasonData.goals >= 30) || (isGkPos && seasonData.cleanSheets >= 20) || seasonData.assists >= 22) {
    const what = isGkPos ? `${seasonData.cleanSheets} vallas invictas` : seasonData.goals >= 30 ? `${seasonData.goals} goles` : `${seasonData.assists} asistencias`;
    checked = addMoment(checked, { ...at, type: 'record', icon: '🔥', text: `Temporada récord en ${clubName}: ${what}` });
  }
  (seasonData.keyMatches || []).filter(k => k.kind === 'clasico' && k.won).slice(0, 1).forEach(k => {
    if ((checked.clasicosWon || 0) === 1 || (checked.clasicosWon || 0) % 5 === 0) {
      checked = addMoment(checked, { ...at, type: 'clasico', icon: '🔥', text: `${k.title}: ganado (${checked.clasicosWon} en tu carrera)` });
    }
  });

  if (checked.isRetired) {
    checked = addMoment(checked, { ...at, type: 'retire', icon: '👋', text: `Colgaste los botines a los ${checked.age} años en ${clubName}` });
  }

  // Next season's international competition (table position or winning the cup)
  const leaguePosition = clubLeague.secondTier ? null : (comps?.league?.decider
    ? (titles.some(t => t.kind === 'league') ? 1 : 2)
    : seasonData.leagueStanding?.position);
  checked.qualifiedFor = computeQualification(prev.currentClub, leaguePosition, wonCup);
  recap.qualifiedFor = checked.qualifiedFor;

  checked.lastRecap = recap;
  return { next: checked, recap };
}
