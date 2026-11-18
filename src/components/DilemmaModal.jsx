import React, { useState } from 'react';
import { Newspaper, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';
import { describeEffects } from '../game/effects';

export default function DilemmaModal({ dilemma, onResolve, player = null }) {
  const [chosenOption, setChosenOption] = useState(null);

  if (!dilemma) return null;

  const handleSelect = (idx) => {
    sound.playClick();
    setChosenOption(idx);
    const opt = dilemma.options[idx];
    if (opt.effects && opt.effects.idolatria && opt.effects.idolatria < 0) {
      sound.playBuzzer();
    } else {
      sound.playWhistle();
    }
  };

  const handleConfirm = () => {
    if (chosenOption === null) return;
    onResolve(dilemma.options[chosenOption]);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#0b130e] border border-amber-500/40 rounded-3xl max-w-xl w-full p-5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden max-h-[94vh] overflow-y-auto animate-pop">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-2 text-amber-400 mb-3">
          <Newspaper className="w-5 h-5" />
          <span className="text-xs uppercase font-black tracking-widest">
            Dilema de la Temporada
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-3">
          {dilemma.title}
        </h2>

        <p className="text-sm text-gray-300 leading-relaxed bg-[#101c14] border border-white/5 rounded-2xl p-4 mb-6">
          {dilemma.text}
        </p>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {dilemma.options.map((opt, idx) => {
            const isSelected = chosenOption === idx;

            return (
              <div
                key={idx}
                onClick={() => handleSelect(idx)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#22E748] bg-[#14261b] ring-2 ring-[#22E748]/30'
                    : 'border-white/10 bg-[#0d1611] hover:border-white/30 hover:bg-[#121f17]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-bold text-white pr-2">
                    {opt.text}
                  </p>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-[#22E748] flex-shrink-0" />
                  )}
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-white/10 animate-fadeIn">
                    <p className="text-xs text-gray-300 italic mb-2">
                      Resultado: {opt.outcome}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {describeEffects(player, opt.effects).filter(e => e.applies).map(eff => (
                        <span
                          key={eff.key}
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            eff.positive
                              ? 'bg-[#22E748]/20 text-[#22E748] border border-[#22E748]/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {eff.label}: {eff.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <button
          onClick={handleConfirm}
          disabled={chosenOption === null}
          className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg ${
            chosenOption !== null
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110 active:scale-98 cursor-pointer'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          Afrontar las Consecuencias ➔
        </button>
      </div>
    </div>
  );
}
