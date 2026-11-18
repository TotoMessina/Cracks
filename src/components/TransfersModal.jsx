import React, { useState } from 'react';
import ClubShield from './ClubShield';
import { AlertOctagon, Check, X } from 'lucide-react';
import { sound } from '../utils/audio';

export default function TransfersModal({
  player,
  offers = [],
  onAcceptOffer,
}) {
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(0);
  const [showRivalConfirmation, setShowRivalConfirmation] = useState(false);

  const selectedOffer = offers[selectedOfferIndex] || offers[0];

  const handleSelectOffer = (idx) => {
    sound.playClick();
    setSelectedOfferIndex(idx);
    setShowRivalConfirmation(false);
    if (offers[idx]?.isRival) {
      sound.playBuzzer();
    }
  };

  const handleAttemptConfirm = () => {
    if (selectedOffer?.isRival && !showRivalConfirmation) {
      sound.playBuzzer();
      setShowRivalConfirmation(true);
      return;
    }
    sound.playFanfare();
    onAcceptOffer(selectedOffer);
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Mercado de Pases y Ofertas de Transferencia"
    >
      <div className="bg-[#09110d] border border-[#22E748]/40 rounded-3xl max-w-3xl w-full p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-y-auto max-h-[94vh] animate-pop">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-xs uppercase font-black tracking-widest text-[#22E748] bg-[#22E748]/10 px-3 py-1 rounded-full border border-[#22E748]/20">
            Mercado de Pases
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white mt-2">
            Propuestas para la Próxima Temporada
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Tu rendimiento en el campo llamó la atención. Podés renovar o dar un salto de club.
          </p>
        </div>

        {/* Offers List */}
        <div className="space-y-3 my-6 max-h-[360px] overflow-y-auto pr-1">
          {offers.map((offer, idx) => {
            const isSelected = selectedOfferIndex === idx;
            const club = offer.club;

            return (
              <div
                key={idx}
                onClick={() => handleSelectOffer(idx)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectOffer(idx); } }}
                className={`p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  offer.isRival
                    ? isSelected
                      ? 'border-red-500 bg-red-950/40 ring-2 ring-red-500'
                      : 'border-red-900/60 bg-red-950/20 hover:border-red-600'
                    : isSelected
                    ? 'border-[#22E748] bg-[#13241a] ring-2 ring-[#22E748]/40'
                    : 'border-white/10 bg-[#0c1611] hover:border-white/20 hover:bg-[#101e16]'
                }`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <ClubShield club={club} size={44} />
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-base font-black text-white">
                        {club.name}
                      </h3>
                      {offer.isRenewal && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                          Tu Club Actual
                        </span>
                      )}
                      {offer.isRival && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-700/60 animate-pulse flex items-center space-x-1">
                          <AlertOctagon className="w-3 h-3 inline mr-1" />
                          ¡CLÁSICO RIVAL!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 max-w-md">
                      {offer.message}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right flex-shrink-0 sm:ml-3">
                  <span className="text-xs text-gray-400 block font-bold">
                    Sueldo anual
                  </span>
                  <span className="text-base font-black text-[#22E748] font-mono">
                    ${(offer.salary || 0).toLocaleString('es-AR')}
                  </span>
                  {player?.salary > 0 && (
                    <span className={`block text-[10px] font-mono font-bold ${offer.salary >= player.salary ? 'text-emerald-400' : 'text-red-400'}`}>
                      {offer.salary >= player.salary ? '▲' : '▼'} {Math.round((offer.salary / player.salary - 1) * 100)}% vs. actual
                    </span>
                  )}
                  <span className="block text-[10px] text-gray-500 font-mono">Prestigio {club.reputation}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Double-confirmation alert modal for Classic Rival */}
        {showRivalConfirmation && selectedOffer?.isRival ? (
          <div className="bg-red-950/90 border-2 border-red-500 rounded-2xl p-4 mb-5 text-center animate-shake space-y-3 shadow-2xl">
            <div className="flex items-center justify-center space-x-2 text-red-400">
              <AlertOctagon className="w-6 h-6 animate-bounce" />
              <h4 className="text-base font-black text-white uppercase tracking-wide">
                ¡CONFIRMACIÓN DE ALTA TRAICIÓN!
              </h4>
            </div>
            <p className="text-xs text-red-200 max-w-lg mx-auto leading-relaxed">
              ¿Estás completamente seguro de que querés firmar con <strong>{selectedOffer.club.name}</strong>? Tu Idolatría en <strong>{player.currentClub.name}</strong> caerá inmediatamente a <strong>0</strong> y la hinchada jamás te perdonará.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={handleAttemptConfirm}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Sí, firmo con el Rival</span>
              </button>
              <button
                onClick={() => setShowRivalConfirmation(false)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        ) : (
          /* Rival Warning Box if selected but not yet confirming */
          selectedOffer?.isRival && (
            <div className="bg-red-950/50 border border-red-500/60 rounded-xl p-3 mb-6 text-xs text-red-200 flex items-start space-x-2 animate-pulse">
              <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider text-red-300">
                  ⚠️ ADVERTENCIA DE TRAICIÓN HISTÓRICA:
                </span>
                Si firmas con el clásico rival, tu idolatría en {player.currentClub.name} caerá inmediatamente a 0, quemarán tus camisetas en la calle y serás repudiado cada vez que vuelvas a su estadio.
              </div>
            </div>
          )
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400">
            Destino elegido: <strong className="text-white">{selectedOffer?.club?.name}</strong>
          </p>
          <button
            onClick={handleAttemptConfirm}
            className={`px-8 py-3.5 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg ${
              selectedOffer?.isRival
                ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer active:scale-98'
                : 'bg-gradient-to-r from-[#22E748] to-[#16a34a] text-black hover:brightness-110 active:scale-98 cursor-pointer'
            }`}
          >
            {selectedOffer?.isRenewal
              ? "Firmar Renovación ➔"
              : selectedOffer?.isRival
              ? "Firmar Pase con el Rival ➔"
              : "Firmar Contrato y Cambiar de Club ➔"}
          </button>
        </div>
      </div>
    </div>
  );
}
