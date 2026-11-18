import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { clamp } from './useOscillator';

const CONFIG = {
  normal: { swaps: 6, ms: 480 },
  medium: { swaps: 8, ms: 400 },
  hard: { swaps: 10, ms: 330 },
};

export default function TrileMinigame({
  title = "La cábala del campeón",
  onResult,
  bonus = 0,
  difficulty = 'normal',
  continueLabel = 'Continuar ➔',
}) {
  // preview -> shuffling -> picking -> revealed
  const [phase, setPhase] = useState('preview');
  const [slots, setSlots] = useState([0, 1, 2]); // slots[slotIndex] = cupId
  const [winningCup] = useState(() => Math.floor(Math.random() * 3));
  const [pickedCup, setPickedCup] = useState(null);
  const [commentary, setCommentary] = useState('Mirá bien debajo de qué vaso está la copa...');
  const timers = useRef([]);

  const cfg = CONFIG[difficulty] || CONFIG.normal;
  const swapMs = Math.round(clamp(cfg.ms + bonus * 4, 260, 700));
  const swaps = Math.max(4, cfg.swaps - Math.floor(bonus / 10));

  useEffect(() => {
    const t = timers.current;
    t.push(setTimeout(() => {
      setPhase('shuffling');
      setCommentary('¡Se mezclan! No le saques los ojos de encima.');
      for (let i = 0; i < swaps; i++) {
        t.push(setTimeout(() => {
          sound.playClick();
          setSlots(prev => {
            const next = [...prev];
            const a = Math.floor(Math.random() * 3);
            let b = Math.floor(Math.random() * 2);
            if (b >= a) b += 1;
            [next[a], next[b]] = [next[b], next[a]];
            return next;
          });
        }, i * swapMs));
      }
      t.push(setTimeout(() => {
        setPhase('picking');
        setCommentary('¿Dónde quedó la gloria? Elegí un vaso.');
      }, swaps * swapMs + 150));
    }, 1600));
    return () => t.forEach(clearTimeout);
  }, [swaps, swapMs]);

  const handlePick = (cupId) => {
    if (phase !== 'picking') return;
    setPickedCup(cupId);
    setPhase('revealed');
    const won = cupId === winningCup;
    if (won) {
      sound.playFanfare();
      setCommentary('¡Corazonada de campeón! Encontraste la copa.');
      confetti({ particleCount: 85, spread: 80, origin: { y: 0.6 } });
    } else {
      sound.playBuzzer();
      setCommentary('Vaso vacío... la suerte esta vez miró para otro lado.');
    }
  };

  const won = pickedCup === winningCup;

  return (
    <div className="mg-card">
      <div className="text-center mb-4">
        <span className="mg-badge text-[#F6B40E] bg-[#F6B40E]/10 border-[#F6B40E]/30">Cábala: el trile</span>
        <h3 className="text-lg sm:text-xl font-black mt-2 text-white">{title}</h3>
        <p className="text-sm text-gray-300 mt-1 min-h-[24px]">{commentary}</p>
      </div>

      <div className="relative h-48 my-6 rounded-2xl bg-gradient-to-b from-[#2a1a0d] to-[#140c06] border border-amber-900/50 overflow-hidden">
        <div className="absolute inset-x-6 bottom-8 h-2 rounded-full bg-black/40 blur-sm" />
        {[0, 1, 2].map(cupId => {
          const slot = slots.indexOf(cupId);
          const lifted = phase === 'preview' || (phase === 'revealed' && (cupId === pickedCup || cupId === winningCup));
          const isWinner = cupId === winningCup;
          return (
            <button
              key={cupId}
              onClick={() => handlePick(cupId)}
              disabled={phase !== 'picking'}
              className={`absolute bottom-6 w-1/3 flex flex-col items-center ease-in-out ${phase === 'picking' ? 'cursor-pointer group' : 'cursor-default'}`}
              style={{ left: `${slot * 33.333}%`, transition: `left ${Math.round(swapMs * 0.85)}ms ease-in-out` }}
              aria-label={`Vaso ${slot + 1}`}
            >
              {/* Prize underneath */}
              <span className={`absolute bottom-0 text-3xl transition-opacity duration-300 ${lifted ? 'opacity-100' : 'opacity-0'}`}>
                {isWinner ? '🏆' : ''}
              </span>
              {/* Cup */}
              <div
                className={`trile-cup transition-transform duration-300 ${lifted ? '-translate-y-12' : ''} ${phase === 'picking' ? 'group-hover:-translate-y-2' : ''} ${
                  phase === 'revealed' && cupId === pickedCup ? (won ? 'ring-cup-win' : 'ring-cup-lose') : ''
                }`}
              />
            </button>
          );
        })}
      </div>

      {phase === 'revealed' && (
        <div className="text-center pt-1 animate-fadeIn">
          <div className={`text-2xl font-black mb-4 ${won ? 'text-[#22E748]' : 'text-red-400'}`}>
            {won ? '🏆 ¡La encontraste!' : '💨 Vaso vacío'}
          </div>
          <button onClick={() => onResult?.(won)} className="btn-primary w-full">
            {continueLabel}
          </button>
        </div>
      )}
    </div>
  );
}
