import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import { saveLegendToHallOfFame, computeGlory } from '../utils/storage';
import CareerHighlights from './CareerHighlights';
import { RefreshCw, Crown, Briefcase } from 'lucide-react';

export default function RetirementScreen({
  player,
  onNewGame,
  onOpenHallOfFame,
  onOpenManagerMode
}) {
  const isGk = player.position === 'arquero';

  // Glory points (shared formula, includes the difficulty multiplier)
  const glory = computeGlory(player);
  const totalGloryScore = glory.total;
  const TIERS = [
    ['Trotamundos del Fútbol', 'bg-gray-800 text-gray-300'],
    ['NIVEL CAMPEÓN DESTACADO: Respetado en todo el continente', 'bg-blue-400 text-black'],
    ['NIVEL PALERMO & BOCHINI: Ídolo Eterno de la Hinchada', 'bg-[#22E748] text-black'],
    ['NIVEL RIQUELME, FRANCESCOLI & FILLOL: Estatua de Bronce en la Historia', 'bg-yellow-400 text-black'],
    ['NIVEL MARADONA & MESSI: Deidad Inmortal del Fútbol Mundial', 'bg-gradient-to-r from-amber-500 to-yellow-300 text-black'],
  ];
  const [comparison, tierBadge] = TIERS[glory.tier];

  const celebratedRef = useRef(null);
  useEffect(() => {
    if (celebratedRef.current === player.id) return;
    celebratedRef.current = player.id;
    sound.playFanfare();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });
    // Auto-save retired player into Hall of Fame
    saveLegendToHallOfFame(player);
  }, [player]);

  return (
    <div className="max-w-3xl mx-auto bg-[#0a120e] border-2 border-[#F6B40E] rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden animate-fadeIn text-center space-y-6">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Banner */}
      <div>
        <span className="text-xs uppercase font-black tracking-widest text-black bg-[#F6B40E] px-4 py-1.5 rounded-full inline-block shadow-md">
          El Partido Homenaje y Despedida
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white mt-3 tracking-tight">
          ¡GRACIAS POR EL FÚTBOL!
        </h1>
        <p className="text-sm text-gray-300 mt-1 max-w-lg mx-auto">
          Tras una trayectoria inolvidable a lo largo de {player.seasonsPlayed} temporadas, cuelgas los botines ante un estadio que corea tu nombre.
        </p>
      </div>

      {/* Statue reveal if earned */}
      {player.hasStatue && (
        <div className="bg-[#121c16] border border-[#F6B40E] rounded-2xl p-6 shadow-[0_0_40px_rgba(246,180,14,0.25)] flex flex-col items-center">
          <div className="text-7xl mb-2 filter drop-shadow-[0_0_15px_#F6B40E] animate-bounce">
            🗽
          </div>
          <h2 className="text-xl font-black text-[#F6B40E] uppercase tracking-wide">
            ¡LA ESTATUA EN EL ESTADIO ES REAL!
          </h2>
          <p className="text-xs text-amber-200/90 max-w-md mt-1">
            Muy pocos jugadores en la historia del fútbol logran lo que vos lograste: tu figura esculpida en bronce vigilará para siempre las gradas.
          </p>
        </div>
      )}

      {/* Score Summary Box */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold block mb-1">
          Puntuación Total de Gloria
        </span>
        <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tight text-[#22E748]">
          {totalGloryScore} <span className="text-sm font-sans text-gray-400 font-normal">PTS</span>
        </div>
        {glory.mult !== 1 && (
          <p className="text-xs text-gray-400 mt-1">
            {glory.base} pts × {String(glory.mult).replace('.', ',')} por jugar en {player.difficulty === 'leyenda' ? 'Leyenda 👑' : 'Fácil 🌱'}
          </p>
        )}

        <div className={`mt-3 inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${tierBadge}`}>
          {comparison}
        </div>
      </div>

      {/* Career Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-[#0e1712] border border-white/5 rounded-xl p-3">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">Partidos</span>
          <span className="text-2xl font-black text-white font-mono">{player.totalMatches}</span>
        </div>
        <div className="bg-[#0e1712] border border-white/5 rounded-xl p-3">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">{isGk ? "Vallas Invictas" : "Goles"}</span>
          <span className="text-2xl font-black text-[#22E748] font-mono">{isGk ? player.totalCleanSheets : player.totalGoals}</span>
        </div>
        <div className="bg-[#0e1712] border border-white/5 rounded-xl p-3">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">Títulos</span>
          <span className="text-2xl font-black text-yellow-400 font-mono">{player.trophies.length}</span>
        </div>
        <div className="bg-[#0e1712] border border-white/5 rounded-xl p-3">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">Fortuna</span>
          <span className="text-xl font-black text-emerald-400 font-mono">${(player.money).toLocaleString()}</span>
        </div>
      </div>

      {/* Highlights timeline + share card */}
      <CareerHighlights player={player} showShare />

      {/* Action Buttons: New Game, Hall of Fame, Manager Mode */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onNewGame}
          className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#22E748] to-[#16a34a] text-black font-black text-sm rounded-2xl shadow-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Comenzar Nueva Carrera</span>
        </button>

        {onOpenManagerMode && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenManagerMode();
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm rounded-2xl shadow-xl hover:brightness-110 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Convertirte en DT ➔</span>
          </button>
        )}

        {onOpenHallOfFame && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenHallOfFame();
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-sm rounded-2xl border border-white/10 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Salón de la Fama</span>
          </button>
        )}
      </div>
    </div>
  );
}
