import React, { useState } from 'react';
import ClubShield from './ClubShield';
import { AlertOctagon, Check, X } from 'lucide-react';
import { sound } from '../utils/audio';
import { signingBonus, offerSignsContract, negotiationOdds, NEGOTIATION_ASKS } from '../game/career';

export default function TransfersModal({
  player,
  offers = [],
  onAcceptOffer,
  onNegotiate,
  loanEnd = false,
  isFreeAgent = true,
  released = false,
  yearsRange = { min: 1, max: 4, suggested: 3 },
}) {
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(() => Math.max(0, offers.findIndex(o => !o.withdrawn)));
  const [years, setYears] = useState(yearsRange.suggested);
  const [showRivalConfirmation, setShowRivalConfirmation] = useState(false);

  const selectedOffer = offers[selectedOfferIndex] || offers[0];
  const signs = offerSignsContract(selectedOffer);
  const maxYears = Math.max(yearsRange.min, selectedOffer?.maxYears ?? yearsRange.max);
  const effectiveYears = Math.min(years, maxYears);

  const handleNegotiate = (askId) => {
    const outcome = onNegotiate?.(selectedOfferIndex, askId);
    if (outcome === 'accepted' && NEGOTIATION_ASKS[askId].years) setYears(y => Math.max(y, maxYears + 1));
  };

  const handleSelectOffer = (idx) => {
    sound.playClick();
    setSelectedOfferIndex(idx);
    setShowRivalConfirmation(false);
    if (offers[idx]?.isRival) {
      sound.playBuzzer();
    }
  };

  const handleAttemptConfirm = () => {
    if (!selectedOffer || selectedOffer.withdrawn) return;
    if (selectedOffer?.isRival && !showRivalConfirmation) {
      sound.playBuzzer();
      setShowRivalConfirmation(true);
      return;
    }
    sound.playFanfare();
    onAcceptOffer(selectedOffer, effectiveYears);
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Mercado de Pases y Ofertas de Transferencia"
    >
      <div className="bg-[#09110d] border border-[#22E748]/40 rounded-3xl max-w-3xl w-full p-3.5 sm:p-6 md:p-8 shadow-2xl relative overflow-y-auto max-h-[96dvh] animate-pop">
        {/* Header */}
        <div className="text-center mb-3 sm:mb-6">
          <span className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-[#22E748] bg-[#22E748]/10 px-3 py-1 rounded-full border border-[#22E748]/20">
            {loanEnd ? 'Mercado de pases · Fin del préstamo' : released ? 'Mercado de pases · Tu club descendió' : isFreeAgent ? 'Mercado de pases · Contrato terminado' : 'Mercado de pases · Contrato vigente'}
          </span>
          <h2 className="text-xl md:text-3xl font-black text-white mt-2 leading-tight">
            {loanEnd ? 'Terminó tu préstamo: ¿volvés?' : released ? 'Descendiste: ¿te vas o te quedás?' : isFreeAgent ? 'Sos libre: elegí tu próximo contrato' : '¡Hay interés por vos!'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {loanEnd
              ? 'Volvé a tu club con más rodaje o quedate donde jugás todos los domingos.'
              : released
              ? 'Por la cláusula de descenso te podés ir gratis. Quedarte para devolver al club a primera suma mucha idolatría (+12).'
              : isFreeAgent
              ? 'Se terminó tu contrato. Podés renovar o irte gratis a otro club.'
              : 'Todavía tenés contrato, pero llegaron propuestas. Podés quedarte tranquilo o aceptar.'}
          </p>
        </div>

        {/* Offers List */}
        <div className="space-y-2 sm:space-y-3 my-3 sm:my-6">
          {offers.map((offer, idx) => {
            const isSelected = selectedOfferIndex === idx;
            if (offer.withdrawn) {
              return (
                <div key={idx} className="p-2.5 sm:p-3 rounded-2xl border-2 border-white/5 bg-black/30 opacity-60 flex items-center gap-2.5">
                  <ClubShield club={offer.club} size={28} />
                  <span className="text-xs text-gray-400 flex-1 min-w-0"><strong className="text-gray-300">{offer.club.name}</strong> · {offer.negotiation?.text}</span>
                  <span className="text-[10px] font-black uppercase text-red-400 shrink-0">Retirada</span>
                </div>
              );
            }
            const club = offer.club;

            return (
              <div
                key={idx}
                onClick={() => handleSelectOffer(idx)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectOffer(idx); } }}
                className={`p-2.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2 ${
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
                <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                  <ClubShield club={club} size={36} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                        {club.name}
                      </h3>
                      {offer.isStay && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/15">
                          Contrato vigente
                        </span>
                      )}
                      {offer.isRenewal && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                          {offer.loyalRelegation ? 'Quedarte en el ascenso' : offer.isRenegotiation ? 'Renegociación' : 'Tu club actual'}
                        </span>
                      )}
                      {offer.isLoan && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600/50">
                          🔁 Préstamo 1 año
                        </span>
                      )}
                      {offer.isLoanReturn && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                          🏠 Volver a tu club
                        </span>
                      )}
                      {offer.isLoanBuy && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/50">
                          Compra definitiva
                        </span>
                      )}
                      {offer.paysClause && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/50">
                          Paga tu cláusula
                        </span>
                      )}
                      {offer.isRival && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-700/60 animate-pulse flex items-center space-x-1">
                          <AlertOctagon className="w-3 h-3 inline mr-1" />
                          ¡CLÁSICO RIVAL!
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 max-w-md line-clamp-2 sm:line-clamp-none leading-snug">
                      {offer.message}
                    </p>
                    {offer.negotiation && (
                      <p className={`text-[11px] font-bold mt-0.5 ${offer.negotiation.outcome === 'accepted' ? 'text-[#22E748]' : 'text-amber-300'}`}>
                        🤝 {offer.negotiation.text}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 sm:ml-3">
                  <span className="text-[10px] sm:text-xs text-gray-400 block font-bold">
                    {offer.keepsContract ? 'Tu sueldo' : 'Sueldo anual'}
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#22E748] font-mono">
                    ${(offer.salary || 0).toLocaleString('es-AR')}
                  </span>
                  {player?.salary > 0 && !offer.isStay && !offer.keepsContract && (
                    <span className={`block text-[10px] font-mono font-bold ${offer.salary >= player.salary ? 'text-emerald-400' : 'text-red-400'}`}>
                      {offer.salary >= player.salary ? '▲' : '▼'} {Math.round((offer.salary / player.salary - 1) * 100)}%<span className="hidden sm:inline"> vs. actual</span>
                    </span>
                  )}
                  <span className="hidden sm:block text-[10px] text-gray-500 font-mono">Prestigio {club.reputation}</span>
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
                {player.flags?.swornLoyalty === player.currentClub.id && (
                  <strong className="block mt-1 text-red-100">Además juraste amor eterno en televisión: romper el juramento te cuesta 10 de fama.</strong>
                )}
              </div>
            </div>
          )
        )}

        {/* Contract length */}
        {signs && (
          <div className="mb-3 sm:mb-5 p-2.5 sm:p-4 rounded-2xl bg-black/30 border border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-black uppercase text-gray-300">Duración del contrato</span>
              <span className="text-xs font-mono text-gray-400">
                Total: <strong className="text-[#22E748]">${((selectedOffer.salary || 0) * effectiveYears).toLocaleString('es-AR')}</strong> en {effectiveYears} {effectiveYears === 1 ? 'año' : 'años'}
                {' '}· Prima por firma: <strong className="text-amber-300">${signingBonus(selectedOffer.salary || 0, effectiveYears).toLocaleString('es-AR')}</strong>
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: maxYears - yearsRange.min + 1 }, (_, i) => yearsRange.min + i).map(y => (
                <button
                  key={y}
                  onClick={() => { sound.playClick(); setYears(y); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-black border transition-all cursor-pointer ${
                    effectiveYears === y ? 'bg-[#22E748] text-black border-[#22E748]' : 'bg-black/40 text-gray-300 border-white/10 hover:border-white/30'
                  }`}
                >
                  {y} {y === 1 ? 'año' : 'años'}
                </button>
              ))}
            </div>
            {!selectedOffer.negotiated && onNegotiate && (
              <div className="mt-2.5 pt-2.5 border-t border-white/10">
                <span className="text-[10px] font-black uppercase text-amber-300">🤝 Negociar · un solo intento: si te pasás, pueden retirar la oferta</span>
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  {Object.values(NEGOTIATION_ASKS).map(ask => {
                    const odds = negotiationOdds(player, selectedOffer, ask.id);
                    return (
                      <button
                        key={ask.id}
                        onClick={() => handleNegotiate(ask.id)}
                        className="py-1.5 px-1 rounded-xl bg-black/40 border border-amber-500/30 hover:border-amber-400 text-center cursor-pointer transition-all"
                      >
                        <span className="block text-[11px] font-black text-white leading-tight">{ask.label}</span>
                        <span className={`block text-[10px] font-mono ${odds.accept >= 0.6 ? 'text-[#22E748]' : odds.accept >= 0.4 ? 'text-amber-300' : 'text-red-400'}`}>
                          {Math.round(odds.accept * 100)}% sí · {Math.round(odds.withdraw * 100)}% se va
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="hidden sm:block text-[11px] text-gray-400 mt-2 leading-snug">
              El sueldo queda fijo todo el contrato. Largo = más prima y seguridad (si bajás el nivel seguís cobrando igual{selectedOffer.isRenewal ? '; renovar 4 años o más suma idolatría' : ''}), pero si mejorás vas a cobrar menos de lo que valés.
              Mientras dure, solo te podés ir si un club paga tu cláusula.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-3 sm:pt-4 border-t border-white/10">
          <p className="hidden sm:block text-xs text-gray-400">
            Destino elegido: <strong className="text-white">{selectedOffer?.club?.name}</strong>
          </p>
          <button
            onClick={handleAttemptConfirm}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg ${
              selectedOffer?.isRival
                ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer active:scale-98'
                : 'bg-gradient-to-r from-[#22E748] to-[#16a34a] text-black hover:brightness-110 active:scale-98 cursor-pointer'
            }`}
          >
            {selectedOffer?.isLoan
              ? "Irme cedido ➔"
              : selectedOffer?.isLoanReturn
              ? `Volver a ${selectedOffer.club.shortName || selectedOffer.club.name} ➔`
              : selectedOffer?.isStay
              ? "Quedarme con mi contrato ➔"
              : selectedOffer?.isRenewal
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
