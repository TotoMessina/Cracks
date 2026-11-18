import React, { useState } from 'react';
import { sound } from '../utils/audio';
import {
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: "1. Pretemporada: tu entrenamiento",
    tag: "El arranque del año",
    icon: "🃏",
    color: "from-emerald-500/20 to-[#22E748]/10 border-[#22E748]/40",
    bullets: [
      "Cada año elegís 1 de 3 cartas de entrenamiento que suben tus atributos, tu forma o tu idolatría.",
      "🪙 5 para cambiar las cartas y 🪙 15 para quedarte con 2 en vez de 1.",
      "Antes de jugar podés gastar monedas en ventaja para la final, concentración o fisio."
    ]
  },
  {
    step: 2,
    title: "2. La temporada y las finales",
    tag: "En la cancha",
    icon: "⚽",
    color: "from-amber-500/20 to-yellow-500/10 border-yellow-500/40",
    bullets: [
      "Cada año jugás 1 o 2 partidos clave (el clásico, una noche de copa o la Selección): ganarlos suma idolatría y te acerca a la final.",
      "Si llegás a una final, se define al mejor de 3 jugadas: penales, tiros libres, cabezazos, atajadas o el trile.",
      "Practicá los minijuegos en la pestaña Entrenar: cada acierto paga 🪙 2 (hasta 3 por temporada)."
    ]
  },
  {
    step: 3,
    title: "3. El receso: dilemas y pases",
    tag: "Decisiones",
    icon: "🎭",
    color: "from-blue-500/20 to-indigo-500/10 border-blue-500/40",
    bullets: [
      "Después de cada temporada viene un dilema: tus decisiones mueven atributos, idolatría, fama y vestuario.",
      "En el mercado de pases renovás o te vas. El sueldo que firmás es lo que cobrás cada año.",
      "¡Ojo! Firmar con el clásico rival deja tu idolatría en cero y te marca como traidor."
    ]
  },
  {
    step: 4,
    title: "4. Crecer, la estatua y el retiro",
    tag: "La inmortalidad",
    icon: "🗽",
    color: "from-yellow-500/20 to-amber-500/10 border-amber-400/50",
    bullets: [
      "De pibe mejorás rápido; desde los 31 empieza el declive. Invertí en la tienda para estirar tu carrera.",
      "La estatua llega con 95 de idolatría y al menos 5 temporadas en el mismo club.",
      "Te retirás a los 38 (o antes, desde los 32). Entrás al Salón de la Fama y podés seguir como DT."
    ]
  }
];

export default function InteractiveTutorialModal({ onClose }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const step = TUTORIAL_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    sound.playClick();
    if (isLast) {
      try { localStorage.setItem('el_idolo_tutorial_seen_v1', 'true'); } catch { /* ignore */ }
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    sound.playClick();
    if (!isFirst) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial Rápido Interactivo"
    >
      <div className="bg-[#0a120e] border-2 border-[#22E748]/50 rounded-3xl max-w-xl w-full flex flex-col shadow-[0_0_50px_rgba(34,231,72,0.2)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#22E748] flex items-center justify-center text-black font-black">
              📖
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#22E748] bg-[#22E748]/10 px-2 py-0.5 rounded">
                Guía Rápida Interactiva
              </span>
              <h3 className="text-base font-black text-white">
                Cómo Triunfar en El Ídolo
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              try { localStorage.setItem('el_idolo_tutorial_seen_v1', 'true'); } catch { /* ignore */ }
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step dots */}
        <div className="px-5 pt-4 flex items-center justify-center space-x-2">
          {TUTORIAL_STEPS.map((s, idx) => (
            <div
              key={s.step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'w-8 bg-[#22E748]'
                  : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Body Card */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className={`p-5 rounded-2xl bg-gradient-to-br ${step.color} border shadow-lg relative overflow-hidden`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 block">
                  {step.tag}
                </span>
                <h4 className="text-lg font-black text-white mt-1">
                  {step.title}
                </h4>
              </div>
              <div className="text-4xl filter drop-shadow-md">{step.icon}</div>
            </div>

            <div className="mt-4 space-y-2.5">
              {step.bullets.map((b, i) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-gray-200">
                  <span className="text-[#22E748] font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
              isFirst ? 'opacity-30 cursor-not-allowed text-gray-600' : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <span className="text-xs font-mono font-bold text-gray-500">
            {currentStepIndex + 1} de {TUTORIAL_STEPS.length}
          </span>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-gradient-to-r from-[#22E748] to-[#16a34a] text-black font-black text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>{isLast ? "¡A Jugar!" : "Siguiente"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
