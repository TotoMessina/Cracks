import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Target, Zap, Sparkles } from 'lucide-react';
import { useOscillator, clamp } from './useOscillator';

const PERIOD = { normal: 1500, medium: 1200, hard: 950 };
const CURVES = {
  rosca: { tol: 0, savedChance: [0.6, 0.3], fooled: 0 },
  seco: { tol: -3, savedChance: [0.7, 0.45], fooled: 0 },
  tres_dedos: { tol: -1, savedChance: [0.55, 0.25], fooled: 0.5 },
};

export default function FreeKickMinigame({
  title = "Final del Campeonato - Tiro Libre al Minuto 90",
  strikerName = "El 10",
  onResult,
  bonus = 0,
  playerStat = 75, // pegada or definicion
  difficulty = 'medium', // 'normal', 'medium', 'hard'
  continueLabel = 'Continuar ➔',
}) {
  const [gameState, setGameState] = useState('aiming'); // aiming, shot, finished
  const [aimTarget, setAimTarget] = useState('top-right'); // 'top-left', 'center-top', 'top-right', 'under-wall'
  const [curveType, setCurveType] = useState('rosca'); // 'rosca', 'seco', 'tres_dedos'
  const [wallJumped, setWallJumped] = useState(false);
  const [keeperDive, setKeeperDive] = useState(null);
  const [isGoal, setIsGoal] = useState(false);
  const [hitWoodwork, setHitWoodwork] = useState(false);
  const [commentary, setCommentary] = useState(`${strikerName} acomoda la redonda sobre el césped. Elegí el ángulo, la rosca y calibrá la potencia exacta sobre la barrera.`);

  const curve = CURVES[curveType] || CURVES.rosca;
  const tolerance = Math.round(clamp(
    (difficulty === 'hard' ? 9 : difficulty === 'medium' ? 11 : 13)
    + (playerStat - 60) * 0.12
    + Math.min(10, bonus * 0.5)
    + curve.tol,
    5, 26));

  const [meterPos, meterRef] = useOscillator(gameState === 'aiming', PERIOD[difficulty] || PERIOD.medium);
  const timeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleExecuteKick = () => {
    if (gameState !== 'aiming') return;
    setGameState('shot');
    sound.playKick();

    // Wall jumps with 80% probability
    const wallJumps = Math.random() < 0.7;
    setWallJumped(wallJumps);

    // Keeper dive choice (the "tres dedos" curve fools him more often)
    const diveOptions = ['top-left', 'center-top', 'top-right', 'under-wall'];
    let keeperChoice = diveOptions[Math.floor(Math.random() * diveOptions.length)];
    if (keeperChoice === aimTarget && Math.random() < curve.fooled) {
      keeperChoice = diveOptions.filter(d => d !== aimTarget)[Math.floor(Math.random() * 3)];
    }
    setKeeperDive(keeperChoice);

    const meterPos = meterRef.current;
    const distFromCenter = Math.abs(meterPos - 50);
    const perfectTiming = distFromCenter <= Math.round(tolerance * 0.5);
    const goodTiming = distFromCenter <= tolerance;

    timeoutRef.current = setTimeout(() => {
      let scored = false;

      // Special case: under-wall shot
      if (aimTarget === 'under-wall') {
        if (wallJumps && goodTiming && keeperChoice === 'under-wall') {
          sound.playBuzzer();
          setCommentary("¡El arquero lo leyó! Se quedó abajo y contuvo el remate rasante.");
        } else if (wallJumps && goodTiming) {
          scored = true;
          setCommentary("¡GOLAZO HISTÓRICO A LO RONALDINHO! La barrera saltó en bloque y la pelota pasó mansa y rasante contra el palo.");
        } else if (!wallJumps) {
          setCommentary("¡LA BARRERA NO SALTÓ! El remate por abajo se estrelló en los botines de los defensores.");
          sound.playBuzzer();
        } else {
          setCommentary("¡Tiro mordido sin fuerza! El arquero caminó hasta el palo y la atrapó.");
          sound.playBuzzer();
        }
      } else {
        // High shots over the wall
        if (!goodTiming) {
          if (meterPos > 80 || meterPos < 20) {
            setCommentary("¡A LA TRIBUNA! Le dio con demasiada potencia y la pelota se fue por arriba del estadio.");
            sound.playBuzzer();
          } else {
            setCommentary("¡EN LA BARRERA! El tiro no tomó suficiente altura y rebotó en la cabeza de los defensores.");
            sound.playBuzzer();
          }
        } else {
          // Good or perfect timing
          if (keeperChoice === aimTarget) {
            if (Math.random() < (perfectTiming ? curve.savedChance[0] : curve.savedChance[1])) {
              scored = true;
              setCommentary("¡AL ÁNGULO INALCANZABLE! Voló el arquero con todo el cuerpo pero el chanfle fue tan preciso que se coló pegada al poste.");
            } else if (Math.random() < 0.4) {
              setHitWoodwork(true);
              sound.playWoodwork();
              setCommentary("¡CLAAANK! ¡El tiro libre reventó el ángulo y sacudió todo el arco! ¡Uhhhh en las tribunas!");
            } else {
              sound.playCrowdGasp();
              sound.playBuzzer();
              setCommentary("¡TAPADA MONUMENTAL! El arquero adivinó el palo y la manoteó al córner con la uña.");
            }
          } else {
            // Keeper guessed wrong
            if (Math.random() < 0.08) {
              setHitWoodwork(true);
              sound.playWoodwork();
              setCommentary("¡CLANK! ¡El remate con comba dio en el travesaño y picó en la línea!");
            } else {
              scored = true;
              setCommentary("¡GOOOOOOOOOOLAZO DE TIRO LIBRE! La pelota superó la barrera con un efecto endiablado y se clavó en la ratonera.");
            }
          }
        }
      }

      setIsGoal(scored);
      setGameState('finished');

      if (scored) {
        sound.playGoal();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }, 850);
  };

  const handleExecuteKickRef = useRef(handleExecuteKick);
  useEffect(() => {
    handleExecuteKickRef.current = handleExecuteKick;
  });

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'aiming' || !handleExecuteKickRef.current) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleExecuteKickRef.current();
      } else if (e.key === '1') {
        setCurveType('rosca');
      } else if (e.key === '2') {
        setCurveType('seco');
      } else if (e.key === '3') {
        setCurveType('tres_dedos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="mg-card">
      {/* Top Header */}
      <div className="border-b border-white/10 pb-4 text-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#22E748] bg-[#22E748]/10 px-3 py-1 rounded-full border border-[#22E748]/20 inline-flex items-center space-x-1">
          <Target className="w-3.5 h-3.5 mr-1" />
          <span>{title}</span>
        </span>
        <h3 className="text-xl md:text-2xl font-black mt-2 tracking-tight text-white">
          Tiro Libre al Borde del Área
        </h3>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          Pateador: <strong className="text-white">{strikerName}</strong> • Pegada: <strong className="text-[#22E748]">{playerStat}</strong>
        </p>
      </div>

      {/* Main Pitch & Goal Arena */}
      <div className="my-6 relative bg-gradient-to-b from-[#0a2012] to-[#06140b] rounded-2xl p-6 border border-emerald-500/20 shadow-inner overflow-hidden flex flex-col items-center">
        {/* Stadium light aura */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#22E748]/10 to-transparent pointer-events-none" />

        {/* Goal Frame */}
        <div className={`w-full max-w-md h-36 border-t-8 border-x-8 border-white rounded-t-lg relative bg-black/40 shadow-2xl transition-transform duration-300 ${isGoal ? 'animate-bounce' : ''}`}>
          {/* Net Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:12px_12px]" />

          {/* Crossbar Woodwork Flash */}
          {hitWoodwork && (
            <div className="absolute top-0 inset-x-0 h-3 bg-yellow-400 animate-ping opacity-75" />
          )}

          {/* Goalkeeper in goal */}
          <div
            className={`absolute bottom-0 w-12 h-20 transition-all duration-500 flex flex-col items-center justify-end ${
              gameState === 'aiming'
                ? 'left-1/2 -translate-x-1/2'
                : keeperDive === 'top-left'
                ? 'left-4 -translate-y-6 rotate-[-35deg]'
                : keeperDive === 'top-right'
                ? 'right-4 -translate-y-6 rotate-[35deg]'
                : keeperDive === 'under-wall'
                ? 'left-1/2 -translate-x-1/2 translate-y-2'
                : 'left-1/2 -translate-x-1/2 -translate-y-8'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-amber-300 border border-black shadow" />
            <div className="w-9 h-11 bg-yellow-400 border border-black rounded-md flex items-center justify-center font-black text-[10px] text-black">
              1
            </div>
            <div className="flex space-x-1 mt-0.5">
              <div className="w-2.5 h-6 bg-black rounded-b" />
              <div className="w-2.5 h-6 bg-black rounded-b" />
            </div>
          </div>

          {/* Aim Target Indicators in Goal */}
          {gameState === 'aiming' && (
            <>
              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-black border transition-all ${aimTarget === 'top-left' ? 'bg-[#22E748] text-black border-[#22E748] scale-105' : 'bg-black/60 text-gray-400 border-white/20'}`}>
                Ángulo Izq
              </div>
              <div className={`absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-black border transition-all ${aimTarget === 'center-top' ? 'bg-[#22E748] text-black border-[#22E748] scale-105' : 'bg-black/60 text-gray-400 border-white/20'}`}>
                Al Medio Alto
              </div>
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-black border transition-all ${aimTarget === 'top-right' ? 'bg-[#22E748] text-black border-[#22E748] scale-105' : 'bg-black/60 text-gray-400 border-white/20'}`}>
                Ángulo Der
              </div>
            </>
          )}
        </div>

        {/* Pitch grass line */}
        <div className="w-full h-1 bg-white/20 my-2" />

        {/* Defensive Wall */}
        <div className="my-2 relative flex items-end justify-center space-x-1">
          <div className="text-[10px] uppercase font-bold text-gray-500 absolute -top-4">
            Barrera Rival
          </div>
          {[1, 2, 3, 4].map((def) => (
            <div
              key={def}
              className={`w-9 h-18 bg-[#1e293b] border border-white/20 rounded-t-lg flex flex-col items-center justify-between p-1 transition-transform duration-300 ${
                wallJumped ? '-translate-y-5' : ''
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-amber-200 border border-black/40" />
              <div className="text-[9px] font-mono font-bold text-gray-300">#{def + 1}</div>
              <div className="w-full h-4 bg-sky-600 rounded-sm" />
            </div>
          ))}
        </div>

        {/* Ball on Pitch */}
        <div className="mt-4 flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center text-sm shadow-[0_5px_15px_rgba(0,0,0,0.8)] transition-all duration-700 select-none ${
              gameState === 'shot' || gameState === 'finished'
                ? isGoal
                  ? '-translate-y-36 scale-75 opacity-90'
                  : 'translate-y-[-40px] opacity-75'
                : 'hover:scale-110'
            }`}
          >
            ⚽
          </div>
          <div className="w-10 h-2 bg-black/50 rounded-full mt-1 blur-xs" />
        </div>
      </div>

      {/* Control Panel: Aim selection & Curva */}
      {gameState === 'aiming' && (
        <div className="space-y-4">
          {/* Aim Target Selectors */}
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 block mb-1.5 text-center">
              1. Elegí dónde colocar la pelota
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'top-left', label: 'Ángulo Izq', icon: '↖️' },
                { id: 'center-top', label: 'Sobre Barrera', icon: '⬆️' },
                { id: 'top-right', label: 'Ángulo Der', icon: '↗️' },
                { id: 'under-wall', label: 'Por Abajo', icon: '⬇️' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    sound.playClick();
                    setAimTarget(opt.id);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    aimTarget === opt.id
                      ? 'bg-[#22E748] text-black border-[#22E748] shadow-md font-black'
                      : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/30'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Curva / Comba Selection */}
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 block mb-1.5 text-center">
              2. Efecto y Comba
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'rosca', label: '[1] Rosca', desc: 'Equilibrada' },
                { id: 'seco', label: '[2] Fuerte seco', desc: 'Difícil, pero vence al arquero' },
                { id: 'tres_dedos', label: '[3] Tres dedos', desc: 'Engaña al arquero' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    sound.playClick();
                    setCurveType(c.id);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    curveType === c.id
                      ? 'bg-amber-400 text-black border-amber-400 font-black shadow-md'
                      : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/30'
                  }`}
                >
                  <span className="block truncate">{c.label}</span>
                  <span className="text-[9px] text-gray-400 block truncate">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Oscillating Power & Timing Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center space-x-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span>3. Calibrá la comba en la zona verde</span>
              </span>
              <span className="text-[10px] font-mono text-[#22E748]">
                Zona Verde: ±{tolerance}%
              </span>
            </div>

            <div className="meter">
              <div className="meter-sweet" style={{ left: `${50 - tolerance}%`, width: `${tolerance * 2}%` }} />
              <div className="meter-perfect" style={{ left: `${50 - tolerance / 2}%`, width: `${tolerance}%` }} />
              <div className="meter-needle" style={{ left: `${meterPos}%` }} />
            </div>
          </div>

          {/* Shoot Button */}
          <button
            onClick={handleExecuteKick}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#22E748] to-[#15803d] text-black font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(34,231,72,0.35)] hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>¡Patear Tiro Libre al Arco!</span>
          </button>
        </div>
      )}

      {/* Narrative Commentary & Finish Action */}
      <div className="mt-4 pt-3 border-t border-white/10 text-center">
        <p className={`text-xs md:text-sm font-bold min-h-[36px] flex items-center justify-center ${isGoal ? 'text-[#22E748] animate-pulse' : hitWoodwork ? 'text-yellow-400' : 'text-gray-300'}`}>
          {commentary}
        </p>

        {gameState === 'finished' && (
          <button
            onClick={() => onResult && onResult(isGoal)}
            className="mt-3 px-8 py-3 bg-white text-black hover:bg-gray-200 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
          >
            {continueLabel}
          </button>
        )}
      </div>
    </div>
  );
}