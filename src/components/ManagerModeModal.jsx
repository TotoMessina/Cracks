import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Briefcase, Trophy, Play, X, RotateCcw, AlertTriangle, Star } from 'lucide-react';
import { sound } from '../utils/audio';
import { getManagerCareer, saveManagerCareer } from '../utils/storage';
import ClubShield from './ClubShield';
import {
  DT_STYLES, FORMATIONS, APPROACHES, CABALAS,
  createManager, normalizeManager, simulateManagerSeason, applyManagerSeason,
  signWithClub, getDtClubs, getDtLeagues, getPrestige, getLeagueLabel, getTactics,
} from '../game/manager';

function clearManagerSave() {
  try { localStorage.removeItem('el_idolo_manager_career_v1'); } catch { /* ignore */ }
}

const VERDICT = {
  praised: { text: 'La dirigencia te ama: ¡objetivo cumplido y renovación asegurada!', cls: 'bg-[#22E748]/10 border-[#22E748]/40 text-[#22E748]' },
  ok: { text: 'Temporada dentro de lo esperado. La dirigencia te respalda.', cls: 'bg-white/5 border-white/10 text-gray-300' },
  warning: { text: '⚠️ La dirigencia está preocupada: otra mala temporada y te echan.', cls: 'bg-amber-500/10 border-amber-500/40 text-amber-300' },
  fired: { text: '🚪 ¡Te echaron! (un descenso o dos malas temporadas no se perdonan). Elegí un club nuevo.', cls: 'bg-red-500/10 border-red-500/40 text-red-300' },
};

export default function ManagerModeModal({ initialDtName = 'El Míster', legacy = null, onClose }) {
  const [manager, setManager] = useState(() => normalizeManager(getManagerCareer()));
  const [setup, setSetup] = useState(() => ({
    name: `DT ${initialDtName}`,
    style: 'lirico',
    cabala: 'traje_negro',
    clubId: legacy?.clubId && getDtClubs().some(c => c.id === legacy.clubId) ? legacy.clubId : 1001,
  }));
  const [setupLeague, setSetupLeague] = useState(() => {
    const legacyClub = legacy?.clubId ? getDtClubs().find(c => c.id === legacy.clubId) : null;
    return legacyClub?.league || 'arg_ascenso';
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [seasonLog, setSeasonLog] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const commit = (next) => {
    setManager(next);
    if (next) saveManagerCareer(next);
  };

  const clubs = [...getDtClubs(setupLeague)].sort((a, b) => b.reputation - a.reputation);
  const startPrestige = getPrestige(createManager({ clubId: 1001, legacy }));

  const handleStart = () => {
    sound.playWhistle();
    commit(createManager({ ...setup, legacy }));
  };

  const handleSimulate = () => {
    if (!manager || isSimulating || manager.fired) return;
    sound.playWhistle();
    setIsSimulating(true);
    setSeasonLog(null);
    timerRef.current = setTimeout(() => {
      const result = simulateManagerSeason(manager);
      const next = applyManagerSeason(manager, result);
      commit(next);
      setSeasonLog(result);
      setIsSimulating(false);
      if (result.titles.length) {
        sound.playFanfare();
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } else if (result.verdict === 'fired') {
        sound.playBuzzer();
      }
    }, 900);
  };

  const handleSign = (clubId) => {
    sound.playTrophy();
    commit(signWithClub(manager, clubId));
    setSeasonLog(null);
  };

  const handleReset = () => {
    sound.playClick();
    clearManagerSave();
    setManager(null);
    setSeasonLog(null);
    setConfirmReset(false);
  };

  const updateTactic = (key, value) => commit({ ...manager, [key]: value });

  const tactics = manager ? getTactics(manager) : null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-[#0a120e] border-2 border-[#22E748]/40 rounded-3xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-[0_0_50px_rgba(34,231,72,0.2)] overflow-hidden animate-pop">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="logo-badge"><Briefcase className="w-5 h-5 text-black" /></div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#22E748]">Del césped al banco</span>
              <h2 className="font-display text-2xl sm:text-3xl text-white leading-none">Modo DT</h2>
            </div>
          </div>
          <button onClick={() => { sound.playClick(); onClose(); }} className="icon-btn" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {!manager ? (
            /* ---------- SETUP ---------- */
            <div className="space-y-5">
              {legacy && (
                <div className="p-3 rounded-xl border border-[#F6B40E]/40 bg-[#F6B40E]/10 text-xs text-amber-200 flex gap-2">
                  <Star className="w-4 h-4 flex-shrink-0 text-[#F6B40E]" />
                  <span>
                    Tu carrera como jugador pesa: arrancás con más prestigio
                    {legacy.clubName ? <> y en <strong>{legacy.clubName}</strong> la hinchada te banca (+3 de poder dirigiendo ahí)</> : null}.
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase tracking-wide">Nombre del entrenador</label>
                <input
                  type="text"
                  value={setup.name}
                  onChange={(e) => setSetup(s => ({ ...s, name: e.target.value }))}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:border-[#22E748] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-2 uppercase tracking-wide">Filosofía de juego</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DT_STYLES.map(st => (
                    <button
                      key={st.id}
                      onClick={() => { sound.playClick(); setSetup(s => ({ ...s, style: st.id })); }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${setup.style === st.id ? 'bg-[#122619] border-[#22E748]' : 'bg-black/30 border-white/10 hover:border-white/20'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-black text-white">{st.title}</h4>
                        <span className="text-[10px] font-bold text-[#22E748] bg-[#22E748]/10 px-2 py-0.5 rounded">{st.badge}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{st.desc}</p>
                      <p className="text-[10px] font-mono text-gray-500 mt-1">ATQ {st.att >= 0 ? '+' : ''}{st.att} · DEF {st.def >= 0 ? '+' : ''}{st.def}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-2 uppercase tracking-wide">Cábala del banco</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CABALAS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { sound.playClick(); setSetup(s => ({ ...s, cabala: c.id })); }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${setup.cabala === c.id ? 'bg-[#122619] border-[#22E748]' : 'bg-black/30 border-white/10 hover:border-white/20'}`}
                    >
                      <span className="text-xs font-black text-white block">{c.name}</span>
                      <span className="text-[11px] text-gray-400">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1 uppercase tracking-wide">Club para debutar</label>
                <p className="text-[11px] text-gray-500 mb-2">Tu prestigio inicial ({startPrestige}) define qué clubes te ofrecen el cargo.</p>
                <select
                  value={setupLeague}
                  onChange={(e) => setSetupLeague(e.target.value)}
                  className="w-full mb-2 bg-[#0a120e] border border-white/10 rounded-lg p-2 text-xs font-bold text-white"
                >
                  {getDtLeagues().map(l => <option key={l.id} value={l.id}>{l.name} ({l.countryName})</option>)}
                </select>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {clubs.map(club => {
                    const locked = club.reputation > startPrestige + 4 && club.id !== legacy?.clubId;
                    const selected = setup.clubId === club.id;
                    return (
                      <button
                        key={club.id}
                        disabled={locked}
                        onClick={() => { sound.playClick(); setSetup(s => ({ ...s, clubId: club.id })); }}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          selected ? 'bg-[#122619] border-[#22E748]' : locked ? 'bg-black/20 border-white/5 opacity-40' : 'bg-black/30 border-white/10 hover:border-white/20 cursor-pointer'
                        }`}
                        title={locked ? 'Necesitás más prestigio' : ''}
                      >
                        <ClubShield club={club} size={28} />
                        <span className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">{club.shortName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{club.reputation} · {getLeagueLabel(club.league)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={handleStart} className="btn-primary w-full">Asumir el cargo ➔</button>
            </div>
          ) : (
            /* ---------- HUB ---------- */
            <div className="space-y-5">
              <div className="panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ClubShield club={manager.club} size={48} />
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-[#22E748] uppercase tracking-wider">
                      {manager.club.name} · {getLeagueLabel(manager.club.league)} · Año {manager.seasons + 1}
                    </span>
                    <h3 className="text-xl font-black text-white truncate">{manager.name}</h3>
                    <p className="text-[11px] text-gray-400">
                      Prestigio {getPrestige(manager)}{manager.qualifiedFor?.name ? ` · Juega la ${manager.qualifiedFor.name}` : ''}
                      {manager.strikes > 0 && <span className="text-amber-400"> · Cargo en peligro</span>}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right flex-shrink-0">
                  <span className="text-xs font-black uppercase text-amber-400 block">🏆 {manager.titles} títulos</span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {manager.matches} PJ · {manager.wins}G {manager.draws}E {manager.losses}P
                  </span>
                </div>
              </div>

              {/* Tactics — they all affect the simulation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className="bg-black/40 border border-white/10 rounded-xl p-3 block">
                  <span className="text-[10px] text-gray-400 uppercase font-black block mb-1">Esquema</span>
                  <select value={manager.formation} onChange={(e) => updateTactic('formation', e.target.value)} className="w-full bg-[#0a120e] border border-white/10 rounded-lg p-2 text-xs font-bold text-white">
                    {Object.entries(FORMATIONS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
                  </select>
                </label>
                <label className="bg-black/40 border border-white/10 rounded-xl p-3 block">
                  <span className="text-[10px] text-gray-400 uppercase font-black block mb-1">Postura</span>
                  <select value={manager.approach} onChange={(e) => updateTactic('approach', e.target.value)} className="w-full bg-[#0a120e] border border-white/10 rounded-lg p-2 text-xs font-bold text-white">
                    {Object.entries(APPROACHES).map(([k, a]) => <option key={k} value={k}>{a.label}</option>)}
                  </select>
                </label>
                <div className="bg-black/40 border border-white/10 rounded-xl p-3">
                  <span className="text-[10px] text-gray-400 uppercase font-black block mb-1">Balance táctico</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={`chip ${tactics.att >= 0 ? 'chip-up' : 'chip-down'}`}>ATQ {tactics.att >= 0 ? '+' : ''}{tactics.att}</span>
                    <span className={`chip ${tactics.def >= 0 ? 'chip-up' : 'chip-down'}`}>DEF {tactics.def >= 0 ? '+' : ''}{tactics.def}</span>
                    {tactics.legacyHome > 0 && <span className="chip chip-gold">Hinchada +3</span>}
                  </div>
                </div>
              </div>

              {manager.fired ? (
                <div className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-center text-sm text-red-200 font-bold flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Te echaron de {manager.club.name}. Elegí una de las ofertas de abajo.
                </div>
              ) : (
                <button onClick={handleSimulate} disabled={isSimulating} className={`play-btn w-full ${isSimulating ? 'play-btn-disabled' : ''}`}>
                  <Play className={`w-5 h-5 ${isSimulating ? 'animate-spin' : 'fill-current'}`} />
                  {isSimulating ? 'Dirigiendo desde el banco…' : `Dirigir temporada ${2026 + manager.seasons}`}
                </button>
              )}

              {seasonLog && (
                <div className="recap-card space-y-3 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#22E748]">Balance {seasonLog.year}</span>
                      <h4 className="text-lg font-black text-white">
                        {seasonLog.isChampion ? '¡Campeón de la liga! 🏆' : `${seasonLog.position}° de ${seasonLog.table.length}`}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white font-mono">{seasonLog.points} pts</span>
                      <span className="text-[11px] text-gray-400 block font-mono">
                        {seasonLog.w}G {seasonLog.d}E {seasonLog.l}P · {seasonLog.gf}-{seasonLog.ga}
                      </span>
                    </div>
                  </div>

                  {seasonLog.relegated && (
                    <div className="p-3 rounded-xl border text-xs font-black text-center bg-red-950/40 border-red-500/50 text-red-200">⬇️ ¡DESCENSO! El club se va a segunda.</div>
                  )}
                  {seasonLog.promoted && (
                    <div className="p-3 rounded-xl border text-xs font-black text-center bg-emerald-950/40 border-[#22E748]/50 text-[#22E748]">🎖️ ¡ASCENSO! {seasonLog.playoff ? 'Ganaste el reducido.' : 'Ascenso directo.'}</div>
                  )}
                  {seasonLog.domestic && (
                    <div className={`p-3 rounded-xl border text-xs font-bold text-center ${seasonLog.domestic.won ? 'bg-amber-500/15 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                      {seasonLog.domestic.won
                        ? `🏆 ¡GANASTE LA ${seasonLog.domestic.name.toUpperCase()}!`
                        : `${seasonLog.domestic.name}: ${seasonLog.domestic.reached === 'Final' ? 'perdiste la final' : `afuera en ${seasonLog.domestic.reached.toLowerCase()}`}${seasonLog.domestic.eliminatedBy ? ` (${seasonLog.domestic.eliminatedBy})` : ''}.`}
                    </div>
                  )}
                  {seasonLog.cup && (
                    <div className={`p-3 rounded-xl border text-xs font-bold text-center ${seasonLog.cup.won ? 'bg-amber-500/15 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                      {seasonLog.cup.won
                        ? `🏆 ¡GANASTE LA ${seasonLog.cup.name.toUpperCase()}!`
                        : `${seasonLog.cup.name}: ${seasonLog.cup.reached === 'Final' ? 'perdiste la final' : `afuera en ${seasonLog.cup.reached.toLowerCase()}`}${seasonLog.cup.eliminatedBy ? ` (${seasonLog.cup.eliminatedBy})` : ''}.`}
                    </div>
                  )}

                  <div className={`p-3 rounded-xl border text-xs font-bold ${VERDICT[seasonLog.verdict].cls}`}>
                    {VERDICT[seasonLog.verdict].text}
                  </div>

                  <ol className="space-y-1">
                    {seasonLog.table.slice(0, 5).concat(seasonLog.position > 5 ? [seasonLog.table[seasonLog.position - 1]] : []).map(t => {
                      const pos = seasonLog.table.indexOf(t) + 1;
                      return (
                        <li key={t.name} className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${t.isUs ? 'bg-[#22E748]/15 border border-[#22E748]/50 text-white font-black' : 'text-gray-300'}`}>
                          <span className="font-mono text-gray-500 w-5 text-right">{pos}</span>
                          <span className="flex-1 truncate">{t.name}</span>
                          <span className="font-mono font-bold">{t.points}</span>
                        </li>
                      );
                    })}
                  </ol>

                  {seasonLog.incidents.length > 0 && (
                    <div className="space-y-1">
                      {seasonLog.incidents.map((inc, i) => (
                        <p key={i} className="text-xs text-gray-300 italic bg-white/5 p-2 rounded-lg">💬 {inc}</p>
                      ))}
                    </div>
                  )}

                  {seasonLog.worldNews?.length > 0 && (
                    <div className="space-y-1">
                      {seasonLog.worldNews.map(n => (
                        <p key={n.clubId} className="text-xs text-gray-300 bg-white/5 p-2 rounded-lg flex justify-between gap-2">
                          <span>{n.icon} {n.text}</span>
                          <span className={`font-mono font-bold ${n.to > n.from ? 'text-[#22E748]' : 'text-red-400'}`}>{n.from}→{n.to}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {manager.pendingOffers?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-sky-300">
                    {manager.fired ? 'Clubes que te quieren' : 'Te llegaron ofertas (podés quedarte)'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {manager.pendingOffers.map(club => (
                      <button
                        key={club.id}
                        onClick={() => handleSign(club.id)}
                        className="p-3 rounded-xl border border-white/10 bg-black/30 hover:border-sky-400/60 flex items-center gap-3 text-left cursor-pointer"
                      >
                        <ClubShield club={club} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-black text-white block truncate">{club.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            Poder {club.reputation} · {getLeagueLabel(club.league)}{club.id === manager.legacy?.clubId ? ' · ⭐ tu club' : ''}
                          </span>
                        </span>
                        <span className="text-xs font-black text-sky-300">Firmar ➔</span>
                      </button>
                    ))}
                  </div>
                  {!manager.fired && (
                    <button onClick={() => commit({ ...manager, pendingOffers: null })} className="text-xs text-gray-400 hover:text-white underline cursor-pointer">
                      Rechazar todas y seguir en {manager.club.shortName}
                    </button>
                  )}
                </div>
              )}

              {manager.trophyNames.length > 0 && (
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                  <h4 className="text-xs font-black uppercase text-amber-400 mb-2 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Palmarés como DT
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {manager.trophyNames.map((t, i) => <span key={i} className="chip chip-gold">🏆 {t}</span>)}
                  </div>
                </div>
              )}

              {manager.history.length > 0 && (
                <details className="bg-black/30 border border-white/5 rounded-2xl p-4">
                  <summary className="text-xs font-black uppercase text-gray-400 cursor-pointer">Historial ({manager.history.length} temporadas)</summary>
                  <ul className="mt-2 space-y-1 text-xs text-gray-300 font-mono">
                    {manager.history.map((h, i) => (
                      <li key={i}>
                        {h.year} · {h.club} · {h.position ? `${h.position}° · ` : ''}{h.points} pts{h.isChampion ? ' · 🏆' : ''}{h.cup?.won ? ' · 🏆 Copa' : ''}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between gap-2 text-xs text-gray-400">
          {manager ? (
            confirmReset ? (
              <span className="flex items-center gap-2 flex-wrap">
                ¿Borrar la carrera de DT?
                <button onClick={handleReset} className="px-3 py-1 rounded-lg bg-red-500 text-white font-black cursor-pointer">Sí, borrar</button>
                <button onClick={() => setConfirmReset(false)} className="px-3 py-1 rounded-lg bg-white/10 font-bold cursor-pointer">No</button>
              </span>
            ) : (
              <button onClick={() => setConfirmReset(true)} className="text-gray-500 hover:text-red-400 flex items-center gap-1 cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5" /> Reiniciar carrera DT
              </button>
            )
          ) : (
            <span>Armá tu idea y convertite en DT leyenda.</span>
          )}
          <button onClick={() => { sound.playClick(); onClose(); }} className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
