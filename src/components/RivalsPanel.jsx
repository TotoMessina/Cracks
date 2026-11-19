import React from 'react';
import Flag from './Flag';
import { findClub, getCountryById } from '../data/clubs';

const POS = { delantero: 'DEL', enganche: 'ENG', arquero: 'ARQ' };

/** Season ranking (Balón de Oro, Botín de Oro...) with you highlighted. */
export function AwardRanking({ title, icon, rank, statLabel, statKey }) {
  if (!rank?.top?.length) return null;
  const rows = [...rank.top.slice(0, 5)];
  const youInTop = rows.some(r => r.isPlayer);
  return (
    <div className="p-3 rounded-xl bg-black/30 border border-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-black uppercase text-amber-300">{icon} {title}</span>
        <span className="text-[10px] font-mono text-gray-400">Vos: {rank.playerPos}°</span>
      </div>
      <ol className="space-y-0.5">
        {rows.map(r => (
          <li key={`${r.pos}-${r.name}`} className={`flex items-center gap-2 text-xs px-1.5 py-0.5 rounded ${r.isPlayer ? 'bg-[#22E748]/15 text-white font-black' : r.nemesis ? 'text-red-300 font-bold' : 'text-gray-300'}`}>
            <span className="font-mono text-gray-500 w-4 text-right">{r.pos}</span>
            <Flag code={r.country} size={10} title={getCountryById(r.country).name} />
            <span className="flex-1 truncate">{r.isPlayer ? `${r.name} (vos)` : r.name}{r.nemesis ? ' 😤' : ''}</span>
            <span className="font-mono text-gray-400 truncate max-w-[30%] hidden sm:inline">{r.clubName}</span>
            {statKey && <span className="font-mono font-bold w-8 text-right">{r[statKey] ?? 0}</span>}
          </li>
        ))}
        {!youInTop && (
          <li className="flex items-center gap-2 text-xs px-1.5 py-0.5 rounded bg-[#22E748]/10 text-white font-black mt-1">
            <span className="font-mono text-gray-500 w-4 text-right">{rank.playerPos}</span>
            <span className="flex-1">Vos</span>
          </li>
        )}
      </ol>
      {statLabel && <span className="text-[10px] text-gray-500 block mt-1">{statLabel}</span>}
    </div>
  );
}

/** Your generation: the nemesis and the best rivals, with their career record. */
export default function RivalsPanel({ player }) {
  const rivals = (player.rivals || []).filter(r => !r.retired || r.ballons > 0);
  if (!rivals.length) return null;
  const nemesis = (player.rivals || []).find(r => r.nemesis);
  const best = [...rivals].filter(r => !r.nemesis).sort((a, b) => b.ballons - a.ballons || b.ovr - a.ovr).slice(0, 8);
  const myBallons = (player.awards || []).filter(a => a.name.startsWith('Balón de Oro')).length;
  const duel = player.nemesisDuel || { wins: 0, losses: 0 };
  const statOf = (r) => r.position === 'arquero' ? `${r.totalCleanSheets} VI` : r.position === 'enganche' ? `${r.totalAssists} A` : `${r.totalGoals} G`;

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
      <h3 className="text-sm font-black uppercase tracking-wider text-[#22E748]">Tu generación</h3>

      {nemesis && (
        <div className="p-3 rounded-xl border border-red-500/40 bg-red-950/20">
          <span className="text-[10px] font-black uppercase text-red-300">😤 Tu némesis</span>
          <div className="flex items-center gap-2 mt-1">
            <Flag code={nemesis.country} size={14} />
            <span className="text-base font-black text-white">{nemesis.name}</span>
            <span className="text-[10px] text-gray-400 font-mono">{POS[nemesis.position]} · {nemesis.age} años · nivel {nemesis.ovr}{nemesis.retired ? ' · retirado' : ''}</span>
          </div>
          <p className="text-xs text-gray-300 mt-1">
            {findClub(nemesis.clubId)?.name || '—'} · {statOf(nemesis)} · {nemesis.titles} {nemesis.titles === 1 ? 'título' : 'títulos'} · 🌕 {nemesis.ballons} {nemesis.ballons === 1 ? 'Balón de Oro' : 'Balones de Oro'}
          </p>
          <p className="text-xs font-bold mt-1.5">
            <span className="text-[#22E748]">Vos {myBallons} {myBallons === 1 ? 'Balón' : 'Balones'}</span>
            <span className="text-gray-500"> · </span>
            <span className="text-gray-300">
              En la votación quedaste por encima {duel.wins} {duel.wins === 1 ? 'vez' : 'veces'} y por debajo {duel.losses} {duel.losses === 1 ? 'vez' : 'veces'}
            </span>
          </p>
        </div>
      )}

      <ol className="space-y-1">
        {best.map(r => (
          <li key={r.id} className="flex items-center gap-2 text-xs text-gray-300 px-2 py-1 rounded-lg bg-white/5">
            <Flag code={r.country} size={11} />
            <span className="flex-1 truncate font-bold text-white">{r.name}</span>
            <span className="font-mono text-gray-400">{POS[r.position]} · {r.ovr}</span>
            <span className="hidden sm:inline truncate max-w-[30%] text-gray-400">{r.retired ? 'retirado' : findClub(r.clubId)?.shortName}</span>
            <span className="font-mono w-14 text-right">{r.ballons > 0 ? `🌕 ${r.ballons}` : statOf(r)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
