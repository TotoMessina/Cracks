// Shared helpers to apply card / dilemma / store effects to a player
// Always returns a NEW player object (never mutates the input).

export const EFFECT_LABELS = {
  definicion: 'Definición',
  potencia: 'Potencia',
  gambeta: 'Gambeta',
  resistencia: 'Resistencia',
  pegada: 'Pegada',
  liderazgo: 'Liderazgo',
  reflejos: 'Reflejos',
  agilidad: 'Agilidad',
  salida: 'Salida',
  mando: 'Mando',
  idolatria: 'Idolatría',
  idolatry: 'Idolatría',
  fama: 'Fama',
  fame: 'Fama',
  dinero: 'Dinero',
  money: 'Dinero',
  forma: 'Forma',
  form: 'Forma',
  bonusFinal: 'Bonus en finales',
  dt: 'Relación con el DT',
  managerRelationship: 'Relación con el DT',
  vestuario: 'Vestuario',
  lockerRoomChemistry: 'Vestuario',
  energia: 'Energía',
  energy: 'Energía',
};

const STAT_KEYS = ['definicion', 'potencia', 'gambeta', 'resistencia', 'pegada', 'liderazgo', 'reflejos', 'agilidad', 'salida', 'mando'];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const STATUE_IDOLATRY = 95;
export const STATUE_MIN_SEASONS = 5;

/** Idolatry is easy to win early and very hard to max out (diminishing returns). */
export function addIdolatry(current, v) {
  const base = current || 0;
  if (v <= 0) return clamp(base + v, 0, 100);
  const factor = Math.max(0.15, 1 - base / 105);
  return clamp(Math.round(base + Math.max(1, v * factor)), 0, 100);
}

export function seasonsAtCurrentClub(p) {
  return p?.clubHistory?.find(h => h.clubId === p.currentClub?.id)?.seasons || 0;
}

/** The statue needs love (95 idolatry) AND history (5 seasons at the club). */
export function withStatueCheck(p) {
  if (p.hasStatue || (p.idolatry || 0) < STATUE_IDOLATRY || seasonsAtCurrentClub(p) < STATUE_MIN_SEASONS) return p;
  return { ...p, hasStatue: true, statueClubId: p.currentClub.id, statueClubName: p.currentClub.name };
}

/**
 * Where does an effect land for this player?
 * Stats the player doesn't have are converted when it makes sense
 * (liderazgo -> vestuario) or marked as "no aplica".
 */
export function resolveEffectKey(player, key) {
  if (STAT_KEYS.includes(key)) {
    if (player?.stats && player.stats[key] !== undefined) return key;
    if (key === 'liderazgo') return 'vestuario';
    return null; // not applicable to this position
  }
  const aliases = {
    idolatry: 'idolatria', fame: 'fama', money: 'dinero', form: 'forma',
    managerRelationship: 'dt', lockerRoomChemistry: 'vestuario', energy: 'energia',
  };
  return aliases[key] || key;
}

export function formatEffectValue(key, value) {
  const sign = value > 0 ? '+' : '';
  if (key === 'dinero' || key === 'money') {
    return `${value < 0 ? '-' : '+'}$${Math.abs(value).toLocaleString('es-AR')}`;
  }
  if (key === 'bonusFinal') return `${sign}${value}%`;
  return `${sign}${value}`;
}

/** Returns [{ key, label, value, text, applies, positive }] for display */
export function describeEffects(player, effects = {}) {
  return Object.entries(effects)
    .filter(([, v]) => v !== 0)
    .map(([key, value]) => {
      const target = resolveEffectKey(player, key);
      const converted = target && target !== key && STAT_KEYS.includes(key);
      return {
        key,
        label: converted ? `${EFFECT_LABELS[target]} (por ${EFFECT_LABELS[key]})` : (EFFECT_LABELS[key] || key),
        value,
        text: formatEffectValue(key, value),
        applies: Boolean(target),
        positive: value > 0,
      };
    });
}

export function applyEffects(player, effects = {}) {
  const next = { ...player, stats: { ...player.stats } };
  Object.entries(effects).forEach(([rawKey, v]) => {
    const key = resolveEffectKey(next, rawKey);
    if (!key) return;
    if (next.stats[key] !== undefined) {
      next.stats[key] = clamp(next.stats[key] + v, 40, 99);
      return;
    }
    switch (key) {
      case 'idolatria':
        next.idolatry = addIdolatry(next.idolatry, v);
        break;
      case 'fama':
        next.fame = clamp((next.fame || 0) + v, 0, 100);
        break;
      case 'dinero':
        next.money = Math.max(0, (next.money || 0) + v);
        break;
      case 'forma':
        next.form = clamp((next.form || 0) + v, -2, 2);
        break;
      case 'bonusFinal':
        next.bonusFinal = clamp((next.bonusFinal || 0) + v, 0, 40);
        break;
      case 'dt':
        next.managerRelationship = clamp((next.managerRelationship ?? 65) + v, 0, 100);
        break;
      case 'vestuario':
        next.lockerRoomChemistry = clamp((next.lockerRoomChemistry ?? 70) + v, 0, 100);
        break;
      case 'energia':
        next.energy = clamp((next.energy ?? 100) + v, 0, 100);
        break;
      default:
        break;
    }
  });
  return withStatueCheck(next);
}
