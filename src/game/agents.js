// Agents and contract clauses: who negotiates for you and what you sign.
// The agents are fictional characters.

export const AGENTS = {
  amigo: {
    id: 'amigo',
    name: 'El Tano, tu amigo del barrio',
    short: 'Amigo del barrio',
    icon: '🧢',
    commission: 0.05,
    desc: 'Cobra poco (5%) y es fiel. No tiene contactos afuera: te cuesta llegar a Europa y a las ligas ricas.',
    leverage: 0,
    abroadLevel: 80, // level needed for offers from another continent
    richLevel: 84, // level needed for the richest leagues
    extraOffers: 0,
    reach: -2, // how much bigger than you the clubs he can bring are
    forceExit: 0,
    drama: 0,
  },
  agencia: {
    id: 'agencia',
    name: 'Grupo Pase Gol (agencia)',
    short: 'Agencia profesional',
    icon: '💼',
    commission: 0.10,
    desc: 'Comisión del 10%. Te mueve bien en todo el mundo, sin escándalos.',
    leverage: 0.08,
    abroadLevel: 74,
    richLevel: 78,
    extraOffers: 0,
    reach: 0,
    forceExit: 0,
    drama: 0,
  },
  super: {
    id: 'super',
    name: 'Don Ezequiel Varela, superagente',
    short: 'Superagente',
    icon: '🦈',
    commission: 0.18,
    desc: 'Cobra el 18%, pero te mete en los clubes más grandes y negocia como nadie. Te presiona para forzar salidas y vive en los diarios.',
    leverage: 0.2,
    abroadLevel: 70,
    richLevel: 74,
    extraOffers: 1,
    reach: 4,
    forceExit: 0.4, // chance per off-season of forcing a club to pay your clause
    drama: 0.25, // chance per season of a media mess
  },
};

export const DEFAULT_AGENT = 'amigo';

export function getAgent(player) {
  return AGENTS[player?.agent] || AGENTS[DEFAULT_AGENT];
}

/** Changing agent: once per season, and only between seasons. */
export function canChangeAgent(player) {
  return !player.seasonInProgress?.results?.length && player.agentChangedSeason !== player.seasonsPlayed;
}

/** What the agent keeps from what you earn. */
export function agentFee(player, amount) {
  return Math.round((amount || 0) * getAgent(player).commission);
}

// ---------------------------------------------------------------------------
// Contract clauses
// ---------------------------------------------------------------------------
export const CLAUSE_OPTIONS = {
  release: {
    label: 'Cláusula de rescisión',
    options: {
      baja: { label: 'Baja', salary: -0.08, clauseMult: 0.6, buyerMult: 1.6, desc: 'Te podés ir fácil si te va bien. El club te paga 8% menos.' },
      normal: { label: 'Normal', salary: 0, clauseMult: 1, buyerMult: 1, desc: 'Lo habitual.' },
      alta: { label: 'Alta', salary: 0.05, clauseMult: 1.7, buyerMult: 0.5, desc: 'Al club le encanta: +5% de sueldo, pero casi nadie te va a poder sacar.' },
    },
  },
  bonus: {
    label: 'Primas',
    options: {
      fijo: { label: 'Sueldo fijo', salary: 0, perStat: 0, cupBonus: 0, desc: 'Cobrás lo mismo pase lo que pase.' },
      primas: { label: 'Con primas', salary: -0.12, perStat: 0.012, cupBonus: 0.15, desc: '−12% de sueldo, pero cobrás una prima por gol / asistencia / valla invicta y un bonus si el club clasifica a una copa internacional.' },
    },
  },
  resale: {
    label: '% de tu próximo pase',
    options: {
      no: { label: 'No', salary: 0, pct: 0, desc: 'Si te venden, la plata es toda del club.' },
      diez: { label: '10%', salary: -0.05, pct: 0.10, desc: '−5% de sueldo, pero si un club paga tu cláusula te llevás el 10%.' },
    },
  },
};

export const DEFAULT_TERMS = { release: 'normal', bonus: 'fijo', resale: 'no' };

/** Salary after the clauses you asked for. */
export function salaryWithTerms(salary, terms = DEFAULT_TERMS) {
  const t = { ...DEFAULT_TERMS, ...terms };
  const adj = CLAUSE_OPTIONS.release.options[t.release].salary
    + CLAUSE_OPTIONS.bonus.options[t.bonus].salary
    + CLAUSE_OPTIONS.resale.options[t.resale].salary;
  return Math.round((salary * (1 + adj)) / 1000) * 1000;
}

/** How much more likely a club is to pay your release clause. */
export function clauseBuyerMult(contract) {
  return CLAUSE_OPTIONS.release.options[contract?.terms?.release || 'normal']?.buyerMult ?? 1;
}

const STAT_FOR_BONUS = { delantero: 'goals', enganche: 'assists', arquero: 'cleanSheets' };

/**
 * Bonuses earned this season under the contract's clauses.
 * Returns { perStat, cup, total, count, stat }.
 */
export function contractPayouts(player, seasonData, { qualified = false } = {}) {
  const contract = player.contract;
  const bonus = CLAUSE_OPTIONS.bonus.options[contract?.terms?.bonus || 'fijo'];
  if (!contract || !bonus || !bonus.perStat) return { perStat: 0, cup: 0, total: 0, count: 0, stat: null };
  const stat = STAT_FOR_BONUS[player.position] || 'goals';
  const count = seasonData[stat] || 0;
  const perStat = Math.round(contract.salary * bonus.perStat * count);
  const cup = qualified ? Math.round(contract.salary * bonus.cupBonus) : 0;
  return { perStat, cup, total: perStat + cup, count, stat };
}

/** Your share when a club pays your release clause. */
export function resaleShare(contract) {
  const pct = CLAUSE_OPTIONS.resale.options[contract?.terms?.resale || 'no']?.pct || 0;
  return Math.round((contract?.releaseClause || 0) * pct);
}
