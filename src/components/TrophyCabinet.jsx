import React, { useState } from 'react';
import Flag from './Flag';
import ClubShield from './ClubShield';
import { getClubById, COUNTRIES } from '../data/clubs';
import { getNationalCareer, NT_STATUS_LABEL } from '../game/career';
import CareerHighlights from './CareerHighlights';
import CareerTimeline from './CareerTimeline';
import RivalsPanel from './RivalsPanel';
import { clubRecord, nationalRecord, RECORD_INFO } from '../game/records';
import { CHALLENGES } from '../game/challenges';

/** Groups repeated entries ("Liga Profesional" x4) so the cabinet stays short. */
function groupBy(items, keyOf) {
  const map = new Map();
  items.forEach(it => {
    const key = keyOf(it);
    const g = map.get(key) || { key, item: it, count: 0, years: [] };
    g.count += 1;
    if (it.year) g.years.push(it.year);
    map.set(key, g);
  });
  return [...map.values()].sort((a, b) => b.count - a.count);
}

const yearsText = (years) => {
  const ys = [...new Set(years)].sort();
  return ys.length > 4 ? `${ys.slice(0, 3).join(', ')}… ${ys[ys.length - 1]}` : ys.join(', ');
};

function Empty({ children }) {
  return <p className="text-center text-sm text-gray-400 py-8 bg-black/20 rounded-2xl border border-white/5">{children}</p>;
}

function StatusBadge({ ch }) {
  if (ch.leftAsRival) return <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-700/60">Traidor</span>;
  if (ch.maxIdolatry >= 95) return <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-400 border border-yellow-700/60">Leyenda 🗽</span>;
  if (ch.maxIdolatry >= 70) return <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/60">Ídolo ⭐</span>;
  return <span className="text-[10px] text-gray-400">Respetado</span>;
}

export default function TrophyCabinet({ player }) {
  const [tab, setTab] = useState('titulos');
  if (!player) return null;

  const isGk = player.position === 'arquero';
  const country = COUNTRIES.find(c => c.id === player.country) || COUNTRIES[0];
  const ntStats = player.nationalTeamStats || { matches: 0, goals: 0, cleanSheets: 0, titles: 0, trophies: [] };
  const nt = getNationalCareer(player);
  const trophies = groupBy(player.trophies || [], t => t.title);
  const awards = groupBy(player.awards || [], a => a.name.replace(/\s\d{4}$/, ''));

  const tabs = [
    { id: 'titulos', label: 'Títulos' },
    { id: 'premios', label: 'Premios' },
    { id: 'clubes', label: 'Clubes' },
    { id: 'rivales', label: 'Rivales' },
    { id: 'historia', label: 'Historia' },
  ];

  return (
    <div className="panel p-3.5 sm:p-6 space-y-3 sm:space-y-4">
      {/* Header: name + career totals in one row */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#22E748]">Palmarés</span>
          <h2 className="text-lg sm:text-2xl font-black text-white leading-tight truncate">{player.name}</h2>
        </div>
        <div className="flex items-center gap-3 sm:gap-6 text-center shrink-0">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-400 block">PJ</span>
            <span className="text-base sm:text-xl font-black text-white font-mono">{player.totalMatches}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-400 block">{isGk ? 'Vallas' : 'Goles'}</span>
            <span className="text-base sm:text-xl font-black text-[#22E748] font-mono">{isGk ? player.totalCleanSheets : player.totalGoals}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-400 block">Títulos</span>
            <span className="text-base sm:text-xl font-black text-yellow-400 font-mono">{player.trophies.length}</span>
          </div>
        </div>
      </div>

      {player.challenge && (
        <div className={`px-3 py-2 rounded-xl border text-xs font-bold ${player.challenge.status === 'done' ? 'border-[#F6B40E]/60 bg-[#F6B40E]/10 text-[#F6B40E]' : player.challenge.status === 'failed' ? 'border-red-500/40 bg-red-950/30 text-red-300' : 'border-white/10 bg-black/30 text-gray-300'}`}>
          {CHALLENGES[player.challenge.id]?.icon} Desafío "{CHALLENGES[player.challenge.id]?.title}" con {player.challenge.clubName}: {player.challenge.status === 'done' ? 'cumplido' : player.challenge.status === 'failed' ? 'no cumplido' : 'en curso'}
        </div>
      )}
      {player.hasStatue && (
        <div className="px-3 py-2 rounded-xl border border-[#F6B40E]/60 bg-[#F6B40E]/10 text-xs font-black text-[#F6B40E] flex items-center gap-2">
          <span className="text-xl">🗽</span> Tenés tu estatua en {player.statueClubName || 'el club'}
        </div>
      )}

      <div className="segmented overflow-x-auto no-scrollbar" role="tablist">
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'titulos' && (
        trophies.length === 0 ? <Empty>Todavía no ganaste ningún título. ¡Seguí peleando las finales!</Empty> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {trophies.map(g => (
              <div key={g.key} className="bg-[#0e1812] border border-yellow-500/30 rounded-xl p-2.5 flex items-center gap-2 min-w-0">
                <span className="text-2xl select-none shrink-0">{g.item.icon || '🏆'}</span>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-black text-white leading-tight line-clamp-2">
                    {g.key}{g.count > 1 && <span className="text-yellow-400"> ×{g.count}</span>}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">{yearsText(g.years)}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'premios' && (
        awards.length === 0 ? <Empty>Sin premios individuales por ahora.</Empty> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {awards.map(g => (
              <div key={g.key} className="bg-[#0e1812] border border-[#22E748]/30 rounded-xl p-2.5 flex items-center gap-2.5">
                <span className="text-xl shrink-0">{g.item.icon || '🎖️'}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white truncate">
                    {g.key}{g.count > 1 && <span className="text-[#22E748]"> ×{g.count}</span>}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate">{yearsText(g.years) || g.item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'clubes' && (
        <div className="space-y-2">
          {(ntStats.matches > 0 || ntStats.calledUp) && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-sky-500/30 bg-sky-950/30">
              <div className="flex items-center gap-2 min-w-0">
                <Flag code={country.id} size={18} title={country.name} />
                <div className="min-w-0">
                  <span className="text-xs font-black text-white block truncate">{country.nationalTeam}</span>
                  <span className="text-[10px] text-sky-300 font-bold">{NT_STATUS_LABEL[nt.status]}{nt.shirt ? ` · #${nt.shirt}` : ''}</span>
                </div>
              </div>
              {(() => {
                const rec = nationalRecord(player.country, player.position);
                const beaten = (player.recordsBroken || []).includes(`national:${player.country}`);
                return (
                  <span className={`hidden sm:block text-[10px] ${beaten ? 'text-amber-300 font-bold' : 'text-gray-400'}`}>
                    📜 {beaten ? 'Récord tuyo' : `Récord: ${rec.holder} (${rec.value})`}
                  </span>
                );
              })()}
              <span className="text-[11px] font-mono text-sky-200 shrink-0">
                {ntStats.matches} PJ · {isGk ? ntStats.cleanSheets : ntStats.goals} {isGk ? 'VI' : 'G'} · {ntStats.titles || 0} 🏆
              </span>
            </div>
          )}
          {player.clubHistory.map((ch, idx) => (
            <div key={idx} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-[#09110d] border border-white/5">
              <ClubShield club={getClubById(ch.clubId)} size={26} />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black text-white block truncate">{ch.clubName}{ch.loan && <span className="text-sky-300 font-bold"> · cedido</span>}</span>
                <span className="text-[10px] font-mono text-gray-400">
                  {ch.seasons} temp. · {ch.matches} PJ · <span className="text-[#22E748]">{isGk ? ch.cleanSheets : ch.goals} {isGk ? 'VI' : 'G'}</span> · <span className="text-yellow-400">{ch.titles} 🏆</span>
                </span>
                {(() => {
                  const rec = clubRecord(getClubById(ch.clubId), player.position);
                  if (!rec) return null;
                  const mine = ch[rec.stat] || 0;
                  const beaten = (player.recordsBroken || []).includes(`club:${ch.clubId}`);
                  return (
                    <span className={`block text-[10px] ${beaten ? 'text-amber-300 font-bold' : 'text-gray-500'}`}>
                      📜 {beaten ? `Récord tuyo: superaste a ${rec.holder} (${rec.value})` : `Récord: ${rec.holder}, ${rec.value} ${RECORD_INFO[rec.stat].unit} · vos ${mine}`}
                    </span>
                  );
                })()}
              </div>
              <StatusBadge ch={ch} />
            </div>
          ))}
          {!player.hasStatue && (
            <p className="text-[11px] text-gray-400 px-1">🗽 Estatua: 95 de idolatría y 5 temporadas en un mismo club.</p>
          )}
        </div>
      )}

      {tab === 'rivales' && (
        (player.rivals || []).length ? <RivalsPanel player={player} /> : <Empty>Tu generación aparece al jugar la primera temporada.</Empty>
      )}

      {tab === 'historia' && (
        <div className="space-y-3">
          <CareerTimeline player={player} />
          <CareerHighlights player={player} compact />
        </div>
      )}
    </div>
  );
}
