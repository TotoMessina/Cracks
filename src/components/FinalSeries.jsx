import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import PenaltyMinigame from './minigames/PenaltyMinigame';
import TrileMinigame from './minigames/TrileMinigame';
import GoalkeeperMinigame from './minigames/GoalkeeperMinigame';
import FreeKickMinigame from './minigames/FreeKickMinigame';
import HeaderMinigame from './minigames/HeaderMinigame';
import { sound } from '../utils/audio';
import { pickMinigameType, getConditionBonus, adjustMinigame, getDifficulty } from '../game/career';

const ROUNDS_TO_WIN = 2; // best of 3

const TYPE_LABEL = {
  penalty: 'Penal',
  freekick: 'Tiro libre',
  header: 'Cabezazo',
  trile: 'Cábala',
  goalkeeper: 'Atajada',
};

export default function FinalSeries({ final, player, onFinish }) {
  const [round, setRound] = useState(0);
  const [results, setResults] = useState([]); // booleans
  const [types] = useState(() => [0, 1, 2].map(() => pickMinigameType(player)));
  const baseEnergy = final.condition?.energy ?? 100;
  const canRest = !final.rested && baseEnergy < 70;
  const [phase, setPhase] = useState(canRest ? 'prep' : 'play');
  const [rested, setRested] = useState(false);
  const energy = rested ? Math.min(100, baseEnergy + 20) : baseEnergy;
  const cond = getConditionBonus(final.condition?.form || 0, energy);
  const diff = getDifficulty(player);
  const adjusted = adjustMinigame(player, final.difficulty || 'normal', (final.bonus || 0) + cond.total);
  const totalBonus = adjusted.bonus;
  const fmt = (n) => `${n > 0 ? '+' : ''}${n}%`;

  const wins = results.filter(Boolean).length;
  const losses = results.length - wins;
  const decided = wins >= ROUNDS_TO_WIN || losses >= ROUNDS_TO_WIN;
  const champion = wins >= ROUNDS_TO_WIN;

  useEffect(() => {
    if (!decided) return;
    if (champion) {
      sound.playTrophy();
      const end = Date.now() + 1200;
      const frame = () => {
        confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#22E748', '#F6B40E', '#ffffff'] });
        confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#22E748', '#F6B40E', '#ffffff'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } else {
      sound.playCrowdGasp();
    }
  }, [decided, champion]);

  const handleRoundResult = (won) => {
    const nextResults = [...results, won];
    setResults(nextResults);
    const w = nextResults.filter(Boolean).length;
    const l = nextResults.length - w;
    if (w < ROUNDS_TO_WIN && l < ROUNDS_TO_WIN) setRound(r => r + 1);
  };

  const isLastPossible = (() => {
    // If winning this round would decide it, or losing it would
    return wins === ROUNDS_TO_WIN - 1 || losses === ROUNDS_TO_WIN - 1;
  })();

  const common = {
    title: final.title,
    strikerName: player?.name || 'El crack',
    bonus: totalBonus,
    playerStat: final.playerStat || 75,
    difficulty: adjusted.difficulty,
    onResult: handleRoundResult,
    continueLabel: isLastPossible ? 'Ver resultado final ➔' : 'Siguiente jugada ➔',
  };

  const type = types[round];

  return (
    <div className="w-full max-w-2xl mx-auto max-h-[94vh] overflow-y-auto overscroll-contain px-1">
      {/* Scoreboard */}
      <div className="scoreboard mb-3">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F6B40E]">
          {final.queue?.length > 1 ? `Final ${final.index + 1} de ${final.queue.length} · ` : ''}{final.stage === 'national' ? 'Selección · ' : ''}{final.title}
        </div>
        <div className="flex items-center justify-center gap-4 mt-1.5">
          <span className="text-sm font-black text-white truncate max-w-[40%] text-right">{final.teamName}</span>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 ${
                  results[i] === true ? 'bg-[#22E748] border-[#22E748]'
                    : results[i] === false ? 'bg-red-500 border-red-500'
                    : i === round && !decided ? 'border-white animate-pulse' : 'border-white/25'
                }`}
                title={results[i] === undefined ? `Jugada ${i + 1}` : results[i] ? 'Ganada' : 'Perdida'}
              />
            ))}
          </div>
          <span className="text-sm font-black text-gray-400">Rival</span>
        </div>
        <div className="text-[11px] text-gray-400 mt-1">
          {decided
            ? 'Serie terminada'
            : `Jugada ${round + 1} · ${TYPE_LABEL[type]} · Ganá 2 de 3 para levantar la copa`}
        </div>
      </div>

      {/* Condition: form + energy (+ bought advantage) */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-3">
        <span className={`chip ${cond.form > 0 ? 'chip-up' : cond.form < 0 ? 'chip-down' : ''}`}>📈 Forma {fmt(cond.form)}</span>
        <span className={`chip ${cond.energy > 0 ? 'chip-up' : cond.energy < 0 ? 'chip-down' : ''}`}>⚡ Energía {energy}% · {fmt(cond.energy)}</span>
        {(final.bonus || 0) > 0 && <span className="chip chip-gold">🎯 Ventaja {fmt(final.bonus)}</span>}
        {diff.minigameBonus !== 0 && <span className={`chip ${diff.minigameBonus > 0 ? 'chip-up' : 'chip-down'}`}>{diff.icon} {diff.label} {fmt(diff.minigameBonus)}</span>}
        <span className={`chip ${totalBonus >= 0 ? 'chip-up' : 'chip-down'}`}>Total {fmt(totalBonus)}</span>
      </div>

      {phase === 'prep' ? (
        <div className="mg-card text-center space-y-4 animate-pop">
          <div className="text-4xl">🥵</div>
          <h3 className="text-xl font-black text-white">Llegás a la final con {baseEnergy}% de energía</h3>
          <p className="text-sm text-gray-300">
            El cansancio te achica la zona verde y te quita tiempo de reacción. Podés pedirle al DT no jugar el último partido del torneo
            para llegar más fresco, aunque no le va a gustar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            <button
              onClick={() => { sound.playClick(); setRested(true); setPhase('play'); }}
              className="p-3 rounded-xl border border-sky-400/40 bg-sky-400/5 hover:bg-sky-400/10 cursor-pointer"
            >
              <span className="text-sm font-black text-white block">😴 Cuidarme la semana previa</span>
              <span className="text-[11px] text-gray-400">+20 de energía para la final · −3 de relación con el DT</span>
            </button>
            <button
              onClick={() => { sound.playClick(); setPhase('play'); }}
              className="p-3 rounded-xl border border-white/10 bg-black/30 hover:border-white/30 cursor-pointer"
            >
              <span className="text-sm font-black text-white block">💪 Jugar con lo que hay</span>
              <span className="text-[11px] text-gray-400">Sin cambios: el DT valora que no te borres</span>
            </button>
          </div>
        </div>
      ) : decided ? (
        <div className={`mg-card text-center animate-pop ${champion ? 'border-[#F6B40E]/60' : 'border-red-500/40'}`}>
          <div className="text-6xl mb-2">{champion ? '🏆' : '🥈'}</div>
          <h3 className={`text-3xl font-black tracking-tight ${champion ? 'text-gold' : 'text-gray-200'}`}>
            {champion ? '¡CAMPEONES!' : 'Subcampeones'}
          </h3>
          <p className="text-sm text-gray-300 mt-2 mb-5">
            {champion
              ? `${final.teamName} levanta ${final.tournament}. ¡Tu nombre queda en la historia!`
              : `Se escapó ${final.tournament} por muy poco. La revancha llegará.`}
          </p>
          <button onClick={() => onFinish(champion, { rested })} className="btn-primary w-full">
            Continuar la carrera ➔
          </button>
        </div>
      ) : (
        <div key={round} className="animate-fadeIn">
          {type === 'penalty' && <PenaltyMinigame {...common} />}
          {type === 'freekick' && <FreeKickMinigame {...common} />}
          {type === 'header' && <HeaderMinigame {...common} />}
          {type === 'trile' && <TrileMinigame {...common} />}
          {type === 'goalkeeper' && <GoalkeeperMinigame {...common} />}
        </div>
      )}
    </div>
  );
}
