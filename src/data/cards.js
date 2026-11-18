// Pre-season Training Cards System for El Ídolo
// Rarity tiers: Común (Green), Rara (Blue), Dorada (Gold), Icónica (Purple)

export const CARDS = [
  // --- COMÚN ---
  {
    id: "definicion_c",
    name: "Tiros al Ángulo",
    category: "delantero",
    rarity: "comun",
    description: "Práctica intensiva de definición tras los entrenamientos.",
    effects: { definicion: 3 },
    quote: "La pelota donde las arañas tejen su nido."
  },
  {
    id: "potencia_c",
    name: "Gimnasio y Tren Inferior",
    category: "general",
    rarity: "comun",
    description: "Rutina pesada de sentadillas y potencia muscular.",
    effects: { potencia: 3, resistencia: 1 },
    quote: "Que no te muevan cuando vayas al choque."
  },
  {
    id: "gambeta_c",
    name: "Baldosa y Cintura",
    category: "delantero",
    rarity: "comun",
    description: "Amagues en espacios reducidos al estilo potrero.",
    effects: { gambeta: 3 },
    quote: "Si te come el amague, ya quedó pagando."
  },
  {
    id: "pegada_c",
    name: "Pelota Parada",
    category: "enganche",
    rarity: "comun",
    description: "Centros con rosca y tiros libres por afuera de la barrera.",
    effects: { pegada: 3 },
    quote: "La caricia con tres dedos."
  },
  {
    id: "liderazgo_c",
    name: "Voz en el Vestuario",
    category: "enganche",
    rarity: "comun",
    description: "Ganar ascendencia entre tus compañeros de plantel.",
    effects: { liderazgo: 3, idolatria: 2 },
    quote: "A levantar la cabeza que falta un tiempo entero."
  },
  {
    id: "reflejos_c",
    name: "Atrapadas a Quemarropa",
    category: "arquero",
    rarity: "comun",
    description: "Reacción instantánea ante remates desde el área chica.",
    effects: { reflejos: 3 },
    quote: "Tirar el manotazo antes de que el 9 festeje."
  },
  {
    id: "salida_c",
    name: "Descuelgue de Centros",
    category: "arquero",
    rarity: "comun",
    description: "Salir con puños firmes a cortar centros llovidos.",
    effects: { salida: 3 },
    quote: "¡Mía, mía!"
  },
  {
    id: "resistencia_c",
    name: "Fondo en la Playa",
    category: "general",
    rarity: "comun",
    description: "Pasadas en la arena para ganar pulmón para los 90 minutos.",
    effects: { resistencia: 3, forma: 1 },
    quote: "Correr cuando al rival ya no le dan las piernas."
  },
  {
    id: "olfato_area_c",
    name: "El Rebote en el Área",
    category: "delantero",
    rarity: "comun",
    description: "Seguir la jugada viva hasta que la pelota cruce la línea.",
    effects: { definicion: 3, potencia: 1 },
    quote: "Los goles feos valen exactamente lo mismo que los golazos."
  },
  {
    id: "caño_antologico_c",
    name: "Túnel en la Línea",
    category: "enganche",
    rarity: "comun",
    description: "Tirar la pelota entre las piernas del rival sobre el lateral.",
    effects: { gambeta: 3, fama: 2 },
    quote: "Se fue a comprar una empanada y todavía no volvió."
  },
  {
    id: "achique_suicida_c",
    name: "Achique al Límite",
    category: "arquero",
    rarity: "comun",
    description: "Tirarse con la cabeza adelante a los pies del delantero.",
    effects: { agilidad: 3, salida: 2 },
    quote: "Arriesgar el cuerpo con tal de que la pelota no pase."
  },
  {
    id: "asado_del_viernes_c",
    name: "Asado y Truco en la Concentración",
    category: "general",
    rarity: "comun",
    description: "Noche de truco y mollejas para unir al plantel antes del partido.",
    effects: { forma: 1, liderazgo: 2, idolatria: 2 },
    quote: "Los campeonatos se ganan en la mesa comiendo vacío."
  },
  {
    id: "pisotear_pelota_c",
    name: "Pisar la Redonda al Córner",
    category: "general",
    rarity: "comun",
    description: "Agarrar la pelota contra el banderín y poner el lomo.",
    effects: { gambeta: 2, liderazgo: 2, idolatria: 2 },
    quote: "Cuidar el resultado con alma, maña y potrero."
  },

  // --- RARA ---
  {
    id: "fierrazo_r",
    name: "Bomba Inatajable",
    category: "delantero",
    rarity: "rara",
    description: "Un cañonazo imparable que rompe redes desde 30 metros.",
    effects: { definicion: 4, potencia: 3 },
    quote: "Si no se corre el arquero, entra con arquero y todo."
  },
  {
    id: "diez_magico_r",
    name: "Visión Periférica Total",
    category: "enganche",
    rarity: "rara",
    description: "Pase filtrado que deja al delantero mano a mano.",
    effects: { pegada: 4, gambeta: 3 },
    quote: "Donde todos ven una pared, vos ves un hueco."
  },
  {
    id: "candado_r",
    name: "El Candado de Acero",
    category: "arquero",
    rarity: "rara",
    description: "Achique perfecto y reflejos felinos en los mano a mano.",
    effects: { reflejos: 4, agilidad: 3 },
    quote: "El arco se hace chiquitito cuando salís a achicar."
  },
  {
    id: "marketing_r",
    name: "Contrato de Botines Top",
    category: "general",
    rarity: "rara",
    description: "Campaña publicitaria mundial con tu firma de botines.",
    effects: { fama: 6, dinero: 120000 },
    quote: "Tu cara en las gigantografías de la avenida."
  },
  {
    id: "idolo_barrial_r",
    name: "La Ovación del Domingo",
    category: "general",
    rarity: "rara",
    description: "Un golazo agónico que desata el delirio de la hinchada.",
    effects: { idolatria: 8, forma: 1 },
    quote: "«¡Olé, olé, olé, olé...!»"
  },
  {
    id: "el_pique_corto_r",
    name: "Pique Corto Explosivo",
    category: "delantero",
    rarity: "rara",
    description: "Arranque fulminante para ganar la posición en los primeros metros.",
    effects: { potencia: 4, definicion: 3, forma: 1 },
    quote: "En dos metros le sacaste medio cuerpo de ventaja al central."
  },
  {
    id: "tres_dedos_r",
    name: "La Caricia a Tres Dedos",
    category: "enganche",
    rarity: "rara",
    description: "Pase enroscado con el empeine exterior burlando la defensa.",
    effects: { pegada: 4, gambeta: 3, fama: 3 },
    quote: "La comba perfecta esquivando cabezas rivales."
  },
  {
    id: "mono_volador_r",
    name: "Vuelo de Palo a Palo",
    category: "arquero",
    rarity: "rara",
    description: "Volar en el aire para cachetear un remate que iba al ángulo.",
    effects: { reflejos: 4, agilidad: 4 },
    quote: "Manotazo con la punta de los dedos al córner."
  },
  {
    id: "el_bidon_misterioso_r",
    name: "El Bidón con Agua Bendita",
    category: "general",
    rarity: "rara",
    description: "Trucos y astucia criolla para sacar ventaja en los momentos clave.",
    effects: { resistencia: 4, forma: 1, liderazgo: 2 },
    quote: "La cábala no se discute, se cumple."
  },
  {
    id: "la_arenga_capitan_r",
    name: "Arenga en el Túnel",
    category: "general",
    rarity: "rara",
    description: "Palabras que erizan la piel antes de pisar el césped.",
    effects: { liderazgo: 5, forma: 1, idolatria: 3 },
    quote: "«¡Salimos y nos los comemos crudos!»."
  },

  // --- DORADA ---
  {
    id: "crack_total_d",
    name: "Instinto Asesino del 9",
    category: "delantero",
    rarity: "dorada",
    description: "Hueles la sangre en el área. No perdonas nunca.",
    effects: { definicion: 6, potencia: 4, fama: 5 },
    quote: "Naciste con el arco entre ceja y ceja."
  },
  {
    id: "director_orquesta_d",
    name: "Cerebro del Equipo",
    category: "enganche",
    rarity: "dorada",
    description: "Manejas los tiempos, calmas la pelota y mandas al frente.",
    effects: { pegada: 5, liderazgo: 6, idolatria: 5 },
    quote: "La cinta de capitán te queda pintada."
  },
  {
    id: "san_arquero_d",
    name: "San Salvador del Arco",
    category: "arquero",
    rarity: "dorada",
    description: "Atajadas imposibles en los minutos de descuento.",
    effects: { reflejos: 6, mando: 5, idolatria: 6 },
    quote: "Una estatua viviente custodiando los tres palos."
  },
  {
    id: "adn_ganador_d",
    name: "Mística Copera",
    category: "general",
    rarity: "dorada",
    description: "Tu equipo se agiganta en las noches decisivas de Copa.",
    effects: { liderazgo: 4, definicion: 3, bonusFinal: 15 },
    quote: "Las finales no se juegan, las finales se ganan."
  },
  {
    id: "anticipo_palermo_d",
    name: "El Optimista del Gol",
    category: "delantero",
    rarity: "dorada",
    description: "Anticipo feroz en el primer palo. La pelota te busca a vos.",
    effects: { definicion: 7, potencia: 4, idolatria: 6 },
    quote: "Siempre en el lugar justo y en el momento indicado."
  },
  {
    id: "la_chilena_d",
    name: "La Tijera Acrobática",
    category: "delantero",
    rarity: "dorada",
    description: "Remate en el aire que deja una postal para la eternidad.",
    effects: { definicion: 6, gambeta: 5, fama: 8 },
    quote: "El estadio enmudeció cuando quedaste suspendido en el aire."
  },
  {
    id: "bochini_pase_gol_d",
    name: "El Pase Gol Milimétrico",
    category: "enganche",
    rarity: "dorada",
    description: "Asistencia quirúrgica entre tres defensores.",
    effects: { pegada: 7, gambeta: 4, idolatria: 7 },
    quote: "Donde no entra un alfiler, vos metiste una puñalada."
  },
  {
    id: "tiro_libre_quirurgico_d",
    name: "Tiro Libre Quirúrgico",
    category: "enganche",
    rarity: "dorada",
    description: "Acariciar la pelota por arriba de la barrera directo a la escuadra.",
    effects: { pegada: 7, liderazgo: 4, forma: 1 },
    quote: "El arquero ni se tiró, solo miró la comba."
  },
  {
    id: "chilavert_tiro_libre_d",
    name: "El 1 Goleador y Caudillo",
    category: "arquero",
    rarity: "dorada",
    description: "Voz de mando feroz y pegada magistral en pelotas paradas.",
    effects: { mando: 6, salida: 4, pegada: 5, idolatria: 7 },
    quote: "Cruzar toda la cancha para patear el tiro libre y clavarla."
  },
  {
    id: "pato_seguridad_d",
    name: "El Arco en Cero Asegurado",
    category: "arquero",
    rarity: "dorada",
    description: "Solvencia total bajo los tres palos sin dar rebote jamás.",
    effects: { reflejos: 6, salida: 5, mando: 5 },
    quote: "Transmitir paz absoluta a toda la línea de 4."
  },
  {
    id: "la_cinta_oro_d",
    name: "Capitán Eterno",
    category: "general",
    rarity: "dorada",
    description: "Liderazgo supremo que contagia coraje a todo el equipo.",
    effects: { liderazgo: 7, idolatria: 8, fama: 6 },
    quote: "Cuando hablás vos, hasta el árbitro escucha con respeto."
  },

  // --- ICÓNICA ---
  {
    id: "toque_dios_i",
    name: "Bendición del Diez",
    category: "general",
    rarity: "iconica",
    description: "La magia absoluta del fútbol argentino corre por tus venas.",
    effects: {
      definicion: 5,
      pegada: 5,
      gambeta: 5,
      liderazgo: 5,
      fama: 10,
      idolatria: 10
    },
    quote: "Barrilete cósmico, ¿de qué planeta viniste?"
  },
  {
    id: "inmortal_i",
    name: "El Ídolo Inmortal",
    category: "general",
    rarity: "iconica",
    description: "Un pacto con la gloria eterna. La hinchada ya te esculpe la estatua.",
    effects: {
      idolatria: 20,
      fama: 12,
      resistencia: 6,
      dinero: 250000
    },
    quote: "De pibe a bronce. Tu nombre no se borra jamás."
  },
  {
    id: "batigol_i",
    name: "El Cañón de Batistuta",
    category: "delantero",
    rarity: "iconica",
    description: "Potencia descomunal y definición implacable en cualquier ángulo.",
    effects: {
      definicion: 9,
      potencia: 9,
      fama: 10,
      idolatria: 8
    },
    quote: "Le pegaba con el alma para romper las redes del mundo."
  },
  {
    id: "la_pausa_riquelme_i",
    name: "El Arte de la Pausa",
    category: "enganche",
    rarity: "iconica",
    description: "Manejar el tiempo y el espacio. La pelota duerme bajo tu suela.",
    effects: {
      pegada: 9,
      liderazgo: 9,
      idolatria: 12,
      fama: 8
    },
    quote: "Parar la pelota mientras el mundo se mueve desesperado."
  },
  {
    id: "dibu_achique_i",
    name: "El Baile y la Mirada Fija",
    category: "arquero",
    rarity: "iconica",
    description: "Presencia psicológica arrolladora y tapadas heroicas en minutos finales.",
    effects: {
      reflejos: 9,
      mando: 9,
      bonusFinal: 25,
      fama: 12
    },
    quote: "«Mirá que te como, hermano». En los penales sos invencible."
  }
];

// Draw 3 random cards for the pre-season with weighted rarity probabilities
export function drawPreseasonCards(position = 'delantero', wonderkid = false, hasJet = false) {
  // Base weights: Comun 55%, Rara 30%, Dorada 12%, Iconica 3%
  let pIconica = wonderkid ? 0.06 : 0.03;
  let pDorada = wonderkid ? 0.20 : 0.12;
  let pRara = wonderkid ? 0.34 : 0.30;

  // Jet Privado perk: 50% boost to Dorada and Icónica cards
  if (hasJet) {
    pIconica *= 1.5;
    pDorada *= 1.5;
  }

  // Calculate cumulative rarity thresholds
  const threshIconica = pIconica;
  const threshDorada = threshIconica + pDorada;
  const threshRara = threshDorada + pRara;

  const getRarityByRoll = (roll) => {
    if (roll < threshIconica) return 'iconica';
    if (roll < threshDorada) return 'dorada';
    if (roll < threshRara) return 'rara';
    return 'comun';
  };

  const selected = [];
  const selectedIds = new Set();

  for (let slot = 0; slot < 3; slot++) {
    const roll = Math.random();
    const targetRarity = getRarityByRoll(roll);

    // Candidates of target rarity not yet picked (only cards useful for this position)
    const usable = (c) => c.category === 'general' || c.category === position;
    let candidates = CARDS.filter(c => c.rarity === targetRarity && !selectedIds.has(c.id) && usable(c));

    // Fallback to any useful unselected card if that rarity is exhausted
    if (candidates.length === 0) {
      candidates = CARDS.filter(c => !selectedIds.has(c.id) && usable(c));
    }
    if (candidates.length === 0) {
      candidates = CARDS.filter(c => !selectedIds.has(c.id));
    }

    // Prefer position match or general
    const positionMatches = candidates.filter(c => c.category === 'general' || c.category === position);
    const pool = positionMatches.length > 0 ? positionMatches : candidates;

    if (pool.length > 0) {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      selected.push(chosen);
      selectedIds.add(chosen.id);
    }
  }

  // Fallback if somehow fewer than 3 were selected
  for (const c of CARDS) {
    if (selected.length >= 3) break;
    if (!selectedIds.has(c.id)) {
      selected.push(c);
      selectedIds.add(c.id);
    }
  }

  return selected;
}
