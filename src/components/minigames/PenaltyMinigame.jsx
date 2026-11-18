import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { useOscillator, clamp } from './useOscillator';

const PERIOD = { normal: 1500, medium: 1200, hard: 950 };
const AIM_X = { left: '22%', center: '50%', right: '78%' };

export default function PenaltyMinigame({
  title = "Definición por penales",
  strikerName = "El 9",
  onResult,
  bonus = 0,
  playerStat = 75,
  difficulty = 'normal',
  continueLabel = 'Continuar ➔',
}) {
  const [gameState, setGameState] = useState('aiming'); // aiming, shot, finished
  const [aimDirection, setAimDirection] = useState(null);
  const [keeperDive, setKeeperDive] = useState(null);
  const [isGoal, setIsGoal] = useState(false);
  const [commentary, setCommentary] = useState(`${strikerName} acomoda la pelota. Elegí palo en el momento justo: el disparo sale cuando tocás.`);
  const timeoutRef = useRef(null);

  const [meterPos, meterRef] = useOscillator(gameState === 'aiming', PERIOD[difficulty] || PERIOD.normal);
  const tolerance = Math.round(clamp(10 + (playerStat - 60) * 0.15 + Math.min(10, bonus * 0.5), 7, 26));

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleShoot = (aim) => {
    if (gameState !== 'aiming') return;
    const pos = meterRef.current;
    setAimDirection(aim);
    setGameState('shot');
    sound.playKick();

    const dist = Math.abs(pos - 50);
    const perfect = dist <= tolerance * 0.5;
    const good = dist <= tolerance;
    const wild = dist > tolerance * 2.2;

    const r = Math.random();
    const keeperChoice = r < 0.4 ? 'left' : r < 0.8 ? 'right' : 'center';
    setKeeperDive(keeperChoice);
    const guessed = keeperChoice === aim;

    timeoutRef.current = setTimeout(() => {
      let scored = false;
      let text;
      if (wild) {
        text = '¡SE FUE A LAS NUBES! Le entró mal y la pelota terminó en la tribuna.';
      } else if (!good) {
        if (!guessed && Math.random() < 0.35) {
          scored = true;
          text = '¡GOL! Le pegó mordida pero el arquero se tiró al otro lado. ¡Vale igual!';
        } else if (guessed) {
          text = '¡ATAJÓ! Remate sin fuerza y el arquero lo leyó perfecto.';
        } else {
          text = '¡PALO! Tiro impreciso que se estrelló en el poste.';
        }
      } else if (guessed) {
        const chance = perfect ? 0.6 : 0.3;
        if (Math.random() < chance) {
          scored = true;
          text = '¡GOOOL! El arquero adivinó, pero el remate fue tan esquinado que no llegó.';
        } else {
          text = '¡VOLÓ EL ARQUERO! Adivinó el palo y la sacó con la punta de los dedos.';
        }
      } else {
        scored = Math.random() < 0.96;
        text = scored
          ? '¡GOOOOOLAZO! Lo mandaste al otro palo. ¡Delirio total!'
          : '¡Increíble! Con el arco vacío se le fue apenas desviada.';
      }

      setCommentary(text);
      setIsGoal(scored);
      setGameState('finished');
      if (scored) {
        sound.playGoal();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } else {
        sound.playCrowdGasp();
        sound.playBuzzer();
      }
    }, 750);
  };

  const shootRef = useRef(handleShoot);
  useEffect(() => { shootRef.current = handleShoot; });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); shootRef.current('left'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); shootRef.current('right'); }
      else if (e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); shootRef.current('center'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const keeperX = keeperDive === 'left' ? '26%' : keeperDive === 'right' ? '74%' : '50%';
  const keeperRot = keeperDive === 'left' ? -70 : keeperDive === 'right' ? 70 : 0;
  const shot = gameState !== 'aiming';

  return (
    <div className="mg-card">
      <div className="text-center mb-4">
        <span className="mg-badge text-[#22E748] bg-[#22E748]/10 border-[#22E748]/30">Penal decisivo</span>
        <h3 className="text-lg sm:text-xl font-black mt-2 tracking-tight text-white">{title}</h3>
        <p className="text-sm text-gray-300 mt-1 min-h-[40px]">{commentary}</p>
      </div>

      {/* Goal scene */}
      <div className="pitch-scene relative h-56 rounded-2xl overflow-hidden mb-5">
        <div className="absolute left-[8%] right-[8%] top-5 h-36 goal-frame">
          <div className="absolute inset-0 goal-net" />
          {['left', 'center', 'right'].map((zone, i) => (
            <div
              key={zone}
              className={`absolute top-0 bottom-0 transition-colors ${aimDirection === zone ? 'bg-[#22E748]/15' : ''}`}
              style={{ left: `${i * 33.33}%`, width: '33.33%' }}
            />
          ))}
          {/* Keeper */}
          <div
            className="absolute bottom-0 transition-all duration-500 ease-out"
            style={{ left: keeperX, transform: `translateX(-50%) rotate(${keeperRot}deg)`, transformOrigin: 'bottom center' }}
          >
            <Keeper />
          </div>
        </div>

        {/* Ball */}
        <div
          className="absolute transition-all ease-out text-2xl select-none"
          style={{
            transitionDuration: shot ? '650ms' : '0ms',
            left: shot ? AIM_X[aimDirection] : '50%',
            bottom: shot ? (isGoal || gameState === 'shot' ? '120px' : '150px') : '14px',
            transform: `translateX(-50%) scale(${shot ? 0.7 : 1})`,
          }}
        >
          ⚽
        </div>
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {gameState === 'aiming' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400">
            <span>Timing del remate</span>
            <span className="text-[#22E748]">Zona verde ±{tolerance}</span>
          </div>
          <div className="meter">
            <div className="meter-sweet" style={{ left: `${50 - tolerance}%`, width: `${tolerance * 2}%` }} />
            <div className="meter-perfect" style={{ left: `${50 - tolerance / 2}%`, width: `${tolerance}%` }} />
            <div className="meter-needle" style={{ left: `${meterPos}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'left', label: '⬅️ Palo izq.' },
              { id: 'center', label: '⬆️ Al medio' },
              { id: 'right', label: 'Palo der. ➡️' },
            ].map(b => (
              <button key={b.id} onClick={() => handleShoot(b.id)} className="mg-btn">
                {b.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 text-center font-mono">
            Teclado: ← / → palos · ↑ o Espacio al medio
          </p>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="text-center pt-1 animate-fadeIn">
          <div className={`text-2xl font-black mb-4 ${isGoal ? 'text-[#22E748]' : 'text-red-400'}`}>
            {isGoal ? '⚽ ¡GOOOL!' : '💔 No entró'}
          </div>
          <button onClick={() => onResult?.(isGoal)} className="btn-primary w-full">
            {continueLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function Keeper() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-5 h-5 rounded-full bg-amber-200 border border-black/40" />
      <div className="relative w-9 h-10 bg-yellow-400 border border-black/50 rounded-md flex items-center justify-center text-[10px] font-black text-black">
        1
        <span className="absolute -left-3 top-0 text-sm">🧤</span>
        <span className="absolute -right-3 top-0 text-sm">🧤</span>
      </div>
      <div className="flex gap-1">
        <div className="w-2.5 h-5 bg-gray-900 rounded-b" />
        <div className="w-2.5 h-5 bg-gray-900 rounded-b" />
      </div>
    </div>
  );
}
