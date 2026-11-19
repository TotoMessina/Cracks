import React from 'react';
import { RELAPSE_CHANCE } from '../game/career';
import { sound } from '../utils/audio';

/** Mid-season injury: rush back (risk of relapse) or a full recovery. */
export default function InjuryModal({ injury, resolved, onChoose, onContinue }) {
  const relapse = Math.round((RELAPSE_CHANCE[injury.type] ?? 0.3) * 100);
  const quickMissed = injury.missedMatches - Math.round(injury.missedMatches * 0.5);
  const done = resolved?.injury;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Lesión">
      <div className="mg-card w-full max-w-md space-y-3 animate-pop">
        <div className="text-center">
          <div className="text-4xl">🤕</div>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-300">Lesión en plena temporada</span>
          <h2 className="text-lg font-black text-white leading-tight mt-1">{injury.name}</h2>
          <p className="text-xs text-gray-400 mt-1">{injury.desc} El médico dice: <strong className="text-white">{injury.missedMatches} fechas afuera</strong>.</p>
        </div>

        {!done ? (
          <div className="space-y-2">
            <button
              onClick={() => { sound.playClick(); onChoose('quick'); }}
              className="w-full text-left p-3 rounded-xl border border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-all"
            >
              <span className="text-sm font-black text-amber-200 block">⚡ Recuperación rápida</span>
              <span className="text-[11px] text-gray-300 block mt-0.5">
                Volvés en ~{quickMissed} fechas. <strong className="text-red-300">{relapse}% de recaída</strong>: más fechas afuera y −2 de resistencia para siempre.
              </span>
            </button>
            <button
              onClick={() => { sound.playClick(); onChoose('full'); }}
              className="w-full text-left p-3 rounded-xl border border-[#22E748]/40 bg-[#22E748]/5 hover:bg-[#22E748]/10 cursor-pointer transition-all"
            >
              <span className="text-sm font-black text-[#22E748] block">🛌 Recuperación completa</span>
              <span className="text-[11px] text-gray-300 block mt-0.5">
                Te perdés las {injury.missedMatches} fechas, pero volvés sin secuelas{injury.statImpact ? ' (evitás perder resistencia)' : ''}.
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <p className={`text-sm font-bold p-3 rounded-xl border ${done.relapse ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-[#22E748]/40 bg-[#22E748]/10 text-[#22E748]'}`}>
              {done.relapse ? '😖 ' : '💪 '}{done.outcome}
            </p>
            <button onClick={onContinue} className="btn-primary w-full">Seguir la temporada ➔</button>
          </div>
        )}
      </div>
    </div>
  );
}
