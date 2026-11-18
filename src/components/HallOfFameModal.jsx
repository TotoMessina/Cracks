import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { getHallOfFameLegends } from '../utils/storage';
import { Trophy, Crown, X, Trash2 } from 'lucide-react';

export default function HallOfFameModal({ onClose }) {
  const [legends, setLegends] = useState(getHallOfFameLegends);
  const [sortBy, setSortBy] = useState('score'); // 'score', 'trophies', 'goals'

  const sortedLegends = [...legends].sort((a, b) => {
    if (sortBy === 'trophies') return b.trophiesCount - a.trophiesCount;
    if (sortBy === 'goals') return b.totalGoals - a.totalGoals;
    return b.totalGloryScore - a.totalGloryScore;
  });

  const top3 = sortedLegends.slice(0, 3);
  const rest = sortedLegends.slice(3);

  const handleClear = () => {
    if (window.confirm("¿Seguro que deseás vaciar el Salón de la Fama histórico? Esta acción no se puede deshacer.")) {
      sound.playClick();
      localStorage.removeItem('el_idolo_hall_of_fame_v1');
      setLegends([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-[#0a120e] border-2 border-[#F6B40E]/50 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(246,180,14,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F6B40E] to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(246,180,14,0.4)]">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Panteón Histórico
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Salón de la Fama de Leyendas
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sort Pills */}
        <div className="px-5 sm:px-6 py-3 border-b border-white/5 bg-[#0d1813] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-400 mr-1">Ordenar por:</span>
            {[
              { id: 'score', label: '⭐ Gloria' },
              { id: 'trophies', label: '🏆 Títulos' },
              { id: 'goals', label: '⚽ Goles' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setSortBy(tab.id);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sortBy === tab.id
                    ? 'bg-[#F6B40E] text-black font-black shadow-md'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {legends.length > 0 && (
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-xs flex items-center space-x-1 cursor-pointer"
              title="Vaciar historial"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vaciar</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {legends.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="text-5xl">🏛️</div>
              <h3 className="text-lg font-black text-white">
                El Panteón aguarda a su primer Ídolo
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Completá y retirá una carrera para inmortalizar tu nombre, títulos y puntuación de gloria en este Salón de la Fama.
              </p>
            </div>
          ) : (
            <>
              {/* Podium for Top 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {top3.map((leg, idx) => {
                  const place = idx + 1;
                  const borderCol = place === 1
                    ? 'border-yellow-400/60 bg-gradient-to-b from-yellow-500/15 via-[#0e1712] to-[#0a120e]'
                    : place === 2
                    ? 'border-slate-300/40 bg-gradient-to-b from-slate-400/10 via-[#0e1712] to-[#0a120e]'
                    : 'border-amber-700/50 bg-gradient-to-b from-amber-700/15 via-[#0e1712] to-[#0a120e]';
                  const medalEmoji = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
                  const crownCol = place === 1 ? 'text-yellow-400' : place === 2 ? 'text-slate-300' : 'text-amber-600';

                  return (
                    <div
                      key={leg.id || idx}
                      className={`p-4 rounded-2xl border ${borderCol} relative overflow-hidden shadow-xl flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{medalEmoji}</span>
                          <span className={`text-xs font-black uppercase tracking-wider ${crownCol}`}>
                            #{place} Histórico
                          </span>
                        </div>

                        <h4 className="text-base font-black text-white truncate flex items-center space-x-1.5">
                          <span>{leg.name}</span>
                          {leg.hasStatue && <span title="Tiene Estatua">🗽</span>}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate">
                          {leg.finalClub} • {leg.position?.toUpperCase()}
                        </p>

                        <div className="mt-2 inline-block px-2 py-0.5 bg-black/60 rounded text-[9px] font-black uppercase text-amber-300 border border-amber-400/20">
                          {leg.honoraryTitle}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Puntos de Gloria</span>
                          <span className="text-xl font-black text-[#22E748] font-mono">
                            {leg.totalGloryScore}
                            {leg.difficulty === 'leyenda' && <span className="text-xs ml-1" title="Carrera en dificultad Leyenda">👑</span>}
                            {leg.difficulty === 'facil' && <span className="text-xs ml-1" title="Carrera en dificultad Fácil">🌱</span>}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-center text-[10px] bg-black/40 rounded-lg p-1.5">
                          <div>
                            <span className="text-gray-500 block">Títulos</span>
                            <span className="font-bold text-yellow-400 font-mono">{leg.trophiesCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">{leg.position === 'arquero' ? 'Vallas' : 'Goles'}</span>
                            <span className="font-bold text-white font-mono">
                              {leg.position === 'arquero' ? leg.totalCleanSheets : leg.totalGoals}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Años</span>
                            <span className="font-bold text-gray-300 font-mono">{leg.seasonsPlayed}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table / List for other places */}
              {rest.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 px-1">
                    Otras Leyendas Registradas
                  </h4>
                  <div className="space-y-2">
                    {rest.map((leg, idx) => {
                      const place = idx + 4;
                      return (
                        <div
                          key={leg.id || idx}
                          className="p-3.5 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className="font-mono font-black text-gray-500 text-sm w-6 text-center">
                              #{place}
                            </span>
                            <div className="min-w-0">
                              <h5 className="font-black text-white truncate flex items-center space-x-1.5">
                                <span>{leg.name}</span>
                                {leg.hasStatue && <span>🗽</span>}
                              </h5>
                              <p className="text-[10px] text-gray-400 truncate">
                                {leg.finalClub} • {leg.position} • {leg.honoraryTitle}{leg.difficulty === 'leyenda' ? ' • 👑 Leyenda' : leg.difficulty === 'facil' ? ' • 🌱 Fácil' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 flex-shrink-0 text-right">
                            <div>
                              <span className="text-[10px] text-gray-500 block">Títulos</span>
                              <span className="font-mono font-bold text-yellow-400">🏆 {leg.trophiesCount}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block">Gloria</span>
                              <span className="font-mono font-black text-[#22E748] text-sm">
                                {leg.totalGloryScore} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center space-x-1.5">
            <Trophy className="w-4 h-4 text-[#F6B40E]" />
            <span>Los campeones nunca mueren; su gloria queda grabada para siempre.</span>
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-[#F6B40E] hover:bg-yellow-500 text-black font-black rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
