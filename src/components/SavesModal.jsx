import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { getSlotData } from '../utils/storage';
import { Save, FolderOpen, Trash2, PlusCircle, CheckCircle2, X, AlertTriangle, User } from 'lucide-react';

export default function SavesModal({
  currentPlayer,
  activeSlot = 1,
  onLoadSlot,
  onSaveToSlot,
  onDeleteSlot,
  onStartNewInSlot,
  onClose
}) {
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState(null);

  // Read current slots
  const slots = [1, 2, 3].map(num => ({
    num,
    data: getSlotData(num),
    isActive: num === activeSlot
  }));

  const handleDelete = (num) => {
    sound.playClick();
    onDeleteSlot(num);
    setConfirmDeleteSlot(null);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-[#0a120e] border-2 border-[#22E748]/40 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(34,231,72,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#22E748] to-[#15803d] flex items-center justify-center shadow-[0_0_15px_rgba(34,231,72,0.4)]">
              <Save className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#22E748] bg-[#22E748]/10 px-2 py-0.5 rounded border border-[#22E748]/20">
                Memoria & Ranuras
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Gestor de Partidas Guardadas
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {slots.map(({ num, data, isActive }) => {
            const isDeleting = confirmDeleteSlot === num;

            return (
              <div
                key={num}
                className={`p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0e2417] to-[#0b1610] border-[#22E748] shadow-[0_0_20px_rgba(34,231,72,0.2)]'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Slot Top Bar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-sm text-[#22E748]">
                      Ranura #{num}
                    </span>
                    {isActive && (
                      <span className="flex items-center space-x-1 text-[10px] font-black uppercase text-black bg-[#22E748] px-2 py-0.5 rounded-full shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Partida Activa</span>
                      </span>
                    )}
                  </div>

                  {data?.savedAt && (
                    <span className="text-[10px] font-mono text-gray-400">
                      Guardado: {data.savedAt}
                    </span>
                  )}
                </div>

                {/* Slot Body */}
                {data ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-black text-white flex items-center space-x-2">
                          <User className="w-4 h-4 text-[#22E748]" />
                          <span>{data.name}</span>
                          <span className="text-xs font-semibold text-gray-400">
                            ({data.position?.toUpperCase()})
                          </span>
                        </h3>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {data.currentClub?.name || 'Libre'} • {data.age} años • Temporada #{data.seasonsPlayed + 1}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-amber-400 block">
                          🏆 {data.trophies?.length || 0} títulos
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 block">
                          ${(data.money || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-black/40 rounded-xl p-2 border border-white/5">
                      <div>
                        <span className="text-gray-400 block">Goles</span>
                        <span className="font-bold text-white font-mono">{data.totalGoals || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Partidos</span>
                        <span className="font-bold text-white font-mono">{data.totalMatches || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Idolatría</span>
                        <span className="font-bold text-[#22E748] font-mono">{data.idolatry || 0}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Fama</span>
                        <span className="font-bold text-yellow-300 font-mono">{data.fame || 0}%</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isDeleting ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center justify-between animate-fadeIn">
                        <div className="flex items-center space-x-2 text-xs text-red-300">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span>¿Seguro que querés borrar esta carrera?</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDelete(num)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Sí, borrar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteSlot(null)}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-gray-300 text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {!isActive && (
                          <button
                            onClick={() => {
                              sound.playClick();
                              onLoadSlot(num, data);
                            }}
                            className="px-3.5 py-1.5 bg-[#22E748] hover:bg-[#16a34a] text-black font-black text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Cargar Ranura</span>
                          </button>
                        )}

                        {currentPlayer && (
                          <button
                            onClick={() => {
                              sound.playClick();
                              onSaveToSlot(num);
                            }}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
                            title="Sobrescribir con la carrera que estás jugando ahora"
                          >
                            <Save className="w-3.5 h-3.5 text-amber-400" />
                            <span>Guardar Actual Aquí</span>
                          </button>
                        )}

                        <button
                          onClick={() => setConfirmDeleteSlot(num)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all ml-auto cursor-pointer"
                          title="Eliminar partida guardada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Borrar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty Slot */
                  <div className="py-4 text-center space-y-3">
                    <p className="text-xs text-gray-400">
                      Ranura disponible sin carrera guardada.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {currentPlayer && (
                        <button
                          onClick={() => {
                            sound.playClick();
                            onSaveToSlot(num);
                          }}
                          className="px-4 py-2 bg-[#122419] hover:bg-[#1a3826] text-[#22E748] border border-[#22E748]/30 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar Carrera Actual Aquí</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          sound.playClick();
                          onStartNewInSlot(num);
                        }}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-white/10 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-[#22E748]" />
                        <span>Nueva Carrera Aquí</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-gray-400">
          <span>Hasta 3 carreras simultáneas sin perder tus progresos.</span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
