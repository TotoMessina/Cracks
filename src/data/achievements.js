// Global Achievements System for El Ídolo
// Stored persistently in localStorage across careers

export const ACHIEVEMENTS = [
  // 1. Goles e Hitos en Cancha
  {
    id: "primer_gol",
    title: "Bautismo Sagrado",
    desc: "Marcar tu primer gol oficial en primera división o ascenso.",
    category: "cancha",
    icon: "⚽",
    check: (p) => (p.totalGoals || 0) >= 1
  },
  {
    id: "cien_goles",
    title: "El Club de los 100",
    desc: "Alcanzar 100 goles oficiales a lo largo de tu trayectoria.",
    category: "cancha",
    icon: "🎯",
    check: (p) => (p.totalGoals || 0) >= 100
  },
  {
    id: "doscientos_goles",
    title: "Artillero de Época",
    desc: "Alcanzar 200 goles oficiales en tu carrera profesional.",
    category: "cancha",
    icon: "🔥",
    check: (p) => (p.totalGoals || 0) >= 200
  },
  {
    id: "muro_arco",
    title: "Cerrojo Inquebrantable",
    desc: "Completar 40 partidos con la valla invicta como arquero.",
    category: "cancha",
    icon: "🧤",
    check: (p) => p.position === 'arquero' && (p.totalCleanSheets || 0) >= 40
  },

  // 2. Títulos y Campeonatos
  {
    id: "primera_copa",
    title: "La Primera Vuelta Olímpica",
    desc: "Consagrarte campeón y levantar tu primer trofeo oficial.",
    category: "titulos",
    icon: "🥇",
    check: (p) => (p.trophies || []).length >= 1
  },
  {
    id: "cinco_titulos",
    title: "Coleccionista de Copas",
    desc: "Acumular 5 o más títulos oficiales en tu vitrina de trofeos.",
    category: "titulos",
    icon: "🏆",
    check: (p) => (p.trophies || []).length >= 5
  },
  {
    id: "gloria_continental",
    title: "Rey del Continente",
    desc: "Ganar la Libertadores, la Champions u otra copa continental.",
    category: "titulos",
    icon: "⭐",
    check: (p) => (p.trophies || []).some(t => /Libertadores|Champions|Concacaf|AFC/.test(t.title))
  },
  {
    id: "ascenso_heroico",
    title: "El Salto a Primera",
    desc: "Ganar la final por el ascenso y subir a primera con un club de segunda.",
    category: "titulos",
    icon: "🎖️",
    check: (p) => (p.trophies || []).some(t => t.title.includes('Ascenso'))
  },

  // 3. Selección Nacional
  {
    id: "debut_seleccion",
    title: "Vestir la Celeste y Blanca / Nacional",
    desc: "Recibir tu primera citación oficial a la Selección Nacional.",
    category: "seleccion",
    icon: "🎽",
    check: (p) => (p.nationalTeamStats?.matches || 0) >= 1 || p.nationalTeamStats?.calledUp
  },
  {
    id: "campeon_continental_nt",
    title: "Conquistador de América o Europa",
    desc: "Ganar la Copa América, Eurocopa o Copa Oro con la Selección.",
    category: "seleccion",
    icon: "🦅",
    check: (p) => (p.trophies || []).some(t => t.title.includes('América') || t.title.includes('Eurocopa') || t.title.includes('Oro'))
  },
  {
    id: "campeon_mundo",
    title: "La Tercera Estrella: Gloria Eterna",
    desc: "Consagrarte Campeón del Mundo FIFA en el torneo mundialista.",
    category: "seleccion",
    icon: "🌍",
    check: (p) => (p.trophies || []).some(t => t.title.includes('Mundo'))
  },

  // 4. Folclore, Idolatría & Vestuario
  {
    id: "estatua_bronce",
    title: "Estatua en las Puertas del Estadio",
    desc: "Alcanzar 95 de idolatría y 5 temporadas en un club para tener tu monumento.",
    category: "folclore",
    icon: "🗽",
    check: (p) => Boolean(p.hasStatue)
  },
  {
    id: "traidor_clasico",
    title: "El Gran Traidor",
    desc: "Cruzar de vereda e irte a jugar al clásico rival de toda la vida.",
    category: "folclore",
    icon: "🐍",
    check: (p) => (p.clubHistory || []).some(h => h.leftAsRival)
  },
  {
    id: "duenio_clasico",
    title: "Dueño del Clásico",
    desc: "Ganar 5 clásicos a lo largo de tu carrera.",
    category: "folclore",
    icon: "🔥",
    check: (p) => (p.clasicosWon || 0) >= 5
  },
  {
    id: "capitan_querido",
    title: "Líder de Vestuario",
    desc: "Alcanzar 90% o más de Química de Vestuario y Confianza con el DT.",
    category: "folclore",
    icon: "🤝",
    check: (p) => (p.managerRelationship || 0) >= 85 && (p.lockerRoomChemistry || 0) >= 85
  },

  // 5. Premios & Estilo de Vida
  {
    id: "balon_oro",
    title: "El Mejor Futbolista del Planeta",
    desc: "Ganar el Balón de Oro / Mejor Jugador del continente.",
    category: "premios",
    icon: "🌕",
    check: (p) => (p.awards || []).some(a => a.name.includes('Balón de Oro'))
  },
  {
    id: "pibe_revelacion",
    title: "Joyita del Semillero",
    desc: "Ser premiado como Pibe Revelación del Año con 21 años o menos.",
    category: "premios",
    icon: "✨",
    check: (p) => (p.awards || []).some(a => a.name.includes('Pibe Revelación'))
  },
  {
    id: "vida_lujos",
    title: "Magnate de Puerto Madero & Nordelta",
    desc: "Comprar la Mansión, el Yate y el Departamento en la Tienda de Vida.",
    category: "lifestyle",
    icon: "🛥️",
    check: (p) => {
      const ls = p.lifestyle || [];
      const hasMansion = ls.includes('mansion_nordelta') || ls.includes('mansion_cancha');
      const hasYate = ls.includes('yate_mediterraneo') || ls.includes('yate_lujo');
      const hasDept = ls.includes('departamento_puerto_madero');
      return hasMansion && hasYate && hasDept;
    }
  },
  {
    id: "millonario_banco",
    title: "Billetera Galáctica",
    desc: "Acumular más de $5.000.000 en tu cuenta bancaria.",
    category: "lifestyle",
    icon: "💰",
    check: (p) => (p.money || 0) >= 5000000
  },
  {
    id: "los_viejos_trapos",
    title: "Los Viejos Son los Trapos",
    desc: "Disputar una temporada oficial y ser campeón con 35 años o más.",
    category: "premios",
    icon: "👴",
    check: (p) => (p.age || 16) >= 35 && (p.trophies || []).some(t => t.year >= 2026 + (p.seasonsPlayed - 1))
  },
  {
    id: "estratega_monedas",
    title: "Estratega Nato",
    desc: "Acumular 50 o más Monedas de Potrero en tu haber.",
    category: "lifestyle",
    icon: "🪙",
    check: (p) => (p.coins || 0) >= 50
  }
];

// Load unlocked achievements from localStorage
export function getUnlockedAchievements() {
  try {
    const raw = localStorage.getItem('el_idolo_unlocked_achievements_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

// Save unlocked achievements
export function saveUnlockedAchievements(unlockedList) {
  try {
    localStorage.setItem('el_idolo_unlocked_achievements_v1', JSON.stringify(unlockedList));
  } catch {}
}

// Check player against all achievements and return newly unlocked ones
export function checkPlayerAchievements(player) {
  if (!player) return [];
  const currentUnlocked = getUnlockedAchievements();
  const newlyUnlocked = [];

  ACHIEVEMENTS.forEach(ach => {
    if (!currentUnlocked.some(u => u.id === ach.id)) {
      if (ach.check(player)) {
        const item = {
          id: ach.id,
          unlockedAt: new Date().toLocaleDateString('es-AR'),
        };
        currentUnlocked.push(item);
        newlyUnlocked.push(ach);
      }
    }
  });

  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievements(currentUnlocked);
  }

  return newlyUnlocked;
}
