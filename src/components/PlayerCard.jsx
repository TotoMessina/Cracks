import React, { useState } from 'react';
import Flag from './Flag';
import ClubShield from './ClubShield';
import { marketValue, formatValue, getPlayerOverall, getIdolatryRank, checkNationalTeamCallUp, getNationalCareer, NT_STATUS_LABEL } from '../game/career';
import { COUNTRIES } from '../data/clubs';
import { Star, Trophy, Coins, Zap, UserCheck, Users, HelpCircle } from 'lucide-react';

const STAT_TOOLTIPS = {
  definicion: "Probabilidad de gol en partidos oficiales y precisión de remate en penales.",
  potencia: "Fuerza de impacto y ventaja física en cabezazos y pelotas divididas.",
  gambeta: "Desequilibrio individual para resolver partidos cerrados y abrir defensas.",
  resistencia: "Resistencia física a lesiones y menor desgaste acumulado temporada a temporada.",
  pegada: "Efectividad quirúrgica en tiros libres al ángulo y centros con rosca.",
  liderazgo: "Capacidad de ordenar al vestuario, ganarse la capitanía y respeto del DT.",
  reflejos: "Velocidad de reacción bajo los tres palos en penales y mano a mano (Arquero).",
  agilidad: "Capacidad para volar hacia los ángulos y tapar remates ajustados.",
  salida: "Seguridad para descolgar centros aéreos y achicar en el área chica.",
  mando: "Voz de mando sobre la defensa que reduce los goles concedidos por el equipo."
};

/** Current market value and how it moved since the last season. */
function valueTrend(player) {
  const value = marketValue(player);
  const h = player.marketValueHistory || [];
  const before = h.length >= 2 ? h[h.length - 2].value : null;
  const pct = before ? Math.round((h[h.length - 1].value / before - 1) * 100) : 0;
  return { value, text: formatValue(value), pct };
}

/** One-row summary of the player for small screens; tapping opens the full card. */
export function PlayerStrip({ player, onOpen }) {
  if (!player) return null;
  const overall = getPlayerOverall(player);
  const idol = getIdolatryRank(player.idolatry);
  const pos = { delantero: 'DEL', enganche: 'ENG', arquero: 'ARQ' }[player.position] || 'DEL';
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-[#0c1611] border border-[#22E748]/25 text-left cursor-pointer active:scale-[0.99] transition"
      aria-label={`Ver ficha de ${player.name}`}
    >
      <div className="w-11 h-11 shrink-0 rounded-xl bg-black/50 border border-white/10 grid place-items-center leading-none">
        <span className="text-lg font-black text-white">{overall}</span>
        <span className="text-[8px] font-black text-[#22E748] -mt-1">{pos}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Flag code={player.country} size={11} />
          <span className="text-sm font-black text-white truncate">{player.name}</span>
          <span className="text-[11px] text-gray-400 shrink-0">{player.age} años</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-black/50 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-[#22E748]" style={{ width: `${Math.min(100, player.idolatry)}%` }} />
          </div>
          <span className={`text-[10px] font-bold shrink-0 ${idol.color}`}>{idol.icon} {player.idolatry}</span>
        </div>
      </div>
      <span className="text-right shrink-0 leading-tight">
        <span className="block text-[9px] font-bold uppercase text-gray-400">Valor</span>
        <span className="block text-xs font-black font-mono text-emerald-300">{valueTrend(player).text}</span>
        {valueTrend(player).pct !== 0 && (
          <span className={`block text-[9px] font-mono font-bold ${valueTrend(player).pct > 0 ? 'text-[#22E748]' : 'text-red-400'}`}>
            {valueTrend(player).pct > 0 ? '▲' : '▼'} {Math.abs(valueTrend(player).pct)}%
          </span>
        )}
      </span>
    </button>
  );
}

export default function PlayerCard({ player }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!player) return null;

  const overall = getPlayerOverall(player);
  const country = COUNTRIES.find(c => c.id === player.country) || COUNTRIES[0];
  const idolatryInfo = getIdolatryRank(player.idolatry);
  const nt = getNationalCareer(player);
  const isCalledUp = nt.status !== 'none' || player.nationalTeamStats?.calledUp || checkNationalTeamCallUp(player);

  // Position labels & colors
  const posDetails = {
    delantero: { dorsal: "9", label: "DEL", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    enganche: { dorsal: "10", label: "ENG", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    arquero: { dorsal: "1", label: "ARQ", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  }[player.position] || { dorsal: "9", label: "DEL", color: "bg-green-500/20 text-green-400 border-green-500/30" };

  return (
    <div
      className="bg-gradient-to-b from-[#111a14] via-[#0d1410] to-[#070b09] border border-[#22E748]/30 hover:border-[#22E748]/60 transition-all rounded-2xl p-5 shadow-2xl relative overflow-hidden group"
      role="region"
      aria-label={`Ficha técnica de ${player.name}`}
    >
      {/* Background glow accent */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#22E748]/10 rounded-full blur-3xl group-hover:bg-[#22E748]/20 transition-all" />

      {/* Top row: Rating, Position, Shield, Flag */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {/* Overall Rating & Dorsal badge */}
          <div
            className="text-center bg-[#070d0a] border border-white/10 px-3 py-1.5 rounded-xl shadow-inner"
            title={`Media Global: ${overall}`}
            aria-label={`Media global ${overall}`}
          >
            <span className="text-3xl font-black text-white tracking-tighter block leading-none">
              {overall}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1 inline-block ${posDetails.color}`}>
              {posDetails.dorsal} {posDetails.label}
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <Flag code={country.id} size={13} title={`Nacionalidad: ${country.name}`} />
              <h2 className="text-lg font-black text-white tracking-tight leading-tight">
                {player.name}
              </h2>
            </div>
            <p className="text-xs text-gray-400 flex items-center space-x-1 mt-0.5">
              <span>{player.age} años</span>
              <span>•</span>
              <span className="capitalize">{player.archetype === 'pibe_maravilla' ? '⚡ Pibe Maravilla' : player.playstyle}</span>
            </p>
          </div>
        </div>

        {/* Current Club Shield */}
        <div className="flex flex-col items-center">
          <ClubShield club={player.currentClub} size={46} />
          <span className="text-[10px] font-bold text-gray-400 mt-1 max-w-[70px] truncate text-center">
            {player.currentClub.shortName}
          </span>
        </div>
      </div>

      {/* National Team Status Badge */}
      {isCalledUp && (
        <div className="mt-3 px-3 py-1.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center space-x-1.5 truncate">
            <Flag code={country.id} size={12} title={country.name} />
            <span className="font-black text-sky-300 truncate">
              {country.nationalTeam}
            </span>
          </div>
          <span className="flex items-center gap-1.5 flex-shrink-0">
            {nt.skipNext ? (
              <span className="text-[10px] font-bold text-red-300 bg-red-900/30 px-2 py-0.5 rounded border border-red-500/30">Afuera por faltazo</span>
            ) : (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${nt.status === 'captain' ? 'text-amber-300 bg-amber-900/30 border-amber-500/40' : 'text-sky-300 bg-sky-900/40 border-sky-500/20'}`}>
                {nt.status === 'captain' ? '©️ ' : ''}{NT_STATUS_LABEL[nt.status === 'none' ? 'called' : nt.status]}{nt.shirt ? ` · #${nt.shirt}` : ''}
              </span>
            )}
            {player.nationalTeamStats?.matches > 0 && (
              <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-900/40 px-2 py-0.5 rounded border border-sky-500/20">
                {player.nationalTeamStats.matches} PJ · {player.position === 'arquero' ? `${player.nationalTeamStats.cleanSheets || 0} VI` : `${player.nationalTeamStats.goals || 0} G`}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Idolatry Bar & Statue Status */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="flex items-center space-x-1 font-bold text-gray-300">
            <span>{idolatryInfo.icon}</span>
            <span>Idolatría en el club:</span>
            <span className={`font-extrabold ${idolatryInfo.color}`}>
              {idolatryInfo.label}
            </span>
          </span>
          <span className="font-mono text-xs font-black text-[#22E748]">
            {player.idolatry}/100
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-black/50 border border-white/10 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              player.idolatry >= 95
                ? 'bg-gradient-to-r from-yellow-400 to-[#F6B40E] animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 to-[#22E748]'
            }`}
            style={{ width: `${Math.min(100, player.idolatry)}%` }}
          />
        </div>

        {player.hasStatue ? (
          <div className="mt-2 bg-[#F6B40E]/15 border border-[#F6B40E]/40 rounded-lg p-2 text-center text-xs font-black text-[#F6B40E] flex items-center justify-center space-x-1">
            <span>🗽</span>
            <span>¡TENÉS TU ESTATUA EN {(player.statueClubName || 'TU CLUB').toUpperCase()}!</span>
          </div>
        ) : player.idolatry >= 95 && (
          <div className="mt-2 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-[11px] font-bold text-gray-300">
            🗽 La hinchada ya te ama: falta seguir en el club hasta cumplir 5 temporadas para la estatua.
          </div>
        )}
      </div>

      {/* Market value */}
      <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20" title="Cuánto vale tu pase: sube y baja con tu rendimiento, edad y fama. Define qué clubes te ofertan.">
        <span className="text-[11px] font-bold text-gray-300">💰 Valor de mercado</span>
        <span className="font-mono text-sm font-black text-emerald-300">
          {valueTrend(player).text}
          {valueTrend(player).pct !== 0 && (
            <span className={`ml-1.5 text-[10px] ${valueTrend(player).pct > 0 ? 'text-[#22E748]' : 'text-red-400'}`}>
              {valueTrend(player).pct > 0 ? '▲' : '▼'}{Math.abs(valueTrend(player).pct)}%
            </span>
          )}
        </span>
      </div>

      {/* Energy & Dynamics Row */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {/* Energy Bar */}
        <div className="bg-[#08100b] border border-white/5 rounded-xl p-2 flex flex-col justify-between" title="Energía física. Si baja de 40% aumenta el riesgo de lesiones.">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 font-bold flex items-center space-x-0.5">
              <Zap className="w-2.5 h-2.5 text-yellow-400" />
              <span>Energía</span>
            </span>
            <span className={`font-mono font-bold ${(player.energy ?? 100) > 65 ? 'text-emerald-400' : (player.energy ?? 100) > 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {player.energy ?? 100}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-black/50 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${(player.energy ?? 100) > 65 ? 'bg-[#22E748]' : (player.energy ?? 100) > 40 ? 'bg-amber-400' : 'bg-red-500'}`}
              style={{ width: `${Math.max(0, Math.min(100, player.energy ?? 100))}%` }}
            />
          </div>
        </div>

        {/* DT Relationship */}
        <div className="bg-[#08100b] border border-white/5 rounded-xl p-2 flex flex-col justify-between" title="Confianza del Entrenador. Menor a 40% te manda al banco; mayor a 80% te hace titular indiscutido.">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 font-bold flex items-center space-x-0.5">
              <UserCheck className="w-2.5 h-2.5 text-blue-400" />
              <span>Conf. DT</span>
            </span>
            <span className={`font-mono font-bold ${(player.managerRelationship ?? 65) >= 75 ? 'text-blue-400' : (player.managerRelationship ?? 65) >= 45 ? 'text-gray-300' : 'text-red-400'}`}>
              {player.managerRelationship ?? 65}%
            </span>
          </div>
          <span className="text-[9px] text-gray-400 truncate mt-1">
            {(player.managerRelationship ?? 65) >= 80 ? 'Titular Top' : (player.managerRelationship ?? 65) >= 45 ? 'En Plan' : 'Al Banco'}
          </span>
        </div>

        {/* Locker Room Chemistry */}
        <div className="bg-[#08100b] border border-white/5 rounded-xl p-2 flex flex-col justify-between" title="Química de Vestuario. Eleva las chances de llegar a finales y resistir momentos difíciles.">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 font-bold flex items-center space-x-0.5">
              <Users className="w-2.5 h-2.5 text-purple-400" />
              <span>Vestuario</span>
            </span>
            <span className={`font-mono font-bold ${(player.lockerRoomChemistry ?? 70) >= 75 ? 'text-purple-400' : (player.lockerRoomChemistry ?? 70) >= 45 ? 'text-gray-300' : 'text-red-400'}`}>
              {player.lockerRoomChemistry ?? 70}%
            </span>
          </div>
          <span className="text-[9px] text-gray-400 truncate mt-1">
            {(player.lockerRoomChemistry ?? 70) >= 80 ? 'Líder Grupo' : (player.lockerRoomChemistry ?? 70) >= 45 ? 'Buen Clima' : 'Clima Tenso'}
          </span>
        </div>
      </div>

      {/* Core Attributes Grid with Tooltips */}
      <div className="grid grid-cols-2 gap-2 mt-3 relative">
        {Object.entries(player.stats).map(([statKey, val]) => {
          const tooltip = STAT_TOOLTIPS[statKey] || `Atributo: ${statKey}`;
          const isSelected = activeTooltip === statKey;

          return (
            <div
              key={statKey}
              onClick={() => setActiveTooltip(isSelected ? null : statKey)}
              onMouseEnter={() => setActiveTooltip(statKey)}
              onMouseLeave={() => setActiveTooltip(null)}
              className="bg-[#09110c] hover:bg-[#0f1d14] border border-white/5 hover:border-[#22E748]/30 rounded-lg px-2.5 py-1.5 flex justify-between items-center cursor-help transition-all relative group/stat"
              title={tooltip}
              aria-label={`${statKey}: ${val}. ${tooltip}`}
            >
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                <span>{statKey}</span>
                <HelpCircle className="w-2.5 h-2.5 text-gray-600 group-hover/stat:text-[#22E748] transition-colors" />
              </span>
              <span
                className={`font-black text-xs font-mono ${
                  val >= 80 ? 'text-[#22E748]' : val >= 70 ? 'text-emerald-300' : 'text-gray-200'
                }`}
              >
                {val}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Stat Tooltip Floating Card */}
      {activeTooltip && (
        <div className="mt-2.5 p-2 rounded-xl bg-black/90 border border-[#22E748]/50 shadow-xl text-left animate-fadeIn">
          <span className="text-[10px] font-black uppercase text-[#22E748] tracking-wider block">
            {activeTooltip}:
          </span>
          <p className="text-[11px] text-gray-300 mt-0.5 leading-tight">
            {STAT_TOOLTIPS[activeTooltip]}
          </p>
        </div>
      )}

      {/* Bottom stats pills: Fame, Trophies, Coins, Money */}
      <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-white/10 text-center">
        <div className="bg-black/30 rounded-lg p-1.5" title="Fama mediática y popularidad continental">
          <span className="text-[9px] text-gray-400 block font-bold flex items-center justify-center space-x-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-400" />
            <span>Fama</span>
          </span>
          <span className="text-xs font-black text-white">{player.fame}</span>
        </div>
        <div className="bg-black/30 rounded-lg p-1.5" title="Títulos oficiales ganados en clubes y selección">
          <span className="text-[9px] text-gray-400 block font-bold flex items-center justify-center space-x-0.5">
            <Trophy className="w-2.5 h-2.5 text-[#22E748]" />
            <span>Títulos</span>
          </span>
          <span className="text-xs font-black text-white">{player.trophies.length}</span>
        </div>
        <div className="bg-black/30 rounded-lg p-1.5" title="Monedas de Potrero para ventajas tácticas">
          <span className="text-[9px] text-gray-400 block font-bold flex items-center justify-center space-x-0.5">
            <Coins className="w-2.5 h-2.5 text-amber-400" />
            <span>Monedas</span>
          </span>
          <span className="text-xs font-black text-amber-300 font-mono">{player.coins || 0}</span>
        </div>
        <div className="bg-black/30 rounded-lg p-1.5" title="Dinero en cuenta bancaria para compras de vida">
          <span className="text-[9px] text-gray-400 block font-bold">Plata</span>
          <span className="text-xs font-black text-emerald-400 truncate block font-mono">
            ${(player.money).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
