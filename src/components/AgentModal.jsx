import React from 'react';
import { X } from 'lucide-react';
import { AGENTS, getAgent, canChangeAgent } from '../game/agents';
import { sound } from '../utils/audio';

/** Pick who negotiates for you (once per season, between seasons). */
export default function AgentModal({ player, onChoose, onClose }) {
  const current = getAgent(player);
  const canChange = canChangeAgent(player);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Tu representante" onClick={onClose}>
      <div className="sheet animate-slideUp space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#22E748]">Tu representante</span>
            <h2 className="text-lg font-black text-white leading-tight">{current.icon} {current.name}</h2>
            <p className="text-[11px] text-gray-400">
              Se lleva el {Math.round(current.commission * 100)}% de tu sueldo, primas y primas por firma.
              {!canChange && ' Ya cambiaste de representante esta temporada (o la temporada está en juego).'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 cursor-pointer" aria-label="Cerrar"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-2">
          {Object.values(AGENTS).map(a => {
            const active = a.id === current.id;
            return (
              <button
                key={a.id}
                disabled={active || !canChange}
                onClick={() => { sound.playClick(); onChoose(a.id); }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  active ? 'border-[#22E748] bg-[#14261b]' : canChange ? 'border-white/10 bg-[#0e1712] hover:border-white/30 cursor-pointer' : 'border-white/5 bg-black/20 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-white">{a.icon} {a.short}</span>
                  <span className={`text-xs font-mono font-black ${a.commission >= 0.15 ? 'text-red-300' : a.commission >= 0.1 ? 'text-amber-300' : 'text-[#22E748]'}`}>
                    {Math.round(a.commission * 100)}% comisión
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 block">{a.name}</span>
                <span className="text-[11px] text-gray-300 block mt-1 leading-snug">{a.desc}</span>
                {active && <span className="text-[10px] font-black uppercase text-[#22E748] block mt-1">Es tu representante</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
