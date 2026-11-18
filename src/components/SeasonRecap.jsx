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

function CompetitionRow({ icon, name, status, tone = 'text-gray-300', note }) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 py-2 rounded-xl bg-black/30 border border-white/5">
      <span className="text-xs font-bold text-white min-w-0">
        {icon} {name}
        {note && <span className="block text-[10px] font-normal text-gray-400">{note}</span>}
      </span>
      <span className={`text-xs font-black text-right flex-shrink-0 ${tone}`}>{status}</span>
    </div>
  );
}

/** How every competition of the season went + next season's qualification. */
function CompetitionsSummary({ recap }) {
  const comps = recap.competitions;
  if (!comps) return null;
  const finals = recap.finalsPlayed || [];
  const finalOf = (kind) => finals.find(f => f.kind === kind);
  const rows = [];

  const lg = comps.league;
  if (lg) {
    const decider = finalOf('league');
    const promo = finalOf('promotion');
    let status = `${recap.leagueStanding?.position ?? lg.position}° de ${lg.total}`;
    let tone = 'text-gray-300';
    let note = null;
    if (lg.champion) { status = '🏆 Campeón'; tone = 'text-yellow-300'; }
    else if (decider) {
      status = decider.won ? '🏆 Campeón en la última fecha' : '🥈 Subcampeón';
      tone = decider.won ? 'text-yellow-300' : 'text-gray-200';
      note = `Definición vs ${decider.opponent}`;
    } else if (lg.directPromotion) { status = '🎖️ Ascenso directo'; tone = 'text-[#22E748]'; }
    else if (promo) {
      status = promo.won ? '🎖️ Ascenso por el reducido' : `${lg.position}° · perdió el reducido`;
      tone = promo.won ? 'text-[#22E748]' : 'text-gray-300';
    }
    rows.push({ icon: '📋', name: lg.name, status, tone, note });
  }

  const cup = comps.cup;
  if (cup) {
    const f = finalOf('cup');
    let status = cup.eliminatedBy ? `Afuera en ${cup.reached.toLowerCase()}` : cup.reached;
    let tone = 'text-gray-300';
    let note = cup.eliminatedBy ? `Eliminado por ${cup.eliminatedBy}` : null;
    if (f) {
      status = f.won ? '🏆 Campeón' : '🥈 Finalista';
      tone = f.won ? 'text-yellow-300' : 'text-gray-200';
      note = `Final vs ${f.opponent}`;
    }
    if (cup.upset) note = note ? `${note} · ${cup.upset}` : cup.upset;
    rows.push({ icon: '🥇', name: cup.name, status, tone, note });
  }

  const cont = comps.continental;
  if (cont) {
    const f = finalOf('continental');
    let status;
    let note = null;
    let tone = 'text-gray-300';
    if (f) {
      status = f.won ? '⭐ Campeón' : '🥈 Finalista';
      tone = f.won ? 'text-yellow-300' : 'text-gray-200';
      note = `Final vs ${f.opponent}`;
    } else if (!cont.group.advanced) {
      status = 'Afuera en grupos';
      note = `${cont.group.position}° del grupo con ${cont.group.points} pts`;
    } else {
      status = `Afuera en ${cont.reached.toLowerCase()}`;
      note = cont.eliminatedBy ? `Eliminado por ${cont.eliminatedBy}` : null;
    }
    rows.push({ icon: '🌎', name: cont.name, status, tone, note });
  }

  // Supercups / Recopa / Intercontinental played at the start of this season
  [...(recap.titleMatches || [])].reverse().forEach(k => {
    rows.unshift({
      icon: k.titleKind === 'intercontinental' ? '🌍' : '🏅',
      name: k.tournament,
      status: k.won ? '🏆 Campeón' : '🥈 Perdida',
      tone: k.won ? 'text-yellow-300' : 'text-gray-300',
      note: `vs ${k.opponentName}${k.auto ? ' · simulado' : ''}`,
    });
  });

  const q = recap.qualifiedFor;
  const nextSc = recap.nextSupercups || [];
  const obj = recap.objective;
  const moves = recap.worldMoves || [];
  const ups = moves.filter(m => m.type === 'promoted');
  const downs = moves.filter(m => m.type === 'relegated');
  return (
    <div className="mb-3 space-y-1.5">
      <span className="text-[10px] uppercase font-black text-gray-400 block">Competencias</span>
      {obj && (
        <div className={`px-3 py-2 rounded-xl border text-xs font-bold ${obj.met ? 'border-[#22E748]/40 bg-[#22E748]/10 text-[#22E748]' : 'border-red-500/40 bg-red-500/10 text-red-300'}`}>
          {obj.icon} Objetivo de la dirigencia: {obj.label} — {obj.met ? '✅ cumplido (+8 con el DT, +4 idolatría, +3 🪙)' : `❌ no cumplido (${obj.effects.dt} con el DT)`}
        </div>
      )}
      {recap.relegated && (
        <div className="px-3 py-2 rounded-xl border border-red-500/50 bg-red-950/40 text-xs font-black text-red-200">
          ⬇️ ¡DESCENSO! Tu club juega en segunda la próxima temporada. Por la cláusula de descenso te podés ir gratis.
        </div>
      )}
      {rows.map((r, i) => <CompetitionRow key={i} {...r} />)}
      {(ups.length > 0 || downs.length > 0) && (
        <div className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-[11px] text-gray-300">
          {ups.length > 0 && <span className="block">⬆️ Ascienden: {ups.map(m => m.name).join(', ')}</span>}
          {downs.length > 0 && <span className="block">⬇️ Descienden: {downs.map(m => m.name).join(', ')}</span>}
        </div>
      )}
      {nextSc.length > 0 && (
        <div className="px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-200">
          🏅 Te ganaste: {nextSc.map(sc => `${sc.tournament} vs ${sc.opponent.name}`).join(' · ')} (al arrancar la próxima temporada)
        </div>
      )}
      <div className={`px-3 py-2 rounded-xl border text-xs font-bold ${q?.name ? 'border-sky-500/40 bg-sky-500/10 text-sky-200' : 'border-white/10 bg-white/5 text-gray-400'}`}>
        {q?.name
          ? `✈️ Próxima temporada: ${q.name}${q.viaCup ? ' (por ganar la copa)' : ''}`
          : '✈️ Próxima temporada: sin copa internacional'}
      </div>
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
          value={recap.titles?.length ? `🏆 ${recap.titles.length} ${recap.titles.length === 1 ? 'título' : 'títulos'}` : recap.reachedFinal ? '🥈 Finalista' : `${recap.leagueStanding?.position}° puesto`}
          tone={recap.wonFinal ? 'text-yellow-400 text-base' : 'text-gray-200 text-base'}
          sub={`+${recap.coinsEarned || 5} 🪙 · ${recap.idolatryGain >= 0 ? '+' : ''}${recap.idolatryGain || 0} idolatría`}
        />
      </div>

      {recap.endEnergy !== undefined && (
        <div className="mb-3 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] uppercase font-black text-gray-400 mr-1">Desgaste:</span>
          <span className="chip">{{ rotacion: '🔄 Rotaste', normal: '⚖️ Carga normal', total: '🔥 Jugaste todo' }[recap.workload] || '⚖️ Carga normal'}</span>
          <span className={`chip ${recap.endEnergy < 50 ? 'chip-down' : recap.endEnergy >= 75 ? 'chip-up' : ''}`}>
            ⚡ Terminaste con {recap.endEnergy}% de energía
          </span>
          {recap.startEnergy < 70 && <span className="chip chip-down">Arrancaste cansado: rendiste menos</span>}
        </div>
      )}

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

      {recap.contractYearsLeft !== undefined && !player?.isRetired && (
        <div className={`mb-3 px-3 py-2 rounded-xl border text-xs font-bold ${recap.contractYearsLeft === 0 ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-white/5 border-white/10 text-gray-300'}`}>
          📝 {recap.contractYearsLeft === 0
            ? 'Se terminó tu contrato: este receso sos libre de elegir club.'
            : `Te ${recap.contractYearsLeft === 1 ? 'queda 1 año' : `quedan ${recap.contractYearsLeft} años`} de contrato. Solo te vas si un club paga tu cláusula.`}
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

      {recap.ntMessages?.length > 0 && (
        <div className="mb-3 space-y-1">
          {recap.ntMessages.map((m, i) => (
            <div key={i} className="px-3 py-2 rounded-xl border border-sky-500/30 bg-sky-500/5 text-xs font-bold text-sky-200">🎽 {m}</div>
          ))}
        </div>
      )}

      <CompetitionsSummary recap={recap} />

      {(recap.titles?.length ? recap.titles.map(t => t.title) : recap.wonFinal ? [recap.tournamentName] : []).map((t, i) => (
        <div key={i} className="mb-2 p-3 bg-yellow-950/30 border border-yellow-500/40 rounded-xl text-xs font-bold text-yellow-300 text-center">
          🏆 ¡Levantaste {t}! La hinchada salió a festejar a las calles.
        </div>
      ))}
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
