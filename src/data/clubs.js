// Clubs & leagues for El Ídolo, built from ligas_y_equipos_2026.json.
// To add or edit teams, change the JSON: this file adapts it to the game's format.
import RAW_LEAGUES from './ligas_y_equipos_2026.json';

// ---------------------------------------------------------------------------
// League metadata (keyed by the JSON "id"). Unknown ids get sensible defaults.
// ---------------------------------------------------------------------------
const CONTINENTAL_CUP = {
  sa: 'Copa Libertadores de América',
  eu: 'UEFA Champions League',
  na: 'Concacaf Champions Cup',
  as: 'AFC Champions League Elite',
};

const LEAGUE_META = {
  1: { key: 'arg_primera', short: 'Liga Profesional', country: 'ar', continent: 'sa', salaryMult: 1, cup: 'Copa Argentina' },
  16: { key: 'arg_ascenso', short: 'Primera Nacional', country: 'ar', continent: 'sa', salaryMult: 0.5, secondTier: true, promotesTo: 'arg_primera', promotionFinal: 'Final del Reducido por el Ascenso a Primera' },
  2: { key: 'eng_premier', short: 'Premier League', country: 'en', continent: 'eu', salaryMult: 2.3, cup: 'FA Cup' },
  15: { key: 'eng_championship', short: 'Championship', country: 'en', continent: 'eu', salaryMult: 1, secondTier: true, promotesTo: 'eng_premier', promotionFinal: 'Final del Play-off por el Ascenso a la Premier' },
  3: { key: 'esp_laliga', short: 'LaLiga', country: 'es', continent: 'eu', salaryMult: 2.2, cup: 'Copa del Rey' },
  4: { key: 'ita_seriea', short: 'Serie A', country: 'it', continent: 'eu', salaryMult: 2, cup: 'Coppa Italia' },
  5: { key: 'ger_bundesliga', short: 'Bundesliga', country: 'de', continent: 'eu', salaryMult: 2, cup: 'DFB-Pokal' },
  6: { key: 'fra_ligue1', short: 'Ligue 1', country: 'fr', continent: 'eu', salaryMult: 1.8, cup: 'Copa de Francia' },
  7: { key: 'br_primera', short: 'Brasileirão', country: 'br', continent: 'sa', salaryMult: 1.2, cup: 'Copa do Brasil' },
  8: { key: 'por_primeira', short: 'Liga Portugal', country: 'pt', continent: 'eu', salaryMult: 1.2, cup: 'Taça de Portugal' },
  9: { key: 'ned_eredivisie', short: 'Eredivisie', country: 'nl', continent: 'eu', salaryMult: 1.2, cup: 'KNVB Beker' },
  10: { key: 'usa_mls', short: 'MLS', country: 'us', continent: 'na', salaryMult: 1.5, cup: 'U.S. Open Cup' },
  11: { key: 'mex_ligamx', short: 'Liga MX', country: 'mx', continent: 'na', salaryMult: 1.2, cup: 'Copa MX' },
  12: { key: 'uy_primera', short: 'Campeonato Uruguayo', country: 'uy', continent: 'sa', salaryMult: 0.75, cup: 'Copa AUF Uruguay' },
  13: { key: 'col_primera', short: 'Liga BetPlay', country: 'co', continent: 'sa', salaryMult: 0.7, cup: 'Copa Colombia' },
  14: { key: 'chi_primera', short: 'Primera de Chile', country: 'cl', continent: 'sa', salaryMult: 0.7, cup: 'Copa Chile' },
  17: { key: 'tur_superlig', short: 'Süper Lig', country: 'tr', continent: 'eu', salaryMult: 1.3, cup: 'Copa de Turquía' },
  18: { key: 'sco_premiership', short: 'Scottish Premiership', country: 'sco', continent: 'eu', salaryMult: 1, cup: 'Scottish Cup' },
  19: { key: 'sau_pro', short: 'Saudi Pro League', country: 'ksa', continent: 'as', salaryMult: 3, cup: 'Copa del Rey Saudí' },
};

// Old club ids are kept so existing saves keep pointing to the same club
const LEGACY_IDS = {
  'Boca Juniors': 451, 'River Plate': 435, 'Racing Club': 436, 'Independiente': 453, 'San Lorenzo': 460,
  'Huracán': 450, 'Vélez Sarsfield': 443, 'Estudiantes de La Plata': 440, 'Gimnasia y Esgrima La Plata': 448,
  'Rosario Central': 445, "Newell's Old Boys": 447, 'Talleres': 446, 'Belgrano': 454, 'Argentinos Juniors': 441,
  'Platense': 444, 'Lanús': 449, 'Banfield': 452, 'Defensa y Justicia': 462, 'Godoy Cruz': 464,
  'Chacarita Juniors': 1001, 'Ferro Carril Oeste': 1002, 'Quilmes': 1003, 'Atlanta': 1004, 'All Boys': 1005,
  'Nueva Chicago': 1006, 'Colón': 1007, 'San Martín de Tucumán': 1008, 'Almirante Brown': 1009, 'Deportivo Morón': 1010,
  'CA Peñarol': 2348, 'Club Nacional de Football': 2356, 'Defensor Sporting': 2350, 'Danubio FC': 2352,
  'Flamengo': 3001, 'Palmeiras': 3002, 'Corinthians': 3003, 'São Paulo': 3004,
  'Real Madrid': 5001, 'FC Barcelona': 5002, 'Atlético de Madrid': 5003, 'Manchester City': 5004,
  'Manchester United': 5005, 'Liverpool': 5006, 'FC Bayern Múnich': 5007, 'Paris Saint-Germain': 5008,
  'Inter de Milán': 5009, 'AC Milan': 5010, 'Juventus': 5011,
};

// Readable short names for tables and crests
const SHORT_NAMES = {
  'Boca Juniors': 'Boca', 'River Plate': 'River', 'Racing Club': 'Racing', 'Vélez Sarsfield': 'Vélez',
  'Estudiantes de La Plata': 'Estudiantes', 'Argentinos Juniors': 'Argentinos', 'Defensa y Justicia': 'Defensa',
  "Newell's Old Boys": "Newell's", 'Gimnasia y Esgrima La Plata': 'Gimnasia LP', 'Atlético Tucumán': 'Atl. Tucumán',
  'Independiente Rivadavia': 'Ind. Rivadavia', 'Gimnasia y Esgrima de Mendoza': 'Gimnasia (M)',
  'Estudiantes de Río Cuarto': 'Estudiantes RC', 'Barracas Central': 'Barracas', 'Central Córdoba (SdE)': 'Central Córdoba',
  'Deportivo Riestra': 'Riestra', 'Rosario Central': 'Central',
  'Manchester City': 'Man City', 'Manchester United': 'Man United', 'Tottenham Hotspur': 'Tottenham',
  'Newcastle United': 'Newcastle', 'Brighton & Hove Albion': 'Brighton', 'Nottingham Forest': 'Nottingham F.',
  'AFC Bournemouth': 'Bournemouth', 'Sunderland AFC': 'Sunderland',
  'FC Barcelona': 'Barcelona', 'Atlético de Madrid': 'Atlético', 'RC Celta de Vigo': 'Celta', 'Deportivo Alavés': 'Alavés',
  'RC Deportivo de La Coruña': 'Deportivo', 'Real Racing Club de Santander': 'Racing (S)', 'Rayo Vallecano': 'Rayo',
  'Inter de Milán': 'Inter', 'ACF Fiorentina': 'Fiorentina', 'SSC Napoli': 'Napoli', 'Cagliari Calcio': 'Cagliari', 'Frosinone Calcio': 'Frosinone',
  'FC Bayern Múnich': 'Bayern', 'Bayer 04 Leverkusen': 'Leverkusen', 'Borussia Dortmund': 'Dortmund',
  'Eintracht Frankfurt': 'Frankfurt', 'Borussia Mönchengladbach': 'Gladbach', 'SV Werder Bremen': 'Werder Bremen',
  'TSG Hoffenheim': 'Hoffenheim', '1. FC Union Berlin': 'Union Berlin', '1. FSV Mainz 05': 'Mainz',
  'SC Paderborn 07': 'Paderborn', 'Paris Saint-Germain': 'PSG', 'Olympique de Marsella': 'Marsella',
  'Olympique de Lyon': 'Lyon', 'Stade Brestois 29': 'Brest', 'RC Strasbourg Alsace': 'Estrasburgo',
  'Atlético Mineiro': 'Atl. Mineiro', 'Red Bull Bragantino': 'Bragantino', 'Athletico Paranaense': 'Athletico-PR',
  'GD Estoril Praia': 'Estoril', 'CF Estrela da Amadora': 'Estrela', 'Académico de Viseu': 'Académico',
  'Go Ahead Eagles': 'Go Ahead', 'Fortuna Sittard': 'Fortuna', 'Excelsior Rotterdam': 'Excelsior', 'Sparta Rotterdam': 'Sparta',
  'Los Angeles FC': 'LAFC', 'Seattle Sounders FC': 'Seattle', 'New York City FC': 'NYCFC', 'New York Red Bulls': 'NY Red Bulls',
  'Philadelphia Union': 'Philadelphia', 'New England Revolution': 'New England', 'Vancouver Whitecaps FC': 'Vancouver',
  'Portland Timbers': 'Portland', 'Real Salt Lake': 'Salt Lake', 'Colorado Rapids': 'Colorado', 'Minnesota United FC': 'Minnesota',
  'Sporting Kansas City': 'Sporting KC', 'San Jose Earthquakes': 'San José',
  'CF Monterrey (Rayados)': 'Monterrey', 'CD Guadalajara (Chivas)': 'Chivas', 'Deportivo Toluca': 'Toluca',
  'Club Santos Laguna': 'Santos Laguna', 'Club Tijuana (Xolos)': 'Tijuana', 'Atlético de San Luis': 'Atl. San Luis',
  'Club Nacional de Football': 'Nacional', 'CA Peñarol': 'Peñarol', 'Liverpool FC (Uruguay)': 'Liverpool (U)',
  'Defensor Sporting': 'Defensor', 'Montevideo Wanderers': 'Wanderers', 'Racing Club de Montevideo': 'Racing (M)',
  'Montevideo City Torque': 'MVD City', 'Deportivo Maldonado': 'Maldonado', 'Juventud de Las Piedras': 'Juventud',
  'Central Español': 'Central Esp.', 'Danubio FC': 'Danubio',
  'Atlético Nacional': 'Atl. Nacional', 'América de Cali': 'América', 'Junior de Barranquilla': 'Junior',
  'Independiente Santa Fe': 'Santa Fe', 'Independiente Medellín': 'Medellín', 'Deportes Tolima': 'Tolima',
  'Atlético Bucaramanga': 'Bucaramanga', 'Deportivo Pereira': 'Pereira', 'Águilas Doradas': 'Águilas',
  'Deportivo Pasto': 'Pasto', 'Cúcuta Deportivo': 'Cúcuta', 'Jaguares de Córdoba': 'Jaguares',
  'Internacional de Bogotá': 'Inter Bogotá', 'Millonarios FC': 'Millonarios',
  'Universidad de Chile': 'U. de Chile', 'Universidad Católica': 'U. Católica', 'Everton de Viña del Mar': 'Everton (Ch)',
  'Unión La Calera': 'La Calera', 'Deportes La Serena': 'La Serena', 'Deportes Limache': 'Limache',
  'Universidad de Concepción': 'U. Concepción', 'Deportes Concepción': 'D. Concepción',
  'West Ham United': 'West Ham', 'Wolverhampton Wanderers': 'Wolves', 'Sheffield United': 'Sheffield Utd',
  'West Bromwich Albion': 'West Brom', 'Blackburn Rovers': 'Blackburn', 'Queens Park Rangers': 'QPR',
  'Preston North End': 'Preston', 'Birmingham City': 'Birmingham', 'Charlton Athletic': 'Charlton', 'Bolton Wanderers': 'Bolton',
  'Southampton FC': 'Southampton', 'Middlesbrough FC': 'Middlesbrough',
  'San Martín de San Juan': 'San Martín SJ', 'San Martín de Tucumán': 'San Martín T', 'Ferro Carril Oeste': 'Ferro',
  'Chacarita Juniors': 'Chacarita', 'Deportivo Morón': 'Morón', 'Almirante Brown': 'Almirante',
  'Defensores de Belgrano': 'Defensores', 'Ferrocarril Midland': 'Midland', 'Ciudad de Bolívar': 'Ciudad Bolívar',
  'Atlético de Rafaela': 'Rafaela', 'Deportivo Madryn': 'Madryn', 'Deportivo Maipú': 'Maipú', 'Chaco For Ever': 'Chaco',
  'Racing de Córdoba': 'Racing (C)', 'Estudiantes (BA)': 'Estudiantes BA', 'Tristán Suárez': 'Tristán Suárez',
  'İstanbul Başakşehir FK': 'Başakşehir', 'Çaykur Rizespor': 'Rizespor', 'Galatasaray SK': 'Galatasaray',
  'Gençlerbirliği SK': 'Gençlerbirliği', 'Erzurumspor FK': 'Erzurumspor',
  'Heart of Midlothian': 'Hearts', 'St Johnstone FC': 'St Johnstone',
  'Al-Ahli Saudi FC': 'Al-Ahli', 'Al-Ittihad Club': 'Al-Ittihad', 'Al-Kholood Club': 'Al-Kholood', 'Al-Diriyah Club': 'Al-Diriyah',
};

const NOISE = new Set(['FC', 'AFC', 'CF', 'SC', 'SK', 'FK', 'CD', 'RC', 'ACF', 'SSC', 'Calcio', 'Club', 'CA', 'US', 'AS', 'SS', 'SV', 'GD', 'CSD', 'EC', 'SE', 'CR']);

function makeShortName(name) {
  if (SHORT_NAMES[name]) return SHORT_NAMES[name];
  if (name.length <= 15) return name;
  const words = name.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean);
  const kept = words.filter(w => !NOISE.has(w));
  const joined = (kept.length ? kept : words).join(' ');
  if (joined.length <= 15) return joined;
  return (kept[0] || words[0]);
}

const tierFor = (rep) => (rep >= 88 ? 1 : rep >= 80 ? 2 : rep >= 73 ? 3 : 4);

function buildLeagues(raw) {
  return raw.map(l => {
    const meta = LEAGUE_META[l.id] || {};
    const continent = meta.continent || 'eu';
    return {
      id: meta.key || `liga_${l.id}`,
      jsonId: l.id,
      name: l.liga,
      short: meta.short || l.liga,
      countryName: l.pais,
      country: meta.country || null,
      continent,
      salaryMult: meta.salaryMult ?? 1,
      secondTier: Boolean(meta.secondTier),
      promotesTo: meta.promotesTo || null,
      promotionFinal: meta.promotionFinal || null,
      cup: meta.cup || `Copa de ${l.pais}`,
      continentalCup: CONTINENTAL_CUP[continent],
      season: l.temporada,
      startingAllowed: true,
      teams: l.equipos,
    };
  });
}

export const LEAGUES = buildLeagues(RAW_LEAGUES);

const DEFAULT_LEAGUE = {
  id: 'liga', name: 'Liga', short: 'Liga', continent: 'sa', salaryMult: 1, secondTier: false,
  promotesTo: null, promotionFinal: null, cup: 'Copa Nacional', continentalCup: CONTINENTAL_CUP.sa,
};

export function getLeague(id) {
  return LEAGUES.find(l => l.id === id) || DEFAULT_LEAGUE;
}

export function isKnownLeague(id) {
  return LEAGUES.some(l => l.id === id);
}

function buildClubs(leagues) {
  const clubs = [];
  const used = new Set(Object.values(LEGACY_IDS));
  leagues.forEach(league => {
    league.teams.forEach((t, idx) => {
      let id = LEGACY_IDS[t.nombre];
      if (!id) {
        id = 10000 + league.jsonId * 100 + idx;
        while (used.has(id)) id += 1;
      }
      used.add(id);
      const nivel = Number(t.nivel_actual) || 70;
      const prestigio = Number(t.prestigio_historico) || nivel;
      const reputation = Math.round(nivel * 0.75 + prestigio * 0.25);
      clubs.push({
        id,
        name: t.nombre,
        shortName: makeShortName(t.nombre),
        sigla: t.sigla || makeShortName(t.nombre).slice(0, 3).toUpperCase(),
        city: t.ciudad,
        stadium: t.estadio,
        colors: Array.isArray(t.colores) && t.colores.length ? t.colores : ['#103F79', '#FFFFFF'],
        rivalNames: t.clasicos || [],
        prestige: prestigio,
        level: nivel,
        reputation,
        tier: tierFor(reputation),
        profile: t.perfil_competitivo || '',
        league: league.id,
        country: league.country,
      });
    });
  });
  // Resolve derbies by name (only the ones that exist in the file)
  const byName = new Map(clubs.map(c => [c.name, c.id]));
  clubs.forEach(c => {
    c.rivals = c.rivalNames.map(n => byName.get(n)).filter(id => id && id !== c.id);
    delete c.rivalNames;
  });
  return clubs;
}

export const CLUBS = buildClubs(LEAGUES);
LEAGUES.forEach(l => { delete l.teams; });

export const COUNTRIES = [
  { id: "ar", name: "Argentina", flag: "🇦🇷", nationalTeam: "Selección Argentina", continent: "sa" },
  { id: "uy", name: "Uruguay", flag: "🇺🇾", nationalTeam: "La Celeste", continent: "sa" },
  { id: "br", name: "Brasil", flag: "🇧🇷", nationalTeam: "A Canarinha", continent: "sa" },
  { id: "co", name: "Colombia", flag: "🇨🇴", nationalTeam: "Los Cafeteros", continent: "sa" },
  { id: "cl", name: "Chile", flag: "🇨🇱", nationalTeam: "La Roja", continent: "sa" },
  { id: "py", name: "Paraguay", flag: "🇵🇾", nationalTeam: "La Albirroja", continent: "sa" },
  { id: "pe", name: "Perú", flag: "🇵🇪", nationalTeam: "La Blanquirroja", continent: "sa" },
  { id: "mx", name: "México", flag: "🇲🇽", nationalTeam: "El Tri", continent: "na" },
  { id: "es", name: "España", flag: "🇪🇸", nationalTeam: "La Furia Roja", continent: "eu" },
  { id: "fr", name: "Francia", flag: "🇫🇷", nationalTeam: "Les Bleus", continent: "eu" },
  { id: "it", name: "Italia", flag: "🇮🇹", nationalTeam: "Gli Azzurri", continent: "eu" },
  { id: "en", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", nationalTeam: "Three Lions", continent: "eu" },
  { id: "de", name: "Alemania", flag: "🇩🇪", nationalTeam: "Die Mannschaft", continent: "eu" },
  { id: "pt", name: "Portugal", flag: "🇵🇹", nationalTeam: "A Seleção", continent: "eu" },
  { id: "nl", name: "Países Bajos", flag: "🇳🇱", nationalTeam: "La Naranja Mecánica", continent: "eu" }
];

export function getCountryById(id) {
  return COUNTRIES.find(c => c.id === id) || COUNTRIES[0];
}

export function findClub(id) {
  return CLUBS.find(c => c.id === Number(id)) || null;
}

export function getClubById(id) {
  return findClub(id) || CLUBS[0];
}

/**
 * Bring a club object stored in an old save up to date with the current data,
 * keeping a promotion the player earned (league + reputation) if it's still valid.
 */
export function refreshClub(saved) {
  if (!saved) return saved;
  const fresh = findClub(saved.id) || CLUBS.find(c => c.name === saved.name);
  if (!fresh) return isKnownLeague(saved.league) ? saved : { ...saved, league: CLUBS[0].league };
  const promoted = isKnownLeague(saved.league) && saved.league !== fresh.league;
  return promoted ? { ...fresh, league: saved.league, reputation: Math.max(fresh.reputation, saved.reputation || 0) } : fresh;
}

export function areRivals(clubId1, clubId2) {
  const c1 = findClub(clubId1);
  const c2 = findClub(clubId2);
  if (!c1 || !c2) return false;
  return c1.rivals.includes(c2.id) || c2.rivals.includes(c1.id);
}
