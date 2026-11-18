import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy, Dumbbell, ShoppingBag, BookOpen, Volume2, VolumeX, Play, RotateCcw,
  Coins, Save, Crown, Award, Briefcase, MoreHorizontal,
} from 'lucide-react';
import { sound } from '../utils/audio';

const TABS = [
  { id: 'carrera', label: 'Carrera', Icon: Play },
  { id: 'vitrina', label: 'Palmarés', Icon: Trophy },
  { id: 'entrenamiento', label: 'Entrenar', Icon: Dumbbell },
];

function IconButton({ onClick, title, children, accent = 'hover:text-white', className = '' }) {
  return (
    <button
      onClick={() => { sound.playClick(); onClick(); }}
      className={`icon-btn ${accent} ${className}`}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

export default function AppHeader({
  player,
  activeTab,
  onTab,
  activeSlot,
  isMuted,
  onToggleSound,
  onOpen, // (modalName) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  const secondary = [
    { id: 'hall', label: 'Salón de la Fama', Icon: Crown, accent: 'hover:text-yellow-400' },
    { id: 'achievements', label: 'Logros', Icon: Award, accent: 'hover:text-[#22E748]' },
    { id: 'manager', label: 'Modo DT', Icon: Briefcase, accent: 'hover:text-sky-400' },
    { id: 'guide', label: 'Guía del juego', Icon: BookOpen, accent: 'hover:text-white' },
    { id: 'newGame', label: 'Nueva carrera', Icon: RotateCcw, accent: 'hover:text-red-300' },
  ];

  return (
    <>
      <header className="app-header sticky top-0 z-40 px-3 sm:px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <button className="flex items-center gap-2.5 cursor-pointer min-w-0" onClick={() => onTab('carrera')} aria-label="Ir a la carrera">
            <div className="logo-badge">⚽</div>
            <div className="text-left leading-none">
              <span className="block font-display text-xl sm:text-2xl text-white tracking-wide">EL ÍDOLO</span>
              <span className="block text-[9px] uppercase tracking-[0.25em] text-[#22E748] font-bold">Carrera de fútbol</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { sound.playClick(); onTab(id); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === id ? 'bg-[#22E748] text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-black" title="Monedas">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{player?.coins ?? 0}</span>
            </div>
            <IconButton onClick={() => onOpen('saves')} title={`Partidas guardadas (ranura #${activeSlot})`} accent="hover:text-amber-400">
              <Save className="w-4 h-4" />
            </IconButton>
            <IconButton onClick={() => onOpen('store')} title="Tienda" accent="hover:text-[#22E748]">
              <ShoppingBag className="w-4 h-4" />
            </IconButton>

            {/* Desktop: all buttons visible */}
            {secondary.map(({ id, label, Icon, accent }) => (
              <IconButton key={id} onClick={() => onOpen(id)} title={label} accent={accent} className="hidden lg:inline-flex">
                <Icon className="w-4 h-4" />
              </IconButton>
            ))}

            <IconButton onClick={onToggleSound} title={isMuted ? 'Activar sonido' : 'Silenciar'}>
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#22E748]" />}
            </IconButton>

            {/* Mobile / tablet: overflow menu */}
            <div className="relative lg:hidden" ref={menuRef}>
              <IconButton onClick={() => setMenuOpen(o => !o)} title="Más opciones">
                <MoreHorizontal className="w-4 h-4" />
              </IconButton>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0c1610] border border-white/10 shadow-2xl p-1.5 animate-pop origin-top-right">
                  {secondary.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => { sound.playClick(); setMenuOpen(false); onOpen(id); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-200 hover:bg-white/5 cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-gray-400" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bottom-nav">
        <div className="grid grid-cols-3">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { sound.playClick(); onTab(id); }}
              className={`py-2.5 flex flex-col items-center gap-0.5 text-[11px] font-bold cursor-pointer ${activeTab === id ? 'text-[#22E748]' : 'text-gray-400'}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
