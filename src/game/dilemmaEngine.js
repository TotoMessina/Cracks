// Resolves a dilemma option into real, lasting consequences.
// Option fields (all optional besides text/outcome/effects):
//   actions: [
//     { type: 'transfer', league, salaryMult, years, label }      -> you change club right now
//     { type: 'nextSeason', injuryRisk, suspension, forceCallUp, matchesFactor, label } -> affects next season
//     { type: 'flag', key, value, label }                          -> remembered for later (market, transfers...)
//     { type: 'followUp', dilemmaId, delay, label }                -> a new dilemma N seasons later
//     { type: 'gamble', chance, win: { effects, outcome }, lose: { effects, outcome } }
//     { type: 'salaryRaise', pct, label }                          -> raises your current contract
//     { type: 'resetManager', value, label }                       -> new coach, relationship starts over
//   ]
import { CLUBS, getLeague } from '../data/clubs';
import { applyEffects, describeEffects } from './effects';
import { computeSalary, getPlayerOverall, makeContract } from './career';
import { addMoment } from './moments';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Human-readable preview of what an option will do beyond its stat effects. */
export function describeActions(option) {
  return (option.actions || []).map(a => {
    if (a.type === 'gamble') return `🎲 Apuesta: ${Math.round(a.chance * 100)}% de que salga bien`;
    return a.label;
  }).filter(Boolean);
}

function transferTo(player, action) {
  const overall = getPlayerOverall(player);
  const pool = CLUBS.filter(c => c.league === action.league && c.id !== player.currentClub.id);
  if (!pool.length) return { player, club: null };
  // Clubs close to your level, otherwise any club of that league
  const near = pool.filter(c => Math.abs(c.reputation - overall) <= 8);
  const club = pick(near.length ? near : pool);
  const salary = Math.round(computeSalary(club, overall) * (action.salaryMult || 1));
  const next = {
    ...player,
    currentClub: club,
    idolatry: 10,
    salary,
    contract: makeContract(salary, action.years || 3),
    managerRelationship: 65,
    lockerRoomChemistry: 60,
    clubHistory: player.clubHistory.some(h => h.clubId === club.id)
      ? player.clubHistory
      : [...player.clubHistory, {
        clubId: club.id, clubName: club.name, seasons: 0, goals: 0, matches: 0,
        cleanSheets: 0, titles: 0, maxIdolatry: 10, leftAsRival: false,
      }],
  };
  return { player: next, club };
}

export function resolveDilemmaOption(player, dilemma, option) {
  let next = applyEffects(player, option.effects || {});
  let outcome = option.outcome;
  const appliedEffects = [...describeEffects(player, option.effects || {}).filter(e => e.applies)];
  const consequences = [];
  let transferred = null;

  (option.actions || []).forEach(action => {
    switch (action.type) {
      case 'gamble': {
        const won = Math.random() < action.chance;
        const branch = won ? action.win : action.lose;
        next = applyEffects(next, branch.effects || {});
        appliedEffects.push(...describeEffects(player, branch.effects || {}).filter(e => e.applies));
        outcome = branch.outcome;
        consequences.push(won ? '🎲 La apuesta salió bien.' : '🎲 La apuesta salió mal.');
        break;
      }
      case 'transfer': {
        const res = transferTo(next, action);
        if (res.club) {
          next = addMoment(res.player, { type: 'transfer', icon: '✈️', text: `${dilemma.title}: te fuiste a ${res.club.name}` });
          transferred = res.club;
          consequences.push(`✈️ Firmaste con ${res.club.name} (${getLeague(res.club.league).short}) por ${action.years || 3} años a $${next.salary.toLocaleString('es-AR')} por año.`);
        }
        break;
      }
      case 'nextSeason': {
        const prev = next.nextSeasonMods || { injuryRisk: 0, suspension: 0, forceCallUp: false, matchesFactor: 1, labels: [] };
        next = {
          ...next,
          nextSeasonMods: {
            injuryRisk: prev.injuryRisk + (action.injuryRisk || 0),
            suspension: prev.suspension + (action.suspension || 0),
            forceCallUp: prev.forceCallUp || Boolean(action.forceCallUp),
            matchesFactor: prev.matchesFactor * (action.matchesFactor || 1),
            labels: [...prev.labels, action.label].filter(Boolean),
          },
        };
        if (action.label) consequences.push(`📅 Próxima temporada: ${action.label}`);
        break;
      }
      case 'flag': {
        const value = action.value === 'currentClub' ? next.currentClub.id : (action.value ?? true);
        next = { ...next, flags: { ...(next.flags || {}), [action.key]: value } };
        if (action.label) consequences.push(`🔖 ${action.label}`);
        break;
      }
      case 'followUp': {
        const due = (next.seasonsPlayed || 0) + (action.delay || 1);
        next = {
          ...next,
          scheduledDilemmas: [...(next.scheduledDilemmas || []).filter(s => s.id !== action.dilemmaId), { id: action.dilemmaId, dueSeason: due }],
        };
        if (action.label) consequences.push(`⏳ ${action.label}`);
        break;
      }
      case 'salaryRaise': {
        const raised = Math.round((next.salary || 0) * (1 + action.pct));
        next = { ...next, salary: raised, contract: next.contract ? { ...next.contract, salary: raised } : next.contract };
        consequences.push(action.label || `💰 Tu sueldo sube a $${raised.toLocaleString('es-AR')}.`);
        break;
      }
      case 'resetManager': {
        next = { ...next, managerRelationship: action.value ?? 60 };
        if (action.label) consequences.push(`🧑‍💼 ${action.label}`);
        break;
      }
      default:
        break;
    }
  });

  return {
    next,
    result: {
      dilemmaId: dilemma.id,
      isFollowUp: Boolean(dilemma.followUpOnly),
      title: dilemma.title,
      choice: option.text,
      outcome,
      effects: appliedEffects,
      consequences,
      transferredTo: transferred ? { id: transferred.id, name: transferred.name } : null,
    },
  };
}

