import React, { useState } from 'react';
import { getPlayerOverall } from '../game/career';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

export default function CareerTimeline({ player }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!player) return null;

  const currentOvr = getPlayerOverall(player);
  const history = player.seasonHistory || [];

  // If no recorded history yet, synthesize from current state so timeline is never blank
  const timelineData = history.length > 0 ? history : [
    {
      seasonNumber: 1,
      year: 2026,
      age: player.age,
      clubName: player.currentClub?.name || 'Club',
      ovr: currentOvr,
      matches: player.totalMatches || 0,
      goals: player.totalGoals || 0,
      cleanSheets: player.totalCleanSheets || 0,
      trophiesCount: player.trophies?.length || 0,
    }
  ];

  // SVG Sparkline points calculation
  const ovrPoints = timelineData.map(d => d.ovr);
  const minOvr = Math.min(...ovrPoints, currentOvr) - 2;
  const maxOvr = Math.max(...ovrPoints, currentOvr) + 2;
  const range = Math.max(1, maxOvr - minOvr);

  const width = 280;
  const height = 48;
  const step = timelineData.length > 1 ? width / (timelineData.length - 1) : width / 2;

  const pointsString = timelineData.map((d, i) => {
    const x = timelineData.length === 1 ? width / 2 : i * step;
    const y = height - ((d.ovr - minOvr) / range) * (height - 12) - 6;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-[#0b130e] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#22E748]/10 border border-[#22E748]/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[#22E748]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              Evolución y Trayectoria Histórica
            </h3>
            <p className="text-[11px] text-gray-400">
              Progresión de tu media (OVR) y balance acumulado año a año.
            </p>
          </div>
        </div>

        {/* Sparkline Visual */}
        <div className="flex items-center space-x-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-gray-400 block leading-tight">OVR Actual</span>
            <span className="text-base font-black text-[#22E748] font-mono leading-none">{currentOvr}</span>
          </div>

          <svg width={width} height={height} className="overflow-visible hidden sm:block">
            {/* Guide line */}
            <polyline
              fill="none"
              stroke="#22E748"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsString}
            />
            {/* Dots */}
            {timelineData.map((d, i) => {
              const x = timelineData.length === 1 ? width / 2 : i * step;
              const y = height - ((d.ovr - minOvr) / range) * (height - 12) - 6;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="3.5" fill="#040705" stroke="#22E748" strokeWidth="2" />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Accordion Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-400">
            Registro de Temporadas ({timelineData.length})
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold text-[#22E748] hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
          >
            <span>{isExpanded ? "Ocultar Detalles" : "Ver Temporadas Anteriores"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Timeline rows */}
        <div className="space-y-1.5">
          {timelineData.slice(0, isExpanded ? timelineData.length : 2).map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2.5">
                <span className="font-mono font-black text-xs text-[#22E748] w-14">
                  #{item.seasonNumber} ({item.year})
                </span>
                <div>
                  <span className="font-bold text-white block">{item.clubName}</span>
                  <span className="text-[10px] text-gray-400">
                    {item.age} años • {item.matches} partidos disputados
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-right">
                <div>
                  <span className="text-[10px] text-gray-400 block">
                    {player.position === 'arquero' ? 'Vallas Inv.' : 'Goles'}
                  </span>
                  <span className="font-mono font-bold text-white">
                    {player.position === 'arquero' ? item.cleanSheets : item.goals}
                  </span>
                </div>

                <div className="w-12 text-center bg-[#22E748]/10 rounded px-1 py-0.5 border border-[#22E748]/20">
                  <span className="text-[9px] text-gray-400 uppercase font-black block">OVR</span>
                  <span className="font-mono font-black text-[#22E748] text-xs">{item.ovr}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
