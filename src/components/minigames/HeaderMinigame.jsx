import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Target } from 'lucide-react';

export default function HeaderMinigame({
  title = "Final del Campeonato - Córner en el Minuto 93",
  strikerName = "El 9",
  onResult,
  bonus = 0,
  playerStat = 75, // potencia or definicion
  difficulty = 'medium',
  continueLabel = 'Continuar ➔',
}) {
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'cross_in_flight', 'headed', 'finished'
  const [headerDirection, setHeaderDirection] = useState('pique_al_suelo'); // 'segundo_palo', 'pique_al_suelo', 'primer_palo'
  const [ballProgress, setBallProgress] = useState(0); // 0 to 100 (cross flight)
  const [isGoal, setIsGoal] = useState(false);
  const [hitWoodwork, setHitWoodwork] = useState(false);
  const [commentary, setCommentary] = useState("Viene el centro envenenado desde la esquina. Elegí el destino del frentazo y presioná '¡SALTAR!' cuando la pelota alcance el punto justo.");

  // Difficulty speed & timing window
  const crossSpeed = difficulty === 'hard' ? 14 : difficulty === 'medium' ? 18 : 22;
  const sweetSpotMin = 50 - Math.round((playerStat - 60) * 0.15) - Math.min(8, Math.round(bonus * 0.8));
  const sweetSpotMax = 68 + Math.round((playerStat - 60) * 0.15) + Math.min(8, Math.round(bonus * 0.8));

  const handleTimeExpired = () => {
    setGameState('finished');
    sound.playBuzzer();
    setCommentary("¡LLEGASTE TARDE AL SALTO! El central rival despejó el centro con comodidad.");
    setIsGoal(false);
  };

  // Cross flight animation
  useEffect(() => {
    if (gameState !== 'cross_in_flight') return;

    const interval = setInterval(() => {
      setBallProgress(prev => Math.min(100, prev + 2));
    }, crossSpeed);

    return () => clearInterval(interval);
  }, [gameState, crossSpeed]);

  // Ball arrived without jumping -> defender clears it
  useEffect(() => {
    if (gameState === 'cross_in_flight' && ballProgress >= 100) {
      handleTimeExpired();
    }
  }, [ballProgress, gameState]);

  const handleStartCross = () => {
    sound.playWhistle();
    setGameState('cross_in_flight');
    setBallProgress(0);
    setCommentary("¡Sale el centro con rosca hacia el punto penal! ¡Calibrá el salto!");
  };



  const handleJumpAndHead = () => {
    if (gameState !== 'cross_in_flight') return;
    setGameState('headed');
    sound.playKick();

    const jumpPoint = ballProgress;

    // Keeper dive choice
    const keeperOptions = ['primer_palo', 'pique_al_suelo', 'segundo_palo'];
    const keeperDive = keeperOptions[Math.floor(Math.random() * keeperOptions.length)];

    setTimeout(() => {
      let scored = false;

      if (jumpPoint < sweetSpotMin) {
        // Jumped too early
        setCommentary("¡SALTÓ MUY TEMPRANO! La pelota le quedó atrás y el cabezazo se fue débil por arriba del travesaño.");
        sound.playBuzzer();
      } else if (jumpPoint > sweetSpotMax) {
        // Jumped too late
        setCommentary("¡ANTICIPÓ EL DEFENSOR! El zaguero le ganó la posición con el cuerpo y rechazó de cabeza.");
        sound.playBuzzer();
      } else {
        // Perfect timing
        if (keeperDive === headerDirection) {
          // Keeper guessed corner
          if (Math.random() < 0.3 + Math.max(0, playerStat - 70) * 0.01) {
            scored = true;
            setCommentary("¡CABEZAZO LETAL! El arquero adivinó la intención pero el frentazo fue tan fuerte que le venció las manos. ¡GOOOOOOL!");
          } else if (Math.random() < 0.4) {
            setHitWoodwork(true);
            sound.playWoodwork();
            setCommentary("¡CLANK! ¡El frentazo reventó el travesaño con un ruido seco estremecedor!");
          } else {
            sound.playCrowdGasp();
            sound.playBuzzer();
            setCommentary("¡MANOTAZO MILAGROSO DEL ARQUERO! Sacó la pelota en la línea de gol con reflejos felinos.");
          }
        } else {
          // Keeper wrong footed
          if (Math.random() < 0.08) {
            setHitWoodwork(true);
            sound.playWoodwork();
            setCommentary("¡PALO Y AFUERA! El cabezazo cruzado se estrelló en la base del vertical.");
          } else {
            scored = true;
            setCommentary("¡GOOOOOOOOOOLAZO AGÓNICO DE CABEZA! Se suspendió en el aire y la clavó abajo contra el palo. ¡DELIRIO EN LA POPULAR!");
          }
        }
      }

      setIsGoal(scored);
      setGameState('finished');

      if (scored) {
        sound.playGoal();
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 }
        });
      }
    }, 750);
  };

  const handleStartCrossRef = useRef(handleStartCross);
  const handleJumpAndHeadRef = useRef(handleJumpAndHead);
  useEffect(() => {
    handleStartCrossRef.current = handleStartCross;
    handleJumpAndHeadRef.current = handleJumpAndHead;
  });

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'waiting' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        if (handleStartCrossRef.current) handleStartCrossRef.current();
      } else if (gameState === 'cross_in_flight') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (handleJumpAndHeadRef.current) handleJumpAndHeadRef.current();
        } else if (e.key === '1') {
          setHeaderDirection('primer_palo');
        } else if (e.key === '2') {
          setHeaderDirection('pique_al_suelo');
        } else if (e.key === '3') {
          setHeaderDirection('segundo_palo');
        }
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
          Cabezazo de Área en la Agonía
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Cabeceador: <strong className="text-white">{strikerName}</strong> • Potencia de Salto: <strong className="text-[#22E748]">{playerStat}</strong>
        </p>
      </div>

      {/* Visual Aerial Box Arena */}
      <div className="my-6 relative bg-gradient-to-b from-[#0a2012] to-[#051109] rounded-2xl p-6 border border-emerald-500/20 shadow-inner overflow-hidden flex flex-col items-center">
        {/* Goal Net */}
        <div className={`w-full max-w-md h-32 border-t-8 border-x-8 border-white rounded-t-lg relative bg-black/40 shadow-2xl transition-transform duration-300 ${isGoal ? 'animate-bounce' : ''}`}>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:12px_12px]" />

          {hitWoodwork && (
            <div className="absolute top-0 inset-x-0 h-3 bg-yellow-400 animate-ping opacity-75" />
          )}

          {/* Goalkeeper */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-16 flex flex-col items-center justify-end">
            <div className="w-5 h-5 rounded-full bg-amber-200 border border-black" />
            <div className="w-8 h-9 bg-yellow-400 border border-black rounded-sm flex items-center justify-center font-bold text-[9px] text-black">
              1
            </div>
            <div className="flex space-x-1 mt-0.5">
              <div className="w-2 h-4 bg-black" />
              <div className="w-2 h-4 bg-black" />
            </div>
          </div>
        </div>

        {/* Penalty Area Grass & Players Aerial Duel */}
        <div className="w-full mt-4 flex items-end justify-center relative min-h-[100px]">
          {/* Opposing Defender */}
          <div className={`flex flex-col items-center transition-transform duration-300 mx-2 ${gameState === 'headed' ? '-translate-y-4' : ''}`}>
            <div className="w-5 h-5 rounded-full bg-slate-300 border border-black" />
            <div className="w-9 h-11 bg-slate-700 border border-black rounded-sm flex items-center justify-center text-[10px] font-bold text-white">
              2
            </div>
            <div className="flex space-x-1 mt-0.5">
              <div className="w-2 h-5 bg-black" />
              <div className="w-2 h-5 bg-black" />
            </div>
          </div>

          {/* Striker (Player) jumping */}
          <div
            className={`flex flex-col items-center transition-transform duration-300 mx-2 ${
              gameState === 'headed' ? '-translate-y-12 scale-110' : ''
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-amber-200 border border-black shadow" />
            <div className="w-9 h-11 bg-[#22E748] border border-black rounded-sm flex items-center justify-center font-black text-[10px] text-black shadow-md">
              9
            </div>
            <div className="flex space-x-1 mt-0.5">
              <div className="w-2 h-5 bg-black" />
              <div className="w-2 h-5 bg-black" />
            </div>
          </div>

          {/* Ball in Flight along the arc */}
          {gameState === 'cross_in_flight' && (
            <div
              className="absolute text-xl select-none transition-all pointer-events-none drop-shadow-[0_0_8px_#22E748]"
              style={{
                left: `${ballProgress}%`,
                bottom: `${Math.sin((ballProgress / 100) * Math.PI) * 75 + 15}px`
              }}
            >
              ⚽
            </div>
          )}

          {gameState === 'headed' && (
            <div
              className={`absolute text-xl select-none transition-all duration-500 ${
                isGoal ? 'bottom-28 left-1/2 -translate-x-1/2 scale-75' : 'bottom-16 left-1/3'
              }`}
            >
              ⚽
            </div>
          )}
        </div>

        {/* Flight Progress Bar */}
        <div className="w-full max-w-md mt-4">
          <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
            <span>Córner al área</span>
            <span className="text-[#22E748] font-bold">Zona de Impacto Óptimo (Verde)</span>
            <span>Arco</span>
          </div>

          <div className="w-full h-4 bg-black/60 rounded-full border border-white/20 relative overflow-hidden">
            {/* Green Sweet Spot Zone */}
            <div
              className="absolute top-0 bottom-0 bg-[#22E748]/60 border-x border-[#22E748]"
              style={{
                left: `${sweetSpotMin}%`,
                width: `${sweetSpotMax - sweetSpotMin}%`
              }}
            />

            {/* Flight progress indicator */}
            <div
              className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-[0_0_8px_#fff]"
              style={{ left: `${ballProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Direction & Action Controls */}
      {gameState === 'waiting' && (
        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 block mb-1.5 text-center">
              1. Elegí dónde colocar el frentazo
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'primer_palo', label: 'Anticipo al 1er Palo', desc: 'Desvío violento' },
                { id: 'pique_al_suelo', label: 'Pique al Suelo', desc: 'Complica al arquero' },
                { id: 'segundo_palo', label: 'Cruzado al 2do Palo', desc: 'Bombeado inalcanzable' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    sound.playClick();
                    setHeaderDirection(opt.id);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    headerDirection === opt.id
                      ? 'bg-[#22E748] text-black border-[#22E748] shadow-md font-black'
                      : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/30'
                  }`}
                >
                  <span className="block truncate">{opt.label}</span>
                  <span className="text-[9px] text-gray-400 block truncate">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartCross}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#22E748] to-[#15803d] text-black font-black text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(34,231,72,0.35)] hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>¡Lanzar Centro al Área!</span>
          </button>
        </div>
      )}

      {gameState === 'cross_in_flight' && (
        <div className="text-center py-2">
          <button
            onClick={handleJumpAndHead}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-base tracking-wider uppercase shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition-all cursor-pointer animate-pulse"
          >
            ⚡ ¡SALTAR Y CABECEAR AHORA! ⚡
          </button>
        </div>
      )}

      {/* Commentary & Result */}
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