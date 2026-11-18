import React, { useState } from 'react';
import { Newspaper, CheckCircle2, Link2 } from 'lucide-react';
import { sound } from '../utils/audio';
import { describeEffects } from '../game/effects';
import { describeActions } from '../game/dilemmaEngine';

function EffectChips({ effects }) {
  if (!effects?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {effects.map((eff, i) => (
        <span
          key={`${eff.key}-${i}`}
          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
            eff.positive ? 'bg-[#22E748]/20 text-[#22E748] border-[#22E748]/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}
        >
          {eff.label}: {eff.text}
        </span>
      ))}
    </div>
  );
}

/**
 * Two modes:
 *  - choice: pick an option (shows stat effects + lasting consequences)
 *  - result: what actually happened (gambles, transfers, follow-ups)
 */
export default function DilemmaModal({ dilemma, onResolve, player = null, result = null, onContinue }) {
  const [chosenOption, setChosenOption] = useState(null);

  if (!dilemma && !result) return null;

  const handleSelect = (idx) => {
    sound.playClick();
    setChosenOption(idx);
    const opt = dilemma.options[idx];
    if (opt.effects?.idolatria < 0) sound.playBuzzer();
    else sound.playWhistle();
  };

  const handleConfirm = () => {
    if (chosenOption === null) return;
    onResolve(dilemma.options[chosenOption]);
  };

  const isFollowUp = Boolean(dilemma?.followUpOnly || result?.isFollowUp);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#0b130e] border border-amber-500/40 rounded-3xl max-w-xl w-full p-5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden max-h-[94vh] overflow-y-auto animate-pop">
        <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 text-amber-400 mb-3">
          {isFollowUp ? <Link2 className="w-5 h-5" /> : <Newspaper className="w-5 h-5" />}
          <span className="text-xs uppercase font-black tracking-widest">
            {result ? 'Consecuencias' : isFollowUp ? 'Lo que hiciste vuelve' : 'Dilema de la temporada'}
          </span>
        </div>

        {result ? (
          /* ---------- RESULT ---------- */
          <div className="space-y-4 relative">
            <h2 className="text-xl md:text-2xl font-black text-white leading-tight">{result.title}</h2>
            <p className="text-xs text-gray-400">Elegiste: <span className="text-gray-200 font-bold">{result.choice}</span></p>
            <p className="text-sm text-gray-200 leading-relaxed bg-[#101c14] border border-white/5 rounded-2xl p-4">{result.outcome}</p>
            <EffectChips effects={result.effects} />
            {result.consequences?.length > 0 && (
              <ul className="space-y-1.5">
                {result.consequences.map((c, i) => (
                  <li key={i} className="text-xs text-amber-100 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">{c}</li>
                ))}
              </ul>
            )}
            <button onClick={() => { sound.playClick(); onContinue(); }} className="btn-primary w-full">
              {result.transferredTo ? `Viajar a ${result.transferredTo.name} ➔` : 'Continuar ➔'}
            </button>
          </div>
        ) : (
          /* ---------- CHOICE ---------- */
          <>
            <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-3">{dilemma.title}</h2>
            <p className="text-sm text-gray-300 leading-relaxed bg-[#101c14] border border-white/5 rounded-2xl p-4 mb-6">{dilemma.text}</p>

            <div className="space-y-3 mb-6">
              {dilemma.options.map((opt, idx) => {
                const isSelected = chosenOption === idx;
                const lasting = describeActions(opt);
                const hasGamble = opt.actions?.some(a => a.type === 'gamble');
                return (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(idx)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(idx); } }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#22E748] bg-[#14261b] ring-2 ring-[#22E748]/30'
                        : 'border-white/10 bg-[#0d1611] hover:border-white/30 hover:bg-[#121f17]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-white">{opt.text}</p>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#22E748] flex-shrink-0" />}
                    </div>
                    {lasting.length > 0 && !isSelected && (
                      <p className="text-[10px] text-amber-300/80 mt-1.5 font-bold">⚠️ Tiene consecuencias más allá de este año</p>
                    )}

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-white/10 animate-fadeIn space-y-2">
                        {!hasGamble && <p className="text-xs text-gray-300 italic">Resultado: {opt.outcome}</p>}
                        <EffectChips effects={describeEffects(player, opt.effects).filter(e => e.applies)} />
                        {lasting.length > 0 && (
                          <ul className="space-y-1">
                            {lasting.map((l, i) => (
                              <li key={i} className="text-[11px] text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2 py-1">{l}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleConfirm}
              disabled={chosenOption === null}
              className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg ${
                chosenOption !== null
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110 active:scale-98 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              Afrontar las consecuencias ➔
            </button>
          </>
        )}
      </div>
    </div>
  );
}
