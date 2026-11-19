import React, { useState } from 'react';
import PenaltyMinigame from './minigames/PenaltyMinigame';
import TrileMinigame from './minigames/TrileMinigame';
import GoalkeeperMinigame from './minigames/GoalkeeperMinigame';
import FreeKickMinigame from './minigames/FreeKickMinigame';
import HeaderMinigame from './minigames/HeaderMinigame';
import { Target, Shuffle, ShieldCheck, Dumbbell, Sparkles, Flame } from 'lucide-react';
import { sound } from '../utils/audio';

export default function TrainingZone({ rewardsLeft = 0, maxRewards = 3, onPracticeResult, playerStat = 75 }) {
  const [activeMinigame, setActiveMinigame] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const minigamesList = [
    {
      id: 'penalty',
      title: 'Tiro de Penal & Definición',
      desc: 'Practicá el medidor de timing y la colocación del remate contra el arquero.',
      icon: <Target className="w-6 h-6 text-[#22E748]" />,
      badge: 'Habilidad (9 y 10)'
    },
    {
      id: 'freekick',
      title: 'Tiro Libre al Ángulo',
      desc: 'Superá la barrera rival con rosca, potencia y comba hacia las ratoneras.',
      icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
      badge: 'Enganche / Tiro Libre'
    },
    {
      id: 'header',
      title: 'Cabezazo de Área en la Agonía',
      desc: 'Conectá centros con salto perfecto y direccioná el frentazo al gol.',
      icon: <Flame className="w-6 h-6 text-red-400" />,
      badge: 'Goleador / 9 de Área'
    },
    {
      id: 'trile',
      title: 'El Trile / La Cábala',
      desc: 'Entrená la vista y seguí el vaso ganador entre los que se mezclan a toda velocidad.',
      icon: <Shuffle className="w-6 h-6 text-amber-400" />,
      badge: 'Cabulero / Azar'
    },
    {
      id: 'goalkeeper',
      title: 'Atajada Bajo los Tres Palos',
      desc: 'Ponete los guantes del 1 y reaccioná en milisegundos para tapar el tiro a los ángulos.',
      icon: <ShieldCheck className="w-6 h-6 text-cyan-400" />,
      badge: 'Arquero (1)'
    }
  ];

  return (
    <div className="panel p-3.5 sm:p-6 space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-3 sm:pb-4">
        <div className="flex items-center space-x-2 text-[#22E748] mb-1">
          <Dumbbell className="w-5 h-5" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">
            Entrenamiento libre
          </span>
        </div>
        <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
          Practicá los minijuegos de las finales
        </h2>
        <p className="hidden sm:block text-xs text-gray-400 mt-1">
          Las finales se definen al mejor de 3 jugadas con estos minijuegos. Practicá todas las veces que quieras.
        </p>
        <div className={`mt-2 sm:mt-3 inline-flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold ${
          rewardsLeft > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-white/5 border-white/10 text-gray-400'
        }`}>
          🪙 {rewardsLeft > 0
            ? `+2 🪙 por acierto (${rewardsLeft}/${maxRewards} esta temporada)`
            : 'Ya cobraste los premios de práctica de esta temporada'}
        </div>
      </div>

      {/* If a minigame is actively running */}
      {activeMinigame ? (
        <div className="space-y-4">
          <button
            onClick={() => {
              sound.playClick();
              setActiveMinigame(null);
            }}
            className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all inline-flex items-center space-x-1"
          >
            <span>⬅️ Volver a la Lista de Minijuegos</span>
          </button>

          {activeMinigame === 'penalty' && (
            <PenaltyMinigame
              title="Práctica Libre de Penales"
              strikerName="Práctica"
              onResult={(won) => {
                const reward = onPracticeResult?.(won);
                setLastResult((won ? "¡Golazo convertido en la práctica!" : "Remate erróneo, ¡probá de nuevo!") + (reward ? ` ${reward}` : ''));
                setActiveMinigame(null);
              }}
            />
          )}

          {activeMinigame === 'freekick' && (
            <FreeKickMinigame
              title="Práctica Libre de Tiro Libre"
              strikerName="Práctica"
              playerStat={playerStat}
              onResult={(won) => {
                const reward = onPracticeResult?.(won);
                setLastResult((won ? "¡Golazo de tiro libre en la práctica!" : "¡La barrera o el arquero te frenaron el remate!") + (reward ? ` ${reward}` : ''));
                setActiveMinigame(null);
              }}
            />
          )}

          {activeMinigame === 'header' && (
            <HeaderMinigame
              title="Práctica Libre de Cabezazo"
              strikerName="Práctica"
              playerStat={playerStat}
              onResult={(won) => {
                const reward = onPracticeResult?.(won);
                setLastResult((won ? "¡Frentazo letal a la red en la práctica!" : "¡Buen salto, a seguir practicando la dirección!") + (reward ? ` ${reward}` : ''));
                setActiveMinigame(null);
              }}
            />
          )}

          {activeMinigame === 'trile' && (
            <TrileMinigame
              title="Práctica Libre de Trile Cabulero"
              onResult={(won) => {
                const reward = onPracticeResult?.(won);
                setLastResult((won ? "¡Acertaste la copa!" : "Copa vacía, ¡a seguir entrenando la vista!") + (reward ? ` ${reward}` : ''));
                setActiveMinigame(null);
              }}
            />
          )}

          {activeMinigame === 'goalkeeper' && (
            <GoalkeeperMinigame
              title="Práctica de Reflejos de Arquero"
              onResult={(won) => {
                const reward = onPracticeResult?.(won);
                setLastResult((won ? "¡Gran tapada con los guantes!" : "¡Se te escapó el tiro!") + (reward ? ` ${reward}` : ''));
                setActiveMinigame(null);
              }}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {minigamesList.map(item => (
            <button
              key={item.id}
              onClick={() => { sound.playClick(); setActiveMinigame(item.id); }}
              className="bg-[#0e1712] border border-white/10 hover:border-[#22E748]/50 rounded-2xl p-3 sm:p-5 flex items-center sm:items-start gap-3 text-left transition-all cursor-pointer group"
            >
              <div className="p-2 sm:p-2.5 bg-black/40 rounded-xl border border-white/5 shrink-0">{item.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white truncate">{item.title}</h3>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 shrink-0">{item.badge}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-400 leading-snug mt-0.5 line-clamp-2">{item.desc}</p>
              </div>
              <span className="text-[#22E748] font-black text-lg shrink-0 group-hover:translate-x-0.5 transition">›</span>
            </button>
          ))}
        </div>
      )}

      {lastResult && !activeMinigame && (
        <div className="p-3 bg-[#122217] border border-[#22E748]/40 rounded-xl text-center text-xs font-bold text-[#22E748]">
          Último entrenamiento: {lastResult}
        </div>
      )}
    </div>
  );
}
