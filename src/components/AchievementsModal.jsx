import React, { useState } from 'react';
import { ACHIEVEMENTS, getUnlockedAchievements } from '../data/achievements';
import { sound } from '../utils/audio';
import { X, Award, CheckCircle2, Lock, Trophy, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'cancha', label: '⚽ Cancha' },
  { id: 'titulos', label: '🏆 Títulos' },
  { id: 'seleccion', label: '🎽 Selección' },
  { id: 'folclore', label: '🧉 Folclore' },
  { id: 'lifestyle', label: '💎 Lifestyle' },
  { id: 'premios', label: '⭐ Premios' },
];

export default function AchievementsModal({ onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const unlocked = getUnlockedAchievements();
  const unlockedIds = new Set(unlocked.map(u => u.id));

  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = unlockedIds.size;
  const percentage = Math.round((unlockedCount / totalCount) * 100);

  const filteredAchievements = ACHIEVEMENTS.filter(ach => {
    if (selectedCategory === 'todos') return true;
    return ach.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-[#0a120e] border-2 border-[#22E748]/40 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(34,231,72,0.15)] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#22E748] to-[#15803d] flex items-center justify-center shadow-[0_0_15px_rgba(34,231,72,0.4)]">
              <Award className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#22E748] bg-[#22E748]/10 px-2 py-0.5 rounded border border-[#22E748]/20">
                  Hitos Históricos Globales
                </span>
                <span className="text-[10px] font-mono font-bold text-gray-400">
                  {unlockedCount}/{totalCount}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Salón de Logros de Potrero
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

        {/* Global Progress Bar */}
        <div className="px-5 sm:px-6 py-4 bg-[#0d1813] border-b border-white/5">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-gray-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#22E748]" />
              <span>Progreso Global de Completitud</span>
            </span>
            <span className="text-[#22E748] font-mono font-black">{percentage}%</span>
          </div>
          <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#15803d] via-[#22E748] to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(34,231,72,0.8)]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-5 sm:px-6 py-3 border-b border-white/5 overflow-x-auto flex items-center space-x-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#22E748] text-black shadow-md font-black'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAchievements.map(ach => {
              const isUnlocked = unlockedIds.has(ach.id);
              const unlockInfo = unlocked.find(u => u.id === ach.id);

              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex items-start space-x-3.5 ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-[#0e2115] to-[#0a150e] border-[#22E748]/50 shadow-[0_0_20px_rgba(34,231,72,0.15)]'
                      : 'bg-black/40 border-white/5 opacity-70 hover:opacity-90'
                  }`}
                >
                  {/* Left Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner ${
                      isUnlocked
                        ? 'bg-[#22E748]/20 border border-[#22E748]/40'
                        : 'bg-white/5 border border-white/10 text-gray-500'
                    }`}
                  >
                    {isUnlocked ? ach.icon : <Lock className="w-5 h-5 text-gray-500" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-sm font-black truncate ${
                          isUnlocked ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {ach.title}
                      </h4>
                      {isUnlocked ? (
                        <span className="flex items-center space-x-1 text-[10px] font-black uppercase text-[#22E748] bg-[#22E748]/10 px-2 py-0.5 rounded border border-[#22E748]/20 flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Obtenido</span>
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-gray-500 flex-shrink-0">
                          Bloqueado
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {ach.desc}
                    </p>

                    {isUnlocked && unlockInfo?.unlockedAt && (
                      <p className="text-[10px] text-gray-400 mt-2 font-mono">
                        Desbloqueado el: {unlockInfo.unlockedAt}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center space-x-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Los logros persisten para siempre en todas tus carreras.</span>
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-[#22E748] hover:bg-[#16a34a] text-black font-black rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
