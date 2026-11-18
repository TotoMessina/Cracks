import React, { useState } from 'react';
import PenaltyMinigame from './minigames/PenaltyMinigame';
import TrileMinigame from './minigames/TrileMinigame';
import GoalkeeperMinigame from './minigames/GoalkeeperMinigame';
import FreeKickMinigame from './minigames/FreeKickMinigame';
import HeaderMinigame from './minigames/HeaderMinigame';
import ClubShield from './ClubShield';
import Flag from './Flag';
import { getClubById } from '../data/clubs';
import { describeEffects } from '../game/effects';
import { getKeyStat } from '../game/career';
import { sound } from '../utils/audio';

const KIND_STYLE = {
  clasico: 'text-red-300 bg-red-500/10 border-red-500/40',
  decisivo: 'text-sky-300 bg-sky-500/10 border-sky-500/40',
  copa: 'text-[#F6B40E] bg-[#F6B40E]/10 border-[#F6B40E]/40',
  seleccion: 'text-sky-200 bg-sky-400/10 border-sky-400/40',
};

const MINIGAME_LABEL = {
  penalty: 'Penal', freekick: 'Tiro libre', header: 'Cabezazo', trile: 'Cábala', goalkeeper: 'Atajada',
};

function Stakes({ player, effects, positive }) {
  return (
    <div className="flex flex-wrap gap-1">
      {describeEffects(player, effects).filter(e => e.applies).map(e => (
        <span key={e.key} className={`chip ${positive ? 'chip-up' : 'chip-down'}`}>{e.label} {e.text}</span>
      ))}
    </div>
  );
}

/**
 * Plays one key match: intro screen (play it or auto-simulate) -> minigame -> onDone(won, auto).
 */
export default function KeyMatchModal({ event, player, index, total, onDone, autoResolve }) {
  const [phase, setPhase] = useState('intro'); // intro | playing | auto
  const [autoWon, setAutoWon] = useState(null);

  const club = player.currentClub;
  const opponentClub = event.opponentClubId ? getClubById(event.opponentClubId) : null;
  const isNational = event.kind === 'seleccion';
  const playerStat = player.stats?.[getKeyStat(player.position)] || 75;

  const common = {
    title: `${event.title} · ${event.context}`,
    strikerName: player.name,
    bonus: 0,
    playerStat,
    difficulty: event.difficulty,
    continueLabel: 'Seguir la temporada ➔',
    onResult: (won) => onDone(won, false),
  };

  const handleAuto = () => {
    sound.playWhistle();
    const won = autoResolve(event);
    setAutoWon(won);
    setPhase('auto');
    if (won) sound.playGoal(); else sound.playCrowdGasp();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[94vh] overflow-y-auto overscroll-contain px-1">
        {/* Match header */}
        <div className="scoreboard mb-3">
          <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
            <span className={`px-2 py-0.5 rounded-full border ${KIND_STYLE[event.kind]}`}>{event.label}</span>
            <span className="text-gray-400">Partido clave {index + 1} de {total}</span>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
              {isNational ? <Flag code={player.country} size={30} /> : <ClubShield club={club} size={44} />}
              <span className="text-xs font-black text-white truncate max-w-full">{isNational ? 'Tu Selección' : club.shortName}</span>
            </div>
            <span className="font-display text-3xl text-gray-500">VS</span>
            <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
              {isNational ? <Flag code={event.opponentCountry} size={30} /> : <ClubShield club={opponentClub} size={44} />}
              <span className="text-xs font-black text-white truncate max-w-full">{opponentClub?.shortName || event.opponentName}</span>
            </div>
          </div>
        </div>

        {phase === 'intro' && (
          <div className="mg-card text-center space-y-4 animate-pop">
            <p className="text-base sm:text-lg font-black text-white">{event.context}</p>
            <p className="text-xs text-gray-400">
              Te toca: <strong className="text-white">{MINIGAME_LABEL[event.minigame]}</strong> · Dificultad{' '}
              <strong className="text-white">{{ normal: 'normal', medium: 'media', hard: 'alta' }[event.difficulty]}</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-xl bg-[#22E748]/5 border border-[#22E748]/20">
                <span className="text-[10px] font-black uppercase text-[#22E748] block mb-1.5">Si ganás</span>
                <Stakes player={player} effects={event.stakes.win} positive />
                <span className="text-[10px] text-gray-400 block mt-1.5">+1 {player.position === 'arquero' ? 'valla invicta' : 'gol'} y más chances de llegar a la final.</span>
              </div>
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <span className="text-[10px] font-black uppercase text-red-400 block mb-1.5">Si perdés</span>
                <Stakes player={player} effects={event.stakes.lose} />
                <span className="text-[10px] text-gray-400 block mt-1.5">El equipo pierde confianza para el resto del año.</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => { sound.playWhistle(); setPhase('playing'); }} className="btn-primary flex-1">
                ¡Lo juego yo! ➔
              </button>
              <button onClick={handleAuto} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-gray-200 cursor-pointer">
                Simularlo
              </button>
            </div>
          </div>
        )}

        {phase === 'playing' && (
          <div className="animate-fadeIn">
            {event.minigame === 'penalty' && <PenaltyMinigame {...common} />}
            {event.minigame === 'freekick' && <FreeKickMinigame {...common} />}
            {event.minigame === 'header' && <HeaderMinigame {...common} />}
            {event.minigame === 'trile' && <TrileMinigame {...common} />}
            {event.minigame === 'goalkeeper' && <GoalkeeperMinigame {...common} />}
          </div>
        )}

        {phase === 'auto' && (
          <div className="mg-card text-center space-y-4 animate-pop">
            <div className="text-5xl">{autoWon ? '🎉' : '😞'}</div>
            <h3 className={`text-2xl font-black ${autoWon ? 'text-[#22E748]' : 'text-red-400'}`}>
              {autoWon ? `¡Ganaron ${event.label === 'Clásico' ? 'el clásico' : 'el partido'}!` : 'Se perdió el partido'}
            </h3>
            <p className="text-sm text-gray-300">
              {autoWon ? 'Respondiste cuando el equipo más lo necesitaba.' : 'No fue tu día. La hinchada te lo va a recordar.'}
            </p>
            <button onClick={() => onDone(autoWon, true)} className="btn-primary w-full">Seguir la temporada ➔</button>
          </div>
        )}
      </div>
    </div>
  );
}
