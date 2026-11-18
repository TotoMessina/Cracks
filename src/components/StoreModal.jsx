import React from 'react';
import { STORE_ITEMS } from '../data/store';
import { sound } from '../utils/audio';
import {
  ShoppingBag,
  Check,
  Car,
  Truck,
  Home,
  Ship,
  Plane,
  Activity,
  HeartPulse,
  Heart,
  Building,
  Dumbbell,
  Watch,
  Shield,
  Utensils,
  X
} from 'lucide-react';

export default function StoreModal({ player, onBuyItem, onClose }) {
  const iconMap = {
    Car: <Car className="w-6 h-6 text-amber-400" />,
    Truck: <Truck className="w-6 h-6 text-amber-400" />,
    Home: <Home className="w-6 h-6 text-[#22E748]" />,
    Ship: <Ship className="w-6 h-6 text-cyan-400" />,
    Plane: <Plane className="w-6 h-6 text-purple-400" />,
    Activity: <Activity className="w-6 h-6 text-rose-400" />,
    HeartPulse: <HeartPulse className="w-6 h-6 text-emerald-400" />,
    Heart: <Heart className="w-6 h-6 text-pink-400" />,
    Building: <Building className="w-6 h-6 text-blue-400" />,
    Dumbbell: <Dumbbell className="w-6 h-6 text-yellow-400" />,
    Watch: <Watch className="w-6 h-6 text-amber-300" />,
    Shield: <Shield className="w-6 h-6 text-indigo-400" />,
    Utensils: <Utensils className="w-6 h-6 text-green-400" />,
  };

  const handleBuy = (item) => {
    if (player.money >= item.cost && !player.lifestyle?.includes(item.id)) {
      sound.playCoin();
      onBuyItem(item);
    } else {
      sound.playBuzzer();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#0b130e] border border-[#22E748]/40 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#22E748]/10 border border-[#22E748]/30 rounded-xl text-[#22E748]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                Tienda de Estilo & Vida
              </h2>
              <p className="text-xs text-gray-400">
                Invertí tu sueldo acumulado en propiedades, salud y comodidades que potencian tu carrera.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                Tu Patrimonio
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                ${(player.money).toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Store Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 overflow-y-auto pr-1">
          {STORE_ITEMS.map(item => {
            const isOwned = player.lifestyle?.includes(item.id);
            const canAfford = player.money >= item.cost;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isOwned
                    ? 'border-emerald-600/50 bg-emerald-950/20'
                    : 'border-white/10 bg-[#0e1712] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-black/40 rounded-xl border border-white/5">
                      {iconMap[item.icon] || <Car className="w-6 h-6 text-white" />}
                    </div>
                    {isOwned ? (
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                        <Check className="w-3 h-3 inline mr-1" />
                        Comprado
                      </span>
                    ) : (
                      <span className="text-sm font-black text-white font-mono">
                        ${item.cost.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-white mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#22E748]">
                    ⚡ {item.perk}
                  </span>

                  {!isOwned && (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                        canAfford
                          ? 'bg-[#22E748] hover:bg-[#16a34a] text-black active:scale-95 cursor-pointer'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? "Comprar" : "Falta Dinero"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all"
          >
            Volver a la Carrera
          </button>
        </div>
      </div>
    </div>
  );
}
