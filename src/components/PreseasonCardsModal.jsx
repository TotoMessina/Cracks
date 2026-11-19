import React, { useState } from 'react';
import { Sparkles, CheckCircle, Coins, Zap } from 'lucide-react';
import { sound } from '../utils/audio';
import { describeEffects } from '../game/effects';

export default function PreseasonCardsModal({
  cards = [],
  onSelectCard,
  onReroll,
  coins = 0,
  onBuySecondSlot,
  hasSecondSlot = false,
  player = null,
}) {
  const [selectedCardIds, setSelectedCardIds] = useState([]);

  const maxSelectable = hasSecondSlot ? 2 : 1;

  const rarityConfig = {
    comun: {
      border: 'border-emerald-600/40 hover:border-emerald-400',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-700/50',
      glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      label: 'Común'
    },
    rara: {
      border: 'border-blue-600/50 hover:border-blue-400',
      badge: 'bg-blue-950 text-blue-300 border-blue-700/50',
      glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
      label: 'Rara'
    },
    dorada: {
      border: 'border-amber-500/60 hover:border-amber-400',
      badge: 'bg-amber-950 text-amber-300 border-amber-500/50',
      glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]',
      label: 'Dorada'
    },
    iconica: {
      border: 'border-purple-500/70 hover:border-purple-400 ring-1 ring-purple-500/30',
      badge: 'bg-purple-950 text-purple-200 border-purple-500/50',
      glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.45)]',
      label: '✨ Icónica ✨'
    }
  };

  const handleCardClick = (card) => {
    sound.playCardFlip();
    setSelectedCardIds(prev => {
      if (prev.includes(card.id)) {
        return prev.filter(id => id !== card.id);
      }
      if (maxSelectable === 1) {
        return [card.id];
      }
      if (prev.length < maxSelectable) {
        return [...prev, card.id];
      }
      // Replace the first selected if at capacity
      return [prev[1], card.id];
    });
  };

  const handleConfirm = () => {
    const chosenCards = cards.filter(c => selectedCardIds.includes(c.id));
    if (chosenCards.length > 0) {
      sound.playFanfare();
      onSelectCard(chosenCards);
    }
  };

  const canAffordReroll = coins >= 5;
  const canAffordSecondSlot = coins >= 15;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-[#0a120d] border border-[#22E748]/40 rounded-3xl max-w-4xl w-full p-3.5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[96dvh] animate-pop">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#22E748]/15 blur-3xl pointer-events-none" />

        {/* Top Header with Coins Budget */}
        <div className="flex gap-3 items-center justify-between pb-3 sm:pb-4 border-b border-white/10 relative z-10 flex-shrink-0">
          <div>
            <span className="text-xs uppercase font-black tracking-widest text-[#22E748] bg-[#22E748]/10 px-3 py-1 rounded-full border border-[#22E748]/20">
              Pretemporada
            </span>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white mt-1.5 tracking-tight leading-tight">
              Elegí tu entrenamiento <span className="text-gray-400 text-sm sm:text-xl">{hasSecondSlot ? "(2 cartas)" : "(1 carta)"}</span>
            </h2>
          </div>

          <div className="bg-[#121c16] border border-amber-500/30 px-3.5 py-1.5 rounded-xl flex items-center space-x-2 shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-gray-400 block font-bold leading-none">Billetera</span>
              <span className="text-sm font-black text-amber-300 font-mono leading-tight">{coins} Monedas</span>
            </div>
          </div>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 my-3 md:my-4 overflow-y-auto p-1 relative z-10 flex-1 min-h-0">
          {cards.map(card => {
            const config = rarityConfig[card.rarity] || rarityConfig.comun;
            const isSelected = selectedCardIds.includes(card.id);

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={`bg-[#0e1912] border-2 rounded-2xl p-3 md:p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between relative group ${
                  config.border
                } ${config.glow} ${
                  isSelected
                    ? 'ring-4 ring-[#22E748] scale-102 bg-[#14261b]'
                    : 'hover:-translate-y-1'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-[#22E748] text-black rounded-full p-0.5">
                    <CheckCircle className="w-5 h-5 fill-black text-white" />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5 md:mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${config.badge}`}>
                      {config.label}
                    </span>
                    <Sparkles className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                  </div>

                  <h3 className="text-base md:text-lg font-black text-white leading-tight mb-1.5 md:mb-2">
                    {card.name}
                  </h3>

                  <p className="hidden md:block text-xs text-gray-400 mb-4 leading-relaxed">
                    {card.description}
                  </p>

                  {/* Effects Pill */}
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-1 md:gap-1.5 md:mb-4">
                    {describeEffects(player, card.effects).map(eff => (
                      <div
                        key={eff.key}
                        className={`border rounded-md px-2 md:px-2.5 py-0.5 md:py-1 flex items-center justify-between gap-1 text-xs ${
                          eff.applies ? 'bg-black/40 border-white/5' : 'bg-black/20 border-white/5 opacity-40'
                        }`}
                        title={eff.applies ? '' : 'Este atributo no aplica a tu puesto'}
                      >
                        <span className="text-gray-300 font-semibold uppercase text-[10px]">
                          {eff.label}{!eff.applies && ' · no aplica'}
                        </span>
                        <span className={`font-black font-mono ${eff.positive ? 'text-[#22E748]' : 'text-red-400'}`}>
                          {eff.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden md:block pt-3 border-t border-white/5">
                  <p className="text-[11px] italic text-gray-400 leading-snug">
                    "{card.quote}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tactical Coin Options Bar */}
        <div className="bg-[#121c16] border border-white/10 rounded-2xl p-2 sm:p-3 flex items-center justify-center sm:justify-between gap-3 mb-3 relative z-10">
          <div className="hidden sm:flex items-center space-x-2 text-xs">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-gray-300 font-bold">Opciones Tácticas de Monedas:</span>
          </div>

          <div className="flex items-center space-x-2">
            {!hasSecondSlot ? (
              <button
                type="button"
                onClick={onBuySecondSlot}
                disabled={!canAffordSecondSlot}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${
                  canAffordSecondSlot
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 cursor-pointer'
                    : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                }`}
                title="Permite seleccionar 2 cartas de este trío para duplicar tu desarrollo"
              >
                <span>⚡ 2da Carta</span>
                <span className="bg-amber-950/80 px-1.5 py-0.2 rounded text-[10px] text-amber-300 font-mono">🪙 15</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#22E748]/20 text-[#22E748] border border-[#22E748]/40">
                ✅ Doble Carta Activa
              </span>
            )}

            <button
              type="button"
              onClick={onReroll}
              disabled={!canAffordReroll}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                canAffordReroll
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer'
                  : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <span>🔄 Cambiar Cartas</span>
              <span className="bg-black/50 px-1.5 py-0.2 rounded text-[10px] text-amber-400 font-mono">🪙 5</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-3 border-t border-white/10 relative z-10 flex-shrink-0">
          <span className="hidden sm:inline text-xs text-gray-400">
            Seleccionadas: <strong className="text-white">{selectedCardIds.length}</strong> de {maxSelectable}
          </span>

          <button
            onClick={handleConfirm}
            disabled={selectedCardIds.length === 0}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg ${
              selectedCardIds.length > 0
                ? 'bg-gradient-to-r from-[#22E748] to-[#16a34a] text-black hover:brightness-110 active:scale-98 cursor-pointer'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirmar Entrenamiento ({selectedCardIds.length}/{maxSelectable}) ➔
          </button>
        </div>
      </div>
    </div>
  );
}
