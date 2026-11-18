import React from 'react';
import Flag from './Flag';
import { Sparkles, ArrowRight } from 'lucide-react';
import { EFFECT_LABELS, describeEffects } from '../game/effects';
import { leagueName } from '../game/career';

const STEP_LABEL = {
  dilemma: 'Continuar: dilema de la temporada',
  transfers: 'Continuar: mercado de pases',
  cards: 'Continuar: pretemporada',
};

function StatTile({ label, value, tone = 'text-white', sub }) {
  return (
    <div className="stat-tile">
      <span className="text-[10px] text-gray-400 uppercase font-bold block">{label}</span>
      <span className={`text-xl font-black font-mono ${tone}`}>{value}</span>
      {sub && <span className="text-[10px] text-gray-400 font-bold block truncate">{sub}</span>}
    </div>
  );
}

export default function SeasonRecap({ recap, player, onContinue }) {
  if (!recap) return null;
  const isGk = player?.position === 'arquero';
  const totalIncome = recap.earnings + (recap.passiveIncome || 0) + (recap.titleBonus || 0);
  const changes = Object.entries(recap.statChanges || {});
  const league = leagueName(recap.leagueStanding?.league || player?.currentClub?.league);

  return (
    <div className="mt-5 recap-card animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-white/5">
        <span className="text-xs font-black uppercase text-[#22E748] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Resumen de la temporada {recap.year}
        </span>
        <span className="text-xs font-mono font-bold text-gray-400">
          {recap.matches} partidos{recap.missedMatches ? ` · ${recap.missedMatches} afuera por lesión` : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center mb-4">
        <StatTile label={isGk ? 'Vallas invictas' : 'Goles'} value={`+${isGk ? recap.cleanSheets : recap.goals}`} tone="text-[#22E748]" />
        <StatTile label="Asistencias" value={`+${recap.assists}`} />
        <StatTile
          label="Ingresos"
          value={`$${totalIncome.toLocaleString('es-AR')}`}
          tone="text-emerald-400 text-base sm:text-lg"
          sub={[
            recap.titleBonus ? `+$${recap.titleBonus.toLocaleString('es-AR')} premio` : null,
            recap.passiveIncome ? `+$${recap.passiveIncome.toLocaleString('es-AR')} rentas` : null,
          ].filter(Boolean).join(' · ') || 'sueldo'}
        />
        <StatTile
          label="Resultado"
          value={recap.wonFinal ? '🏆 Campeón' : recap.reachedFinal ? '🥈 Finalista' : `${recap.leagueStanding?.position}° puesto`}
          tone={recap.wonFinal ? 'text-yellow-400 text-base' : 'text-gray-200 text-base'}
          sub={`+${recap.coinsEarned || 5} 🪙 · ${recap.idolatryGain >= 0 ? '+' : ''}${recap.idolatryGain || 0} idolatría`}
        />
      </div>

      {recap.keyMatches?.length > 0 && (
        <div className="mb-3 space-y-1.5">
          <span className="text-[10px] uppercase font-black text-gray-400 block">Partidos clave</span>
          {recap.keyMatches.map(k => (
            <div key={k.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs ${k.won ? 'bg-[#22E748]/5 border-[#22E748]/30' : 'bg-red-500/5 border-red-500/30'}`}>
              <span className="font-bold text-white">{k.won ? '✅' : '❌'} {k.title}{k.auto ? <span className="text-gray-500 font-normal"> · simulado</span> : null}</span>
              <span className="flex flex-wrap gap-1">
                {describeEffects(player, k.won ? k.stakes?.win : k.stakes?.lose).filter(e => e.applies).map(e => (
                  <span key={e.key} className={`chip ${e.positive ? 'chip-up' : 'chip-down'}`}>{e.label} {e.text}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      {changes.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] uppercase font-black text-gray-400 mr-1">Evolución:</span>
          {changes.map(([k, v]) => (
            <span key={k} className={`chip ${v > 0 ? 'chip-up' : 'chip-down'}`}>
              {EFFECT_LABELS[k] || k} {v > 0 ? `+${v}` : v}
            </span>
          ))}
        </div>
      )}

      {recap.injury && (
        <div className="mb-3 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-3">
          <span className="text-2xl select-none">🤕</span>
          <div>
            <span className="font-black text-red-200 block">{recap.injury.name}</span>
            <span className="text-[11px] text-red-300/80">{recap.injury.desc} Te perdiste {recap.injury.missedMatches} partidos.</span>
          </div>
        </div>
      )}

      {recap.nationalTeam && (
        <div className="mb-3 p-3 bg-sky-950/40 border border-sky-500/40 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Flag code={player?.country} size={20} title={recap.nationalTeam.countryName} />
            <div className="min-w-0">
              <span className="font-black text-white block truncate">
                {recap.nationalTeam.nationalTeamName} · {recap.nationalTeam.tournament.name}
              </span>
              <span className="text-[11px] text-sky-300 font-mono">
                {recap.nationalTeam.matches} PJ · +{isGk ? recap.nationalTeam.cleanSheets : recap.nationalTeam.goals} {isGk ? 'vallas invictas' : 'goles'}
              </span>
            </div>
          </div>
          {recap.wonNationalFinal ? (
            <span className="px-2.5 py-1 rounded-lg bg-yellow-400 text-black font-black text-[10px] flex-shrink-0">🏆 ¡CAMPEÓN!</span>
          ) : recap.nationalTeam.reachedFinal ? (
            <span className="px-2 py-0.5 rounded bg-sky-900 text-sky-300 text-[10px] font-bold flex-shrink-0">Subcampeón</span>
          ) : null}
        </div>
      )}

      {recap.wonFinal && (
        <div className="mb-3 p-3 bg-yellow-950/30 border border-yellow-500/40 rounded-xl text-xs font-bold text-yellow-300 text-center">
          🏆 ¡Levantaste {recap.tournamentName}! La hinchada salió a festejar a las calles.
        </div>
      )}
      {recap.promotedToPrimera && (
        <div className="mb-3 p-3 bg-emerald-950/40 border border-[#22E748]/50 rounded-xl text-xs font-black text-[#22E748] text-center">
          🎉 ¡ASCENSO HISTÓRICO! {player?.currentClub?.name} juega en {leagueName(player?.currentClub?.league)} la próxima temporada.
        </div>
      )}

      {recap.earnedStatue && (
        <div className="mb-3 p-4 bg-[#F6B40E]/10 border border-[#F6B40E]/50 rounded-xl text-center animate-pop">
          <div className="text-4xl">🗽</div>
          <p className="text-sm font-black text-gold mt-1">¡INAUGURARON TU ESTATUA EN {player?.currentClub?.name?.toUpperCase()}!</p>
          <p className="text-[11px] text-amber-200/80">Sos leyenda eterna del club.</p>
        </div>
      )}

      {recap.newAwards?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {recap.newAwards.map((a, i) => (
            <span key={i} className="chip chip-gold">{a.icon} {a.name}</span>
          ))}
        </div>
      )}

      {recap.leagueStanding && (
        <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
            <span className="text-[10px] font-black uppercase text-gray-400">Tabla · {league}</span>
            <span className="text-xs font-mono font-bold text-white">
              {recap.leagueStanding.position}° de {recap.leagueStanding.totalTeams} ({recap.leagueStanding.points} pts)
            </span>
          </div>
          <ol className="space-y-1">
            {recap.leagueStanding.miniTable.map((t, i) => (
              <li
                key={`${t.pos}-${t.name}`}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${
                  t.isPlayerTeam ? 'bg-[#22E748]/15 border border-[#22E748]/50 text-white font-black' : 'text-gray-300'
                } ${i > 0 && t.pos - recap.leagueStanding.miniTable[i - 1].pos > 1 ? 'mt-2' : ''}`}
              >
                <span className={`w-1 h-4 rounded-full ${t.zone === 'campeon' ? 'bg-yellow-400' : t.zone === 'copa' ? 'bg-sky-400' : t.zone === 'descenso' ? 'bg-red-500' : 'bg-white/10'}`} />
                <span className="font-mono text-gray-500 w-5 text-right">{t.pos}</span>
                <span className="flex-1 truncate">{t.name}</span>
                <span className="font-mono font-bold">{t.points}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {player?.offseasonStep && !player?.isRetired && (
        <button onClick={onContinue} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
          {STEP_LABEL[player.offseasonStep] || 'Continuar'}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
