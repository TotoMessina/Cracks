import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { clamp } from './useOscillator';

const CORNERS = [
  { id: 'tl', label: '↖ Arriba izq.', key: 'Q', x: '14%', y: '22%' },
  { id: 'tr', label: 'Arriba der. ↗', key: 'E', x: '86%', y: '22%' },
  { id: 'bl', label: '↙ Abajo izq.', key: 'A', x: '14%', y: '78%' },
  { id: 'br', label: 'Abajo der. ↘', key: 'D', x: '86%', y: '78%' },
];
const KEY_MAP = { q: 'tl', 7: 'tl', e: 'tr', 9: 'tr', a: 'bl', z: 'bl', 1: 'bl', d: 'br', c: 'br', 3: 'br' };
const BASE_TRAVEL = { normal: 1000, medium: 850, hard: 700 };

export default function GoalkeeperMinigame({
  title = "Penal en el último minuto",
  onResult,
  bonus = 0,
  playerStat = 75,
  difficulty = 'normal',
  continueLabel = 'Continuar ➔',
}) {
  // ready -> runup -> shot -> resolved
  const [phase, setPhase] = useState('ready');
  const [ballTarget, setBallTarget] = useState(null);
  const [playerDive, setPlayerDive] = useState(null);
  const [isSave, setIsSave] = useState(false);
  const [commentary, setCommentary] = useState('Sos el 1. Mirá la pelota: cuando salga el remate, tirate al rincón donde va. Si te adelantás, es pura adivinanza.');
  const timers = useRef([]);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const travelMs = Math.round(clamp((BASE_TRAVEL[difficulty] || 1000) + bonus * 8 + (playerStat - 60) * 6, 520, 1500));

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const resolve = (saved, text) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setIsSave(saved);
    setPhase('resolved');
    setCommentary(text);
    if (saved) {
      sound.playFanfare();
      confetti({ particleCount: 85, spread: 80, origin: { y: 0.6 } });
    } else {
      sound.playBuzzer();
    }
  };

  const handleStart = () => {
    if (phase !== 'ready') return;
    const target = CORNERS[Math.floor(Math.random() * CORNERS.length)].id;
    setBallTarget(target);
    setPhase('runup');
    sound.playWhistle();
    setCommentary('El delantero toma carrera...');
    later(() => {
      setPhase('shot');
      sound.playKick();
      setCommentary('¡PATEÓ! ¡Volá!');
      later(() => resolve(false, '¡Te quedaste parado! Entró pegada al palo.'), travelMs);
    }, 700 + Math.random() * 700);
  };

  const handleDive = (cornerId) => {
    const current = phaseRef.current;
    if (current !== 'runup' && current !== 'shot') return;
    setPlayerDive(cornerId);
    const correct = cornerId === ballTarget;
    if (current === 'runup') {
      // Diving early: you commit before seeing the shot
      setPhase('shot');
      sound.playKick();
      later(() => resolve(
        correct,
        correct ? '¡Te jugaste antes y adivinaste! ¡Atajadón!' : 'Te adelantaste y el delantero la puso del otro lado.'
      ), 500);
      return;
    }
    resolve(
      correct,
      correct ? '¡MANOTAZO HISTÓRICO! Volaste y la mandaste al córner.' : '¡Te tiraste al otro lado! Gol del rival.'
    );
  };

  const diveRef = useRef(handleDive);
  const startRef = useRef(handleStart);
  useEffect(() => { diveRef.current = handleDive; startRef.current = handleStart; });

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (phaseRef.current === 'ready' && (k === ' ' || k === 'enter')) { e.preventDefault(); startRef.current(); return; }
      if (KEY_MAP[k]) { e.preventDefault(); diveRef.current(KEY_MAP[k]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const target = CORNERS.find(c => c.id === ballTarget);
  const dive = CORNERS.find(c => c.id === playerDive);
  const ballMoving = (phase === 'shot' || phase === 'resolved') && target;
  const canDive = phase === 'runup' || phase === 'shot';

  return (
    <div className="mg-card">
      <div className="text-center mb-4">
        <span className="mg-badge text-sky-300 bg-sky-400/10 border-sky-400/30">Atajada clave</span>
        <h3 className="text-lg sm:text-xl font-black mt-2 text-white">{title}</h3>
        <p className="text-sm text-gray-300 mt-1 min-h-[40px]">{commentary}</p>
      </div>

      <div className="pitch-scene relative h-64 rounded-2xl overflow-hidden mb-4">
        <div className="absolute left-[6%] right-[6%] top-4 bottom-10 goal-frame">
          <div className="absolute inset-0 goal-net" />
          {CORNERS.map(c => {
            const isTarget = phase === 'resolved' && c.id === ballTarget;
            const isChosen = c.id === playerDive;
            return (
              <button
                key={c.id}
                onClick={() => handleDive(c.id)}
                disabled={!canDive}
                className={`absolute w-[46%] h-[46%] rounded-lg border-2 border-dashed text-[11px] font-black transition-all flex items-center justify-center ${
                  canDive ? 'border-sky-400/60 bg-sky-400/5 hover:bg-sky-400/20 cursor-pointer text-sky-200' : 'border-white/10 text-white/30'
                } ${isTarget ? 'border-yellow-400 bg-yellow-400/15 text-yellow-200' : ''} ${isChosen && !isTarget && phase === 'resolved' ? 'border-red-500 bg-red-500/15 text-red-300' : ''}`}
                style={{
                  left: c.id.endsWith('l') ? '2%' : undefined,
                  right: c.id.endsWith('r') ? '2%' : undefined,
                  top: c.id.startsWith('t') ? '3%' : undefined,
                  bottom: c.id.startsWith('b') ? '3%' : undefined,
                }}
              >
                <span>{c.label} <span className="opacity-60 font-mono">[{c.key}]</span></span>
              </button>
            );
          })}

          {/* Keeper (you) */}
          <div
            className="absolute transition-all duration-200 ease-out text-4xl select-none pointer-events-none"
            style={{
              left: dive ? dive.x : '50%',
              top: dive ? dive.y : '60%',
              transform: `translate(-50%, -50%) rotate(${dive ? (dive.id.endsWith('l') ? -40 : 40) : 0}deg)`,
            }}
          >
            🧤
          </div>

          {/* Ball */}
          <div
            className="absolute text-2xl select-none pointer-events-none ease-linear"
            style={{
              transitionProperty: 'left, top, transform',
              transitionDuration: ballMoving ? `${travelMs}ms` : '0ms',
              left: ballMoving ? target.x : '50%',
              top: ballMoving ? target.y : '118%',
              transform: `translate(-50%, -50%) scale(${ballMoving ? 0.85 : 1.3})`,
            }}
          >
            ⚽
          </div>
        </div>

        {phase === 'runup' && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-3xl animate-bounce select-none">🏃</div>
        )}
      </div>

      {phase === 'ready' && (
        <button onClick={handleStart} className="btn-primary w-full" style={{ backgroundImage: 'linear-gradient(90deg, #38BDF8, #0284c7)' }}>
          ¡Estoy listo! Que patee ➔
        </button>
      )}
      {canDive && (
        <p className="text-[11px] text-gray-400 text-center font-mono">
          Tocá el rincón o usá Q / E / A / D · Tiempo de reacción: {(travelMs / 1000).toFixed(2)} s
        </p>
      )}

      {phase === 'resolved' && (
        <div className="text-center pt-1 animate-fadeIn">
          <div className={`text-2xl font-black mb-4 ${isSave ? 'text-[#22E748]' : 'text-red-400'}`}>
            {isSave ? '🧤 ¡ATAJADÓN!' : '💔 Gol del rival'}
          </div>
          <button onClick={() => onResult?.(isSave)} className="btn-primary w-full">
            {continueLabel}
          </button>
        </div>
      )}
    </div>
  );
}
