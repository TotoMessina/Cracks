import React from 'react';
import Flag from './Flag';
import { Trophy, Award, Shield } from 'lucide-react';
import ClubShield from './ClubShield';
import { getClubById, COUNTRIES } from '../data/clubs';

export default function TrophyCabinet({ player }) {
  if (!player) return null;

  const isGk = player.position === 'arquero';
  const country = COUNTRIES.find(c => c.id === player.country) || COUNTRIES[0];
  const ntStats = player.nationalTeamStats || { matches: 0, goals: 0, cleanSheets: 0, titles: 0, trophies: [] };

  return (
    <div className="bg-[#0b130e] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#22E748] bg-[#22E748]/10 px-3 py-1 rounded-full border border-[#22E748]/20">
            Palmarés & Legado Histórico
          </span>
          <h2 className="text-2xl font-black text-white mt-2">
            Vitrina de Trofeos de {player.name}
          </h2>
        </div>

        {/* Global career totals */}
        <div className="flex items-center space-x-6 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Partidos
            </span>
            <span className="text-xl font-black text-white font-mono">
              {player.totalMatches}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              {isGk ? "Vallas Invictas" : "Goles Totales"}
            </span>
            <span className="text-xl font-black text-[#22E748] font-mono">
              {isGk ? player.totalCleanSheets : player.totalGoals}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Títulos
            </span>
            <span className="text-xl font-black text-yellow-400 font-mono">
              {player.trophies.length}
            </span>
          </div>
        </div>
      </div>

      {/* Statue Feature if Unlocked */}
      {player.hasStatue ? (
        <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border-2 border-[#F6B40E] rounded-2xl p-5 flex items-center space-x-5 shadow-[0_0_35px_rgba(246,180,14,0.2)]">
          <div className="text-6xl select-none filter drop-shadow-[0_0_10px_#F6B40E]">
            🗽
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#F6B40E] bg-[#F6B40E]/20 px-2.5 py-0.5 rounded border border-[#F6B40E]/40">
              Estatua de Bronce Erigida
            </span>
            <h3 className="text-xl font-black text-white mt-1">
              Monumento Histórico en las Puertas del Estadio
            </h3>
            <p className="text-xs text-amber-200/80 mt-1 max-w-xl">
              Alcanzaste el estatus sagrado de Leyenda. El club inmortalizó tu figura en bronce para que las futuras generaciones recuerden tus hazañas.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#0e1712] border border-dashed border-white/10 rounded-2xl p-5 flex items-center space-x-4 text-gray-400">
          <div className="text-4xl opacity-30 select-none">🗽</div>
          <div>
            <h4 className="text-sm font-bold text-gray-300">
              Estatua del Club: Pendiente
            </h4>
            <p className="text-xs text-gray-400">
              Necesitás alcanzar 95 puntos de Idolatría en un mismo club con lealtad, goles y campeonatos para que construyan tu monumento.
            </p>
          </div>
        </div>
      )}

      {/* National Team Career Showcase */}
      {(ntStats.matches > 0 || ntStats.calledUp) && (
        <div className="bg-gradient-to-r from-sky-950/40 via-[#071724]/60 to-sky-950/30 border border-sky-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 pb-3 border-b border-sky-500/20">
            <div className="flex items-center space-x-3">
              <Flag code={country.id} size={26} title={country.name} />
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/30">
                  Trayectoria Internacional
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {country.nationalTeam}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Partidos</span>
                <span className="text-base font-black text-white font-mono">{ntStats.matches}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">{isGk ? 'Vallas Invictas' : 'Goles'}</span>
                <span className="text-base font-black text-sky-400 font-mono">{isGk ? ntStats.cleanSheets : ntStats.goals}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Títulos</span>
                <span className="text-base font-black text-yellow-400 font-mono">{ntStats.titles || 0}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-sky-200/70">
            Defendiendo los colores patrios en Eliminatorias, Copas Continentales y Copas del Mundo FIFA.
          </p>
        </div>
      )}

      {/* Trophies Grid */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-300 mb-4 flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span>Campeonatos Conquistados ({player.trophies.length})</span>
        </h3>

        {player.trophies.length === 0 ? (
          <div className="text-center py-8 bg-[#09110d] rounded-2xl border border-white/5">
            <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-2 opacity-40" />
            <p className="text-sm text-gray-400">
              Todavía no ganaste ningún título oficial. ¡Seguí peleando las finales!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {player.trophies.map((tr, idx) => (
              <div
                key={idx}
                className="bg-[#0e1812] border border-yellow-500/30 hover:border-yellow-400 rounded-xl p-3 text-center transition-all hover:-translate-y-1 shadow-lg"
              >
                <div className="text-3xl mb-1 select-none">
                  {tr.icon || '🏆'}
                </div>
                <h4 className="text-xs font-black text-white leading-tight">
                  {tr.title}
                </h4>
                <p className="text-[10px] text-gray-400 mt-1">
                  {tr.clubName} • {tr.year}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Individual Awards */}
      {player.awards && player.awards.length > 0 && (
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-300 mb-4 flex items-center space-x-2">
            <Award className="w-4 h-4 text-[#22E748]" />
            <span>Premios y Distinciones Individuales</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {player.awards.map((aw, idx) => (
              <div
                key={idx}
                className="bg-[#0e1812] border border-[#22E748]/30 rounded-xl p-3 flex items-center space-x-3"
              >
                <div className="text-2xl">{aw.icon || '🎖️'}</div>
                <div>
                  <h4 className="text-xs font-black text-white">{aw.name}</h4>
                  <p className="text-[10px] text-gray-400">{aw.description} ({aw.year})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Club History Table */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-300 mb-4 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Trayectoria por Clubes</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-white/10 rounded-xl overflow-hidden">
            <thead className="bg-[#060c09] text-gray-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Club</th>
                <th className="p-3 text-center">Temporadas</th>
                <th className="p-3 text-center">Partidos</th>
                <th className="p-3 text-center">{isGk ? "Vallas" : "Goles"}</th>
                <th className="p-3 text-center">Títulos</th>
                <th className="p-3 text-right">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#09110d]">
              {player.clubHistory.map((ch, idx) => {
                const club = getClubById(ch.clubId);

                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 flex items-center space-x-3 font-bold text-white">
                      <ClubShield club={club} size={28} />
                      <span>{ch.clubName}</span>
                    </td>
                    <td className="p-3 text-center font-mono">{ch.seasons}</td>
                    <td className="p-3 text-center font-mono">{ch.matches}</td>
                    <td className="p-3 text-center font-mono font-bold text-[#22E748]">
                      {isGk ? ch.cleanSheets : ch.goals}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-yellow-400">
                      {ch.titles}
                    </td>
                    <td className="p-3 text-right">
                      {ch.leftAsRival ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-700/60">
                          Traidor
                        </span>
                      ) : ch.maxIdolatry >= 95 ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-yellow-950 text-yellow-400 border border-yellow-700/60">
                          Leyenda 🗽
                        </span>
                      ) : ch.maxIdolatry >= 70 ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/60">
                          Ídolo ⭐
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          Respetado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
