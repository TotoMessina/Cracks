import React, { useState } from 'react';
import Flag from './Flag';
import { CLUBS, COUNTRIES, LEAGUES } from '../data/clubs';
import { DIFFICULTIES } from '../game/career';
import ClubShield from './ClubShield';
import { sound } from '../utils/audio';
import { User, X } from 'lucide-react';

export default function NewGameModal({ onStartGame, onClose, replacing = null }) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('delantero'); // 'delantero', 'enganche', 'arquero'
  const [playstyle, setPlaystyle] = useState('habilidoso'); // 'habilidoso', 'cabulero', 'mixto'
  const [archetype, setArchetype] = useState('normal'); // 'normal', 'pibe_maravilla'
  const [country, setCountry] = useState('ar');
  const [selectedLeagueId, setSelectedLeagueId] = useState('arg_ascenso');
  const [selectedClubId, setSelectedClubId] = useState(1001); // Chacarita
  const [gameMode, setGameMode] = useState('standard'); // 'standard', 'ultra', 'sin_reglas'
  const [difficulty, setDifficulty] = useState('normal');

  const availableClubs = CLUBS.filter(c => c.league === selectedLeagueId).sort((a, b) => a.reputation - b.reputation);
  const selectedClub = CLUBS.find(c => c.id === selectedClubId);

  const handleLeagueChange = (leagueId) => {
    setSelectedLeagueId(leagueId);
    const clubsInLeague = CLUBS.filter(c => c.league === leagueId).sort((a, b) => a.reputation - b.reputation);
    if (clubsInLeague.length > 0) {
      setSelectedClubId(clubsInLeague[0].id);
    }
  };

  const handleStart = (e) => {
    e.preventDefault();
    sound.playWhistle();

    let initialPlayerConfig = {
      name: name.trim() || "El Pibe",
      position,
      playstyle,
      archetype,
      country,
      initialClubId: Number(selectedClubId),
      gameMode,
      difficulty,
    };

    onStartGame(initialPlayerConfig);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#0b130e] border border-[#22E748]/40 rounded-3xl max-w-2xl w-full p-5 sm:p-6 md:p-8 shadow-2xl relative max-h-[94vh] overflow-y-auto animate-pop">
        {/* Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-32 bg-[#22E748]/15 blur-3xl pointer-events-none" />

        {onClose && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer z-10"
            title="Cancelar y volver"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-6">
          <span className="text-xs uppercase font-black tracking-widest text-[#22E748] bg-[#22E748]/10 px-3 py-1 rounded-full border border-[#22E748]/20">
            Nueva Partida
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white mt-2">
            Creá tu Jugador de Potrero
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Elegí tus orígenes, tu puesto en la cancha y tu club de debut para empezar el camino a la estatua.
          </p>
        </div>

        {replacing && (
          <div className="mb-5 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-200">
            ⚠️ Esto reemplaza la carrera de <strong>{replacing.name}</strong> en la ranura #{replacing.slot}. Si querés conservarla, guardala antes en otra ranura desde "Partidas guardadas".
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="text-xs font-black uppercase text-gray-300 block mb-1.5 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-[#22E748]" />
              <span>Nombre o Apodo del Futbolista</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#121c16] border border-white/10 focus:border-[#22E748] rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#22E748]"
              placeholder="Ej: El Pibe Martínez"
            />
          </div>

          {/* Modo de juego */}
          <div>
            <label className="text-xs font-black uppercase text-gray-300 block mb-1.5">
              Modo de Juego
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'standard', label: 'Carrera Completa', desc: '16 a 38 años' },
                { id: 'ultra', label: 'Modo Ultra', desc: 'Exprés de 2 años' },
                { id: 'sin_reglas', label: 'Sin Reglas', desc: 'Stats 99 & Sandbox' }
              ].map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    sound.playClick();
                    setGameMode(m.id);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    gameMode === m.id
                      ? 'border-[#22E748] bg-[#14261b] text-white'
                      : 'border-white/10 bg-[#0e1712] text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-black block text-white">{m.label}</span>
                  <span className="text-[10px] text-gray-400 block">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dificultad */}
          <div>
            <label className="text-xs font-black uppercase text-gray-300 block mb-1.5">
              Dificultad
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(DIFFICULTIES).map(d => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => { sound.playClick(); setDifficulty(d.id); }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    difficulty === d.id
                      ? d.id === 'leyenda' ? 'border-[#F6B40E] bg-[#F6B40E]/10' : 'border-[#22E748] bg-[#14261b]'
                      : 'border-white/10 bg-[#0e1712] hover:border-white/20'
                  }`}
                  aria-pressed={difficulty === d.id}
                >
                  <span className="text-xs font-black block text-white">{d.icon} {d.label}</span>
                  <span className="text-[10px] text-gray-400 block leading-snug mt-0.5">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Posición en Cancha */}
          <div>
            <label className="text-xs font-black uppercase text-gray-300 block mb-1.5">
              Puesto en Cancha
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'delantero', num: '9', title: 'Delantero', sub: 'Goleador de área' },
                { id: 'enganche', num: '10', title: 'Enganche', sub: 'Visión y pegada' },
                { id: 'arquero', num: '1', title: 'Arquero', sub: 'Vallas invictas' }
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    sound.playClick();
                    setPosition(p.id);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    position === p.id
                      ? 'border-[#22E748] bg-[#14261b] ring-1 ring-[#22E748]'
                      : 'border-white/10 bg-[#0e1712] hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl font-black text-white font-mono block">
                    {p.num}
                  </span>
                  <span className="text-xs font-black text-white block mt-0.5">
                    {p.title}
                  </span>
                  <span className="text-[10px] text-gray-400 block">{p.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Estilo y Arquetipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase text-gray-300 block mb-1.5">
                Clase de Jugador (Finales)
              </label>
              <select
                value={playstyle}
                onChange={(e) => setPlaystyle(e.target.value)}
                className="w-full bg-[#121c16] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#22E748]"
              >
                <option value="habilidoso">⚡ Habilidoso (Timing y puntería)</option>
                <option value="cabulero">🎲 Cabulero (Azar y Cábalas)</option>
                <option value="mixto">⚖️ Mixto (Balanceado)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-gray-300 block mb-1.5">
                Arquetipo Inicial
              </label>
              <select
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
                className="w-full bg-[#121c16] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#22E748]"
              >
                <option value="normal">👦 De las Inferiores (Normal)</option>
                <option value="pibe_maravilla">⭐ Pibe Maravilla (+8 Stats)</option>
              </select>
            </div>
          </div>

          {/* Nacionalidad */}
          <div>
            <label className="text-xs font-black uppercase text-gray-300 block mb-1.5">
              Nacionalidad
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto pr-1">
              {COUNTRIES.map(c => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    sound.playClick();
                    setCountry(c.id);
                  }}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    country === c.id
                      ? 'border-[#22E748] bg-[#14261b] text-white shadow-sm'
                      : 'border-white/10 bg-[#0e1712] text-gray-400 hover:border-white/20'
                  }`}
                >
                  <Flag code={c.id} size={12} title={c.name} />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Liga y Club de Debut */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase text-gray-300 block mb-1.5">
                  Liga de Inicio
                </label>
                <select
                  value={selectedLeagueId}
                  onChange={(e) => handleLeagueChange(e.target.value)}
                  className="w-full bg-[#121c16] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#22E748]"
                >
                  {LEAGUES.filter(l => l.startingAllowed).map(l => (
                    <option key={l.id} value={l.id}>{l.name} · {l.countryName}{l.secondTier ? ' (2ª división)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-gray-300 block mb-1.5">
                  Club donde Debutás
                </label>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(Number(e.target.value))}
                  className="w-full bg-[#121c16] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#22E748]"
                >
                  {availableClubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name} · nivel {c.reputation}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Club preview badge */}
            {selectedClub && (
              <div className="bg-[#0e1712] border border-white/5 rounded-xl p-3 flex items-start gap-3">
                <ClubShield club={selectedClub} size={42} />
                <div className="text-xs min-w-0 space-y-0.5">
                  <span className="font-black text-white block">{selectedClub.name}</span>
                  <span className="text-gray-400 block">{selectedClub.city} · {selectedClub.stadium}</span>
                  <span className="text-gray-400 block font-mono text-[11px]">
                    Nivel {selectedClub.level} · Prestigio histórico {selectedClub.prestige}
                  </span>
                  {selectedClub.profile && <span className="text-gray-300 italic block">{selectedClub.profile}</span>}
                  {selectedClub.reputation >= 80 && (
                    <span className="text-amber-300 block">⚠️ Club grande: vas a tener menos minutos de pibe pero más chances de títulos.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center space-x-3">
            {onClose && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="w-1/3 py-4 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-sm rounded-2xl transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className={`${onClose ? 'w-2/3' : 'w-full'} py-4 bg-gradient-to-r from-[#22E748] to-[#16a34a] text-black font-black text-base rounded-2xl shadow-xl hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center space-x-2`}
            >
              <span>¡Comenzar Mi Carrera Profesional! ➔</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
