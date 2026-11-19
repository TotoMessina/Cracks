// Centralized persistence & storage helpers for El Ídolo
import { getCountryById } from '../data/clubs';
import { challengeGlory, modifiersGloryMult } from '../game/challenges';

const GLORY_MULT = { facil: 0.8, normal: 1, leyenda: 1.3 };

/** Glory score of a career (same formula for the retirement screen and the Hall of Fame). */
export function computeGlory(player) {
  const isGk = player.position === 'arquero';
  const trophies = player.trophies?.length || 0;
  // Each trophy counts by importance (Champions/Libertadores 30, league 25, cup 15, Conference 12...); old saves: 20
  const titlePoints = (player.trophies || []).reduce((sum, t) => sum + (t.weight ?? 20), 0);
  const statPoints = isGk ? (player.totalCleanSheets || 0) * 2 : Math.round((player.totalGoals || 0) * 1.2);
  const awardPoints = (player.awards?.length || 0) * 25;
  const statuePoints = player.hasStatue ? 100 : 0;
  const challengePoints = challengeGlory(player);
  const famePoints = (player.fame || 0) * 3;
  const base = titlePoints + statPoints + awardPoints + statuePoints + famePoints + challengePoints;
  const mult = (GLORY_MULT[player.difficulty] ?? 1) * modifiersGloryMult(player);
  const total = Math.round(base * mult);

  let tier = 0;
  if (total >= 800 || (player.hasStatue && trophies >= 6)) tier = 4;
  else if (total >= 500 || player.hasStatue) tier = 3;
  else if (total >= 300) tier = 2;
  else if (total >= 180) tier = 1;
  return { base, mult, total, tier };
}

export const HONORARY_TITLES = [
  'Trotamundos del Fútbol',
  'Campeón Continental Destacado',
  'Ídolo Eterno de la Hinchada',
  'Estatua de Bronce en la Historia',
  'Deidad Inmortal del Fútbol Mundial',
];

// --- 1. SAVE SLOTS ---
export function getSlotData(slotNumber) {
  try {
    const raw = localStorage.getItem(`el_idolo_slot_${slotNumber}`);
    if (raw) return JSON.parse(raw);
    // Backward compatibility: If slot 1 is empty, check legacy save
    if (slotNumber === 1) {
      const legacy = localStorage.getItem('el_idolo_career_save_v1');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        localStorage.setItem('el_idolo_slot_1', legacy);
        return parsed;
      }
    }
  } catch {}
  return null;
}

export function saveSlotData(slotNumber, playerData) {
  try {
    if (!playerData) {
      localStorage.removeItem(`el_idolo_slot_${slotNumber}`);
    } else {
      const dataToSave = {
        ...playerData,
        savedAt: new Date().toLocaleString('es-AR')
      };
      localStorage.setItem(`el_idolo_slot_${slotNumber}`, JSON.stringify(dataToSave));
      if (slotNumber === 1) {
        localStorage.setItem('el_idolo_career_save_v1', JSON.stringify(dataToSave));
      }
    }
  } catch {}
}

export function getActiveSlotNumber() {
  try {
    const active = localStorage.getItem('el_idolo_active_slot');
    if (active && ['1', '2', '3'].includes(active)) {
      return parseInt(active, 10);
    }
  } catch {}
  return 1;
}

export function setActiveSlotNumber(slotNumber) {
  try {
    localStorage.setItem('el_idolo_active_slot', String(slotNumber));
  } catch {}
}


// --- 2. HALL OF FAME ---
export function getHallOfFameLegends() {
  try {
    const raw = localStorage.getItem('el_idolo_hall_of_fame_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveLegendToHallOfFame(player) {
  if (!player) return null;
  const glory = computeGlory(player);
  const totalGloryScore = glory.total;
  const honoraryTitle = HONORARY_TITLES[glory.tier];

  const legend = {
    id: player.id || `legend_${Date.now()}`,
    name: player.name,
    position: player.position,
    playstyle: player.playstyle,
    archetype: player.archetype,
    nationality: getCountryById(player.country).name,
    finalClub: player.currentClub?.name || 'Club',
    seasonsPlayed: player.seasonsPlayed || 0,
    age: player.age || 38,
    trophiesCount: player.trophies?.length || 0,
    trophies: (player.trophies || []).map(t => t.title),
    totalGoals: player.totalGoals || 0,
    totalCleanSheets: player.totalCleanSheets || 0,
    totalMatches: player.totalMatches || 0,
    awardsCount: player.awards?.length || 0,
    hasStatue: Boolean(player.hasStatue),
    money: player.money || 0,
    totalGloryScore,
    difficulty: player.difficulty || 'normal',
    honoraryTitle,
    retiredAt: new Date().toLocaleDateString('es-AR')
  };

  const current = getHallOfFameLegends();
  const exists = current.some(
    l => l.id === legend.id || (l.name === legend.name && l.seasonsPlayed === legend.seasonsPlayed && l.totalGloryScore === legend.totalGloryScore)
  );
  if (!exists) {
    current.push(legend);
    current.sort((a, b) => b.totalGloryScore - a.totalGloryScore);
    try {
      localStorage.setItem('el_idolo_hall_of_fame_v1', JSON.stringify(current));
    } catch {}
  }
  return legend;
}


// --- 3. MANAGER MODE ---
export function getManagerCareer() {
  try {
    const raw = localStorage.getItem('el_idolo_manager_career_v1');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveManagerCareer(data) {
  try {
    localStorage.setItem('el_idolo_manager_career_v1', JSON.stringify(data));
  } catch {}
}
