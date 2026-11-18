import React, { useState, useEffect, useRef, useCallback } from 'react';
import PlayerCard from './components/PlayerCard';
import TrophyCabinet from './components/TrophyCabinet';
import TrainingZone from './components/TrainingZone';
import StoreModal from './components/StoreModal';
import GuideModal from './components/GuideModal';
import NewGameModal from './components/NewGameModal';
import PreseasonCardsModal from './components/PreseasonCardsModal';
import DilemmaModal from './components/DilemmaModal';
import TransfersModal from './components/TransfersModal';
import RetirementScreen from './components/RetirementScreen';
import AchievementsModal from './components/AchievementsModal';
import SavesModal from './components/SavesModal';
import HallOfFameModal from './components/HallOfFameModal';
import ManagerModeModal from './components/ManagerModeModal';
import CareerTimeline from './components/CareerTimeline';
import InteractiveTutorialModal from './components/InteractiveTutorialModal';
import FinalSeries from './components/FinalSeries';
import SeasonRecap from './components/SeasonRecap';
import AppHeader from './components/AppHeader';
import KeyMatchModal from './components/KeyMatchModal';
import ClubShield from './components/ClubShield';
import { getSlotData, saveSlotData, getActiveSlotNumber, setActiveSlotNumber } from './utils/storage';
import { checkPlayerAchievements } from './data/achievements';
import {
  createInitialPlayer,
  normalizePlayer,
  simulateSeasonMatches,
  generateKeyMatches,
  autoResolveKeyMatch,
  generateTransferOffers,
  getPlayerOverall,
  getKeyStat,
  getInjuryRisk,
  computeSalary,
  START_YEAR,
  leagueName,
  VOLUNTARY_RETIREMENT_AGE,
  RETIREMENT_AGE,
  TRAINING_REWARDS_PER_SEASON,
} from './game/career';
import { finalizeSeasonState } from './game/season';
import { applyEffects, addIdolatry, withStatueCheck, seasonsAtCurrentClub, STATUE_MIN_SEASONS } from './game/effects';
import { drawPreseasonCards } from './data/cards';
import { DILEMMAS, getRandomDilemma } from './data/dilemmas';
import { areRivals } from './data/clubs';
import { sound } from './utils/audio';
import {
  Play, Sparkles, Coins, Flame, Target, Zap, Save, Crown, Award, Briefcase,
  X, ShoppingBag, Dumbbell, HeartPulse, Flag,
} from 'lucide-react';

const SIM_DURATION_MS = 2400;

function getTournamentDifficulty(name) {
  if (!name) return 'normal';
  if (name.includes('Champions') || name.includes('Mundo')) return 'hard';
  if (name.includes('Libertadores') || name.includes('América') || name.includes('Eurocopa') || name.includes('Concacaf') || name.includes('AFC')) return 'medium';
  return 'normal';
}

function finalTitle(tournament) {
  return tournament?.startsWith('Final') ? tournament : `Final: ${tournament}`;
}

function drawCardsFor(p) {
  return drawPreseasonCards(p.position, p.archetype === 'pibe_maravilla', p.lifestyle?.includes('jet_privado'));
}

/** What a retired player brings to the manager career. */
function getPlayerLegacy(p) {
  if (!p?.isRetired) return null;
  const home = p.statueClubId
    ? { clubId: p.statueClubId, clubName: p.statueClubName }
    : [...(p.clubHistory || [])].filter(h => !h.leftAsRival).sort((a, b) => b.seasons - a.seasons)[0];
  return { clubId: home?.clubId || null, clubName: home?.clubName || null, fame: p.fame || 0, hasStatue: Boolean(p.hasStatue) };
}

function loadInitialPlayer() {
  try {
    return normalizePlayer(getSlotData(getActiveSlotNumber()));
  } catch {
    return null;
  }
}

export default function App() {
  const [activeSlot, setActiveSlot] = useState(() => getActiveSlotNumber());
  const [player, setPlayerState] = useState(loadInitialPlayer);
  const playerRef = useRef(player);

  /** Single source of truth: every change goes through here with a NEW object. */
  const commitPlayer = useCallback((next) => {
    playerRef.current = next;
    setPlayerState(next);
  }, []);

  const [activeTab, setActiveTab] = useState('carrera');
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [modal, setModal] = useState(null); // 'store' | 'guide' | 'achievements' | 'saves' | 'hall' | 'manager' | 'newGame'
  const [showTutorial, setShowTutorial] = useState(() => {
    try { return !localStorage.getItem('el_idolo_tutorial_seen_v1'); } catch { return false; }
  });
  const [toasts, setToasts] = useState([]);
  const [offseasonOpen, setOffseasonOpen] = useState(false);
  const [activeFinal, setActiveFinal] = useState(null);
  const [simProgress, setSimProgress] = useState(null); // null | 0..1
  const [fastSimulation, setFastSimulation] = useState(() => {
    try { return localStorage.getItem('el_idolo_fast_sim') === 'true'; } catch { return false; }
  });
  const [confirmRetire, setConfirmRetire] = useState(false);
  const [keyMatchOpen, setKeyMatchOpen] = useState(false);
  const simRef = useRef({ timer: null, result: null });
  const [simResult, setSimResult] = useState(null);

  // Persist the active career
  useEffect(() => {
    if (player) saveSlotData(activeSlot, player);
  }, [player, activeSlot]);

  useEffect(() => {
    try { localStorage.setItem('el_idolo_fast_sim', String(fastSimulation)); } catch { /* ignore */ }
  }, [fastSimulation]);

  // Achievement toasts: one at a time
  useEffect(() => {
    if (toasts.length === 0) return undefined;
    const t = setTimeout(() => setToasts(q => q.slice(1)), 5000);
    return () => clearTimeout(t);
  }, [toasts]);

  useEffect(() => () => clearInterval(simRef.current.timer), []);

  const pushAchievements = (p) => {
    const newly = checkPlayerAchievements(p);
    if (newly.length > 0) {
      sound.playFanfare();
      setToasts(q => [...q, ...newly]);
    }
  };

  const openModal = (name) => {
    if (name === 'newGame') setModal('newGame');
    else setModal(name);
  };
  const closeModal = () => setModal(null);

  // ---------- Slots ----------
  const handleLoadSlot = (slotNumber, savedPlayer) => {
    setActiveSlot(slotNumber);
    setActiveSlotNumber(slotNumber);
    const normalized = normalizePlayer(savedPlayer);
    commitPlayer(normalized);
    setModal(null);
    setOffseasonOpen(false);
    setActiveFinal(null);
    setActiveTab('carrera');
    if (normalized) pushAchievements(normalized);
  };

  const handleSaveToSlot = (slotNumber) => {
    if (!player) return;
    saveSlotData(slotNumber, player);
    setActiveSlot(slotNumber);
    setActiveSlotNumber(slotNumber);
  };

  const handleDeleteSlot = (slotNumber) => {
    saveSlotData(slotNumber, null);
    if (activeSlot === slotNumber) commitPlayer(null);
  };

  const handleStartNewInSlot = (slotNumber) => {
    setActiveSlot(slotNumber);
    setActiveSlotNumber(slotNumber);
    setModal('newGame');
  };

  const handleToggleSound = () => setIsMuted(sound.toggleMute());

  // ---------- New career ----------
  const handleStartNewGame = (config) => {
    const p = createInitialPlayer(config);
    p.pendingCards = drawCardsFor(p);
    commitPlayer(p);
    setModal(null);
    setActiveFinal(null);
    setActiveTab('carrera');
    setOffseasonOpen(true);
  };

  // ---------- Off-season flow: dilemma -> transfers -> cards ----------
  const handleContinueOffseason = () => {
    const p = playerRef.current;
    if (!p?.offseasonStep) return;
    let next = p;
    if (p.offseasonStep === 'dilemma' && !DILEMMAS.some(d => d.id === p.pendingDilemmaId)) {
      next = { ...p, pendingDilemmaId: getRandomDilemma(p, p.seenDilemmas || []).id };
    } else if (p.offseasonStep === 'transfers' && !p.pendingOffers?.length) {
      next = { ...p, pendingOffers: generateTransferOffers(p) };
    } else if (p.offseasonStep === 'cards' && !p.pendingCards?.length) {
      next = { ...p, pendingCards: drawCardsFor(p) };
    }
    if (next !== p) commitPlayer(next);
    sound.playClick();
    setOffseasonOpen(true);
  };

  const currentDilemma = player?.offseasonStep === 'dilemma'
    ? DILEMMAS.find(d => d.id === player.pendingDilemmaId) || null
    : null;

  const handleResolveDilemma = (option) => {
    const prev = playerRef.current;
    let next = applyEffects(prev, option.effects || {});
    next = {
      ...next,
      seenDilemmas: [...(prev.seenDilemmas || []), prev.pendingDilemmaId].filter(Boolean),
      pendingDilemmaId: null,
      offseasonStep: 'transfers',
    };
    next.pendingOffers = generateTransferOffers(next);
    commitPlayer(next);
    pushAchievements(next);
  };

  const handleAcceptOffer = (offer) => {
    const prev = playerRef.current;
    const next = { ...prev, clubHistory: prev.clubHistory.map(h => ({ ...h })) };
    const oldClubId = prev.currentClub.id;

    if (offer.isRenewal) {
      next.idolatry = addIdolatry(prev.idolatry, 5);
    } else {
      const newClub = offer.club;
      const isRival = offer.isRival || areRivals(oldClubId, newClub.id);
      if (isRival) {
        const old = next.clubHistory.find(h => h.clubId === oldClubId);
        if (old) old.leftAsRival = true;
      }
      next.currentClub = newClub;
      const existing = next.clubHistory.find(h => h.clubId === newClub.id);
      // Coming back home keeps part of the love (unless you betrayed them)
      next.idolatry = isRival ? 0 : existing && !existing.leftAsRival ? Math.round(existing.maxIdolatry * 0.6) : 10;
      next.managerRelationship = 65;
      next.lockerRoomChemistry = 65;
      if (!existing) {
        next.clubHistory.push({
          clubId: newClub.id, clubName: newClub.name, seasons: 0, goals: 0, matches: 0,
          cleanSheets: 0, titles: 0, maxIdolatry: next.idolatry, leftAsRival: false,
        });
      }
    }

    next.salary = offer.salary || computeSalary(next.currentClub, getPlayerOverall(next));
    Object.assign(next, withStatueCheck(next));
    next.pendingOffers = null;
    next.offseasonStep = 'cards';
    next.pendingCards = drawCardsFor(next);
    commitPlayer(next);
    pushAchievements(next);
  };

  const handleSelectCard = (selected) => {
    const prev = playerRef.current;
    const cards = Array.isArray(selected) ? selected : [selected];
    let next = cards.reduce((acc, card) => applyEffects(acc, card?.effects || {}), prev);
    next = { ...next, pendingCards: null, offseasonStep: null, lastRecap: null };
    commitPlayer(next);
    setOffseasonOpen(false);
    pushAchievements(next);
  };

  const handleRerollCards = () => {
    const prev = playerRef.current;
    if (!prev || (prev.coins || 0) < 5) return;
    sound.playCardFlip();
    commitPlayer({ ...prev, coins: prev.coins - 5, pendingCards: drawCardsFor(prev) });
  };

  const handleBuySecondCardSlot = () => {
    const prev = playerRef.current;
    if (!prev || (prev.coins || 0) < 15 || prev.seasonBoosts?.secondCard) return;
    sound.playTrophy();
    commitPlayer({ ...prev, coins: prev.coins - 15, seasonBoosts: { ...prev.seasonBoosts, secondCard: true } });
  };

  // ---------- Tactical boosts (coins) ----------
  const BOOSTS = [
    {
      id: 'finalBonus', cost: 10, Icon: Target, color: 'amber',
      title: 'Ventaja de final', done: '✓ Ventaja lista',
      desc: '+15% en los minijuegos si llegás a una final.',
      apply: (p) => ({ bonusFinal: Math.min(40, (p.bonusFinal || 0) + 15) }),
    },
    {
      id: 'specialConcentration', cost: 8, Icon: Flame, color: 'emerald',
      title: 'Concentración', done: '✓ En su pico',
      desc: '+1 de forma: más goles y más chances de final.',
      apply: (p) => ({ form: Math.min(2, (p.form || 0) + 1) }),
      disabled: (p) => (p.form || 0) >= 2,
    },
    {
      id: 'recoveryPhysio', cost: 5, Icon: Zap, color: 'cyan',
      title: 'Fisio y masajes', done: '✓ Fisio lista',
      desc: '+25 de energía y −3% de riesgo de lesión.',
      apply: (p) => ({ energy: Math.min(100, (p.energy ?? 100) + 25) }),
    },
  ];

  const handleBuyBoost = (boost) => {
    const prev = playerRef.current;
    if (!prev || (prev.coins || 0) < boost.cost || prev.seasonBoosts?.[boost.id] || boost.disabled?.(prev)) return;
    sound.playCoin();
    commitPlayer({
      ...prev,
      ...boost.apply(prev),
      coins: prev.coins - boost.cost,
      seasonBoosts: { ...prev.seasonBoosts, [boost.id]: true },
    });
  };

  // ---------- Season simulation ----------
  const proceedAfterSimulation = (result) => {
    const p = playerRef.current;
    setSimProgress(null);
    setSimResult(null);
    simRef.current.result = null;

    const keyStat = getKeyStat(p.position);
    const base = {
      bonus: p.bonusFinal || 0,
      playerStat: p.stats?.[keyStat] || 75,
      seasonResult: result,
    };

    if (result.reachedFinal) {
      sound.playWhistle();
      setActiveFinal({
        ...base,
        stage: 'club',
        tournament: result.finalTournament,
        title: finalTitle(result.finalTournament),
        teamName: p.currentClub.name,
        difficulty: getTournamentDifficulty(result.finalTournament),
        pendingNationalFinal: result.nationalTeam?.reachedFinal ? result.nationalTeam : null,
      });
    } else if (result.nationalTeam?.reachedFinal) {
      sound.playWhistle();
      setActiveFinal({
        ...base,
        bonus: 0,
        stage: 'national',
        tournament: result.nationalTeam.finalTournament,
        title: finalTitle(result.nationalTeam.finalTournament),
        teamName: result.nationalTeam.nationalTeamName,
        difficulty: getTournamentDifficulty(result.nationalTeam.finalTournament),
        wonClubFinal: false,
        pendingNationalFinal: null,
      });
    } else {
      finalizeSeason(result, {});
    }
  };

  const handlePlaySeason = () => {
    const p = playerRef.current;
    if (!p || simProgress !== null || p.offseasonStep || p.isRetired) return;
    setConfirmRetire(false);

    // 1) Key matches first (persisted, so a reload can't skip or replay them)
    let sip = p.seasonInProgress;
    if (!sip) {
      sip = { matches: generateKeyMatches(p), results: [] };
      commitPlayer({ ...p, seasonInProgress: sip });
    }
    if (sip.results.length < sip.matches.length) {
      sound.playWhistle();
      setKeyMatchOpen(true);
      return;
    }
    runSeasonSimulation(playerRef.current);
  };

  const handleKeyMatchDone = (won, auto) => {
    const p = playerRef.current;
    const sip = p?.seasonInProgress;
    if (!sip) return;
    const event = sip.matches[sip.results.length];
    if (!event) return;
    const results = [...sip.results, { id: event.id, kind: event.kind, label: event.label, title: event.title, stakes: event.stakes, won, auto }];
    const next = { ...p, seasonInProgress: { ...sip, results } };
    commitPlayer(next);
    if (results.length >= sip.matches.length) {
      setKeyMatchOpen(false);
      runSeasonSimulation(next);
    }
  };

  const runSeasonSimulation = (p) => {
    sound.playWhistle();
    const result = simulateSeasonMatches(p);
    simRef.current.result = result;
    setSimResult(result);

    if (fastSimulation) {
      proceedAfterSimulation(result);
      return;
    }
    const start = Date.now();
    setSimProgress(0);
    simRef.current.timer = setInterval(() => {
      const prog = Math.min(1, (Date.now() - start) / SIM_DURATION_MS);
      setSimProgress(prog);
      if (prog >= 1) {
        clearInterval(simRef.current.timer);
        proceedAfterSimulation(result);
      }
    }, 60);
  };

  const handleSkipSimulation = () => {
    if (!simRef.current.result) return;
    clearInterval(simRef.current.timer);
    proceedAfterSimulation(simRef.current.result);
  };

  const handleFinalResult = (won) => {
    const f = activeFinal;
    if (!f) return;
    if (f.stage === 'club') {
      if (f.pendingNationalFinal) {
        const p = playerRef.current;
        setActiveFinal({
          stage: 'national',
          tournament: f.pendingNationalFinal.finalTournament,
          title: finalTitle(f.pendingNationalFinal.finalTournament),
          teamName: f.pendingNationalFinal.nationalTeamName,
          bonus: 0,
          playerStat: p.stats?.[getKeyStat(p.position)] || 75,
          difficulty: getTournamentDifficulty(f.pendingNationalFinal.finalTournament),
          seasonResult: f.seasonResult,
          wonClubFinal: won,
          pendingNationalFinal: null,
        });
        return;
      }
      setActiveFinal(null);
      finalizeSeason(f.seasonResult, { wonFinal: won, tournamentName: f.tournament });
    } else {
      setActiveFinal(null);
      finalizeSeason(f.seasonResult, {
        wonFinal: Boolean(f.wonClubFinal),
        tournamentName: f.seasonResult?.finalTournament || null,
        wonNationalFinal: won,
        nationalTournamentName: f.tournament,
      });
    }
  };

  const finalizeSeason = (seasonData, outcome) => {
    const { next } = finalizeSeasonState(playerRef.current, seasonData, outcome);
    if (!next.isRetired) {
      next.offseasonStep = 'dilemma';
      next.pendingDilemmaId = getRandomDilemma(next, next.seenDilemmas || []).id;
    } else {
      next.offseasonStep = null;
    }
    commitPlayer(next);
    setOffseasonOpen(false);
    if (outcome.wonFinal || outcome.wonNationalFinal) sound.playTrophy();
    pushAchievements(next);
  };

  const handleRetire = () => {
    const p = playerRef.current;
    if (!p) return;
    commitPlayer({ ...p, isRetired: true, offseasonStep: null });
    setConfirmRetire(false);
  };

  // ---------- Store ----------
  const handleBuyStoreItem = (item) => {
    const prev = playerRef.current;
    if (!prev || prev.money < item.cost || prev.lifestyle?.includes(item.id)) return;
    let next = {
      ...prev,
      stats: { ...prev.stats },
      money: prev.money - item.cost,
      fame: Math.min(100, (prev.fame || 0) + (item.fame || 0)),
      lifestyle: [...(prev.lifestyle || []), item.id],
    };
    const keyStat = getKeyStat(prev.position);
    if (item.id === 'fundacion_infancias') next = applyEffects(next, { idolatria: 15 });
    else if (item.id === 'fisio_personal') next = applyEffects(next, { resistencia: 2 });
    else if (item.id === 'nutricionista_elite') next = applyEffects(next, { resistencia: 2, forma: 1 });
    else if (item.id === 'centro_alto_rendimiento') {
      const physical = next.stats.potencia !== undefined ? 'potencia' : 'resistencia';
      next = applyEffects(next, { [physical]: 3, [keyStat]: 2 });
    }
    commitPlayer(next);
    pushAchievements(next);
  };

  // ---------- Training rewards ----------
  const handlePracticeResult = (won) => {
    const prev = playerRef.current;
    if (!won || !prev || (prev.trainingRewardsLeft ?? 0) <= 0) return null;
    commitPlayer({ ...prev, coins: (prev.coins || 0) + 2, trainingRewardsLeft: prev.trainingRewardsLeft - 1 });
    sound.playCoin();
    return '(+2 🪙)';
  };

  // ========== RENDER ==========
  const sharedModals = (
    <>
      {modal === 'newGame' && (
        <NewGameModal
          onStartGame={handleStartNewGame}
          onClose={closeModal}
          replacing={player && !player.isRetired ? { name: player.name, slot: activeSlot } : null}
        />
      )}
      {modal === 'saves' && (
        <SavesModal
          currentPlayer={player}
          activeSlot={activeSlot}
          onLoadSlot={handleLoadSlot}
          onSaveToSlot={handleSaveToSlot}
          onDeleteSlot={handleDeleteSlot}
          onStartNewInSlot={handleStartNewInSlot}
          onClose={closeModal}
        />
      )}
      {modal === 'hall' && <HallOfFameModal onClose={closeModal} />}
      {modal === 'achievements' && <AchievementsModal onClose={closeModal} />}
      {modal === 'manager' && (
        <ManagerModeModal initialDtName={player?.name || 'El Míster'} legacy={getPlayerLegacy(player)} onClose={closeModal} />
      )}
      {modal === 'guide' && <GuideModal onClose={closeModal} onOpenTutorial={() => setShowTutorial(true)} />}
      {showTutorial && <InteractiveTutorialModal onClose={() => setShowTutorial(false)} />}
    </>
  );

  if (!player) {
    return (
      <div className="min-h-screen app-bg flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md w-full title-card text-center space-y-6 animate-pop">
          <div className="hero-ball">⚽</div>
          <div>
            <h1 className="font-display text-6xl sm:text-7xl text-white leading-none tracking-wide">EL ÍDOLO</h1>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#22E748] font-bold mt-2">De pibe a leyenda</p>
            <p className="text-sm text-gray-400 mt-4">
              Arrancás a los 16 en un club chico. Goles, finales, clásicos, decisiones y traiciones… ¿llegás a tener tu estatua?
            </p>
          </div>

          <div className="space-y-2.5">
            <button onClick={() => setModal('newGame')} className="btn-primary w-full flex items-center justify-center gap-2 text-base">
              <Play className="w-5 h-5 fill-current" />
              Nueva carrera
            </button>
            <button
              onClick={() => setModal('saves')}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4 text-amber-400" />
              Cargar partida
            </button>
            <p className="text-[11px] text-gray-500">Ranura activa: #{activeSlot} (vacía)</p>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { id: 'hall', label: 'Salón', Icon: Crown, c: 'text-amber-400' },
                { id: 'achievements', label: 'Logros', Icon: Award, c: 'text-[#22E748]' },
                { id: 'manager', label: 'Modo DT', Icon: Briefcase, c: 'text-sky-400' },
              ].map(({ id, label, Icon, c }) => (
                <button key={id} onClick={() => setModal(id)} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[11px] font-bold text-gray-300 transition-all cursor-pointer flex flex-col items-center">
                  <Icon className={`w-4 h-4 mb-1 ${c}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {sharedModals}
      </div>
    );
  }

  const isSimulating = simProgress !== null;
  const seasonYear = START_YEAR + player.seasonsPlayed;
  const league = leagueName(player.currentClub?.league);
  const offseasonPending = Boolean(player.offseasonStep);
  const showRecap = Boolean(player.lastRecap && offseasonPending);
  const injuryRisk = getInjuryRisk(player);
  const isGk = player.position === 'arquero';
  const canRetire = player.age >= VOLUNTARY_RETIREMENT_AGE && !offseasonPending && !isSimulating;
  const yearsLeft = player.gameMode === 'ultra' ? Math.max(0, 2 - player.seasonsPlayed) : RETIREMENT_AGE - player.age;

  // Live season ticker during simulation
  const tickerMatches = simResult && isSimulating ? Math.round(simResult.matches * simProgress) : 0;
  const tickerMain = simResult && isSimulating ? Math.round((isGk ? simResult.cleanSheets : simResult.goals) * simProgress) : 0;

  return (
    <div className="min-h-screen app-bg text-gray-100 flex flex-col pb-16 md:pb-0">
      <AppHeader
        player={player}
        activeTab={activeTab}
        onTab={setActiveTab}
        activeSlot={activeSlot}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        onOpen={openModal}
      />

      <main className="max-w-6xl mx-auto w-full p-3 sm:p-4 md:p-6 flex-1">
        {player.isRetired ? (
          <RetirementScreen
            player={player}
            onNewGame={() => setModal('newGame')}
            onOpenHallOfFame={() => setModal('hall')}
            onOpenManagerMode={() => setModal('manager')}
          />
        ) : (
          <>
            {activeTab === 'carrera' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left column */}
                <div className="lg:col-span-1 space-y-4">
                  <PlayerCard player={player} />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setModal('store')} className="quick-btn">
                      <ShoppingBag className="w-4 h-4 text-[#22E748] mb-1" />
                      <span className="text-xs font-black text-white block">Tienda</span>
                      <span className="text-[10px] text-gray-400">${(player.money || 0).toLocaleString('es-AR')}</span>
                    </button>
                    <button onClick={() => setActiveTab('entrenamiento')} className="quick-btn">
                      <Dumbbell className="w-4 h-4 text-yellow-400 mb-1" />
                      <span className="text-xs font-black text-white block">Entrenar</span>
                      <span className="text-[10px] text-gray-400">
                        {player.trainingRewardsLeft > 0 ? `${player.trainingRewardsLeft} premios 🪙 disponibles` : 'Practicar minijuegos'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Right column: season stage (first on mobile so "Jugar" is always at hand) */}
                <div className="lg:col-span-2 space-y-5 order-first lg:order-none">
                  <section className="panel p-4 sm:p-6 relative overflow-hidden">
                    <div className="season-glow" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3 min-w-0">
                        <ClubShield club={player.currentClub} size={52} />
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#22E748] bg-[#22E748]/10 px-2.5 py-0.5 rounded-full border border-[#22E748]/20">
                            Temporada {seasonYear} · Año {player.seasonsPlayed + 1}
                          </span>
                          <h2 className="font-display text-3xl sm:text-4xl text-white leading-none mt-1.5 truncate">
                            {player.currentClub?.name}
                          </h2>
                          <p className="text-xs text-gray-400 mt-1">
                            {league} · {player.age} años · Sueldo ${Math.round(player.salary || 0).toLocaleString('es-AR')}/año
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-stretch sm:items-end gap-2">
                        <button
                          onClick={handlePlaySeason}
                          disabled={isSimulating || offseasonPending}
                          className={`play-btn ${isSimulating || offseasonPending ? 'play-btn-disabled' : ''}`}
                        >
                          <Play className="w-5 h-5 fill-current" />
                          <span>
                            {isSimulating ? 'Jugando…' : offseasonPending ? 'Terminá el receso' : player.seasonInProgress ? 'Seguir la temporada' : `Jugar temporada ${seasonYear}`}
                          </span>
                        </button>
                        {isSimulating ? (
                          <button onClick={handleSkipSimulation} className="text-xs font-black text-amber-400 hover:text-amber-300 underline cursor-pointer">
                            ⚡ Ver resultado ya
                          </button>
                        ) : (
                          <button
                            onClick={() => { sound.playClick(); setFastSimulation(f => !f); }}
                            className={`self-center sm:self-end px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                              fastSimulation ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-black/40 text-gray-400 border-white/5 hover:text-white'
                            }`}
                            title="Simulación animada o instantánea"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            {fastSimulation ? 'Simulación instantánea' : 'Simulación animada'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Pre-season status chips */}
                    {!isSimulating && !offseasonPending && (
                      <div className="relative mt-4 flex flex-wrap gap-1.5">
                        <span className="chip">⚡ Energía {player.energy ?? 100}</span>
                        <span className={`chip ${injuryRisk >= 15 ? 'chip-down' : ''}`}><HeartPulse className="w-3 h-3" /> Riesgo de lesión {injuryRisk}%</span>
                        <span className="chip">📈 Forma {player.form > 0 ? `+${player.form}` : player.form || 0}</span>
                        {player.bonusFinal > 0 && <span className="chip chip-gold">🎯 Bonus final +{player.bonusFinal}%</span>}
                        <span className="chip">⏳ {player.gameMode === 'ultra' ? `${yearsLeft} temporadas restantes` : `Retiro en ${yearsLeft} años`}</span>
                      </div>
                    )}

                    {/* Tactical prep */}
                    {!isSimulating && !offseasonPending && (
                      <div className="relative mt-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <Coins className="w-4 h-4" /> Preparación táctica
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-400">🪙 {player.coins}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {BOOSTS.map(b => {
                            const bought = player.seasonBoosts?.[b.id];
                            const blocked = !bought && ((player.coins || 0) < b.cost || b.disabled?.(player));
                            return (
                              <button
                                key={b.id}
                                onClick={() => handleBuyBoost(b)}
                                disabled={bought || blocked}
                                className={`boost-btn boost-${b.color} ${bought ? 'boost-bought' : blocked ? 'boost-blocked' : ''}`}
                              >
                                <div className="boost-icon"><b.Icon className="w-4 h-4" /></div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black truncate">{bought ? b.done : b.title}</span>
                                    <span className="text-[11px] font-mono font-bold text-amber-400 ml-1">🪙 {b.cost}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{b.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Simulation */}
                    {isSimulating && (
                      <div className="relative py-8 text-center space-y-4">
                        <div className="text-5xl select-none animate-roll inline-block">⚽</div>
                        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                          <div className="stat-tile">
                            <span className="text-[10px] uppercase text-gray-400 font-bold block">Partidos</span>
                            <span className="text-2xl font-black font-mono text-white">{tickerMatches}</span>
                          </div>
                          <div className="stat-tile">
                            <span className="text-[10px] uppercase text-gray-400 font-bold block">{isGk ? 'Vallas invictas' : 'Goles'}</span>
                            <span className="text-2xl font-black font-mono text-[#22E748]">{tickerMain}</span>
                          </div>
                        </div>
                        <div className="max-w-sm mx-auto h-2 rounded-full bg-black/50 overflow-hidden border border-white/10">
                          <div className="h-full bg-gradient-to-r from-[#16a34a] to-[#22E748]" style={{ width: `${Math.round(simProgress * 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-400">Fechas, clásicos y noches de copa…</p>
                      </div>
                    )}

                    {/* Recap / off-season */}
                    {showRecap && !isSimulating && (
                      <SeasonRecap recap={player.lastRecap} player={player} onContinue={handleContinueOffseason} />
                    )}
                    {offseasonPending && !showRecap && !isSimulating && (
                      <div className="relative mt-5 p-4 rounded-2xl border border-[#22E748]/30 bg-[#22E748]/5 text-center">
                        <p className="text-sm text-gray-200 font-bold mb-3">
                          {player.offseasonStep === 'cards' ? 'Elegí tu entrenamiento de pretemporada para arrancar el año.' : 'Tenés el receso de temporada pendiente.'}
                        </p>
                        <button onClick={handleContinueOffseason} className="btn-primary">Continuar ➔</button>
                      </div>
                    )}

                    {/* Voluntary retirement */}
                    {canRetire && (
                      <div className="relative mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-end gap-2">
                        {confirmRetire ? (
                          <>
                            <span className="text-xs text-gray-300">¿Colgar los botines ahora, con {player.age} años?</span>
                            <button onClick={handleRetire} className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-black cursor-pointer">Sí, me retiro</button>
                            <button onClick={() => setConfirmRetire(false)} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold cursor-pointer">Seguir jugando</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmRetire(true)} className="text-xs font-bold text-gray-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer">
                            <Flag className="w-3.5 h-3.5" /> Colgar los botines
                          </button>
                        )}
                      </div>
                    )}
                  </section>

                  <CareerTimeline player={player} />

                  <section className="panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">🗽</div>
                      <div>
                        <h4 className="text-sm font-black text-white">Objetivo: la estatua en el club</h4>
                        <p className="text-xs text-gray-400">
                          {player.hasStatue
                            ? `¡Conseguido! Tenés tu estatua en ${player.statueClubName || 'el club'}.`
                            : `Idolatría ${player.idolatry}/95 · ${Math.min(seasonsAtCurrentClub(player), STATUE_MIN_SEASONS)}/${STATUE_MIN_SEASONS} temporadas en el club. Ganá títulos y sé leal.`}
                        </p>
                        {!player.hasStatue && (
                          <div className="mt-1.5 w-48 h-1.5 rounded-full bg-black/50 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-600 to-[#F6B40E]" style={{ width: `${Math.min(100, (player.idolatry / 95) * 100)}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('vitrina')} className="px-4 py-2 bg-[#122017] hover:bg-[#22E748] text-[#22E748] hover:text-black font-extrabold text-xs rounded-xl border border-[#22E748]/30 transition-all cursor-pointer">
                      Ver palmarés ➔
                    </button>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'vitrina' && <TrophyCabinet player={player} />}
            {activeTab === 'entrenamiento' && (
              <TrainingZone
                rewardsLeft={player.trainingRewardsLeft ?? 0}
                maxRewards={TRAINING_REWARDS_PER_SEASON}
                onPracticeResult={handlePracticeResult}
                playerStat={player.stats?.[getKeyStat(player.position)] || 75}
              />
            )}
          </>
        )}
      </main>

      {/* Off-season modals */}
      {offseasonOpen && player.offseasonStep === 'cards' && player.pendingCards && (
        <PreseasonCardsModal
          key={player.pendingCards.map(c => c.id).join('-')}
          cards={player.pendingCards}
          coins={player.coins || 0}
          player={player}
          hasSecondSlot={Boolean(player.seasonBoosts?.secondCard)}
          onSelectCard={handleSelectCard}
          onReroll={handleRerollCards}
          onBuySecondSlot={handleBuySecondCardSlot}
        />
      )}
      {offseasonOpen && currentDilemma && (
        <DilemmaModal key={currentDilemma.id} dilemma={currentDilemma} player={player} onResolve={handleResolveDilemma} />
      )}
      {offseasonOpen && player.offseasonStep === 'transfers' && player.pendingOffers && (
        <TransfersModal player={player} offers={player.pendingOffers} onAcceptOffer={handleAcceptOffer} />
      )}

      {modal === 'store' && <StoreModal player={player} onBuyItem={handleBuyStoreItem} onClose={closeModal} />}

      {/* Key matches during the season */}
      {keyMatchOpen && player.seasonInProgress && player.seasonInProgress.matches[player.seasonInProgress.results.length] && (
        <KeyMatchModal
          key={player.seasonInProgress.matches[player.seasonInProgress.results.length].id}
          event={player.seasonInProgress.matches[player.seasonInProgress.results.length]}
          index={player.seasonInProgress.results.length}
          total={player.seasonInProgress.matches.length}
          player={player}
          onDone={handleKeyMatchDone}
          autoResolve={(ev) => autoResolveKeyMatch(playerRef.current, ev)}
        />
      )}

      {/* Finals */}
      {activeFinal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
          <FinalSeries
            key={`${activeFinal.stage}-${activeFinal.tournament}`}
            final={activeFinal}
            player={player}
            onFinish={handleFinalResult}
          />
        </div>
      )}

      {sharedModals}

      {toasts[0] && (
        <div key={toasts[0].id} className="fixed bottom-20 md:bottom-6 right-3 left-3 sm:left-auto sm:right-6 z-[60] toast animate-slideUp sm:max-w-sm">
          <div className="text-3xl flex-shrink-0">{toasts[0].icon}</div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase text-[#22E748] tracking-widest block">¡Logro desbloqueado!</span>
            <h4 className="text-sm font-black text-white truncate">{toasts[0].title}</h4>
            <p className="text-xs text-gray-300 leading-snug">{toasts[0].desc}</p>
          </div>
          <button onClick={() => setToasts(q => q.slice(1))} className="p-1 rounded-lg text-gray-400 hover:text-white flex-shrink-0 cursor-pointer" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <footer className="border-t border-white/5 py-4 px-4 text-center text-[11px] text-gray-500 hidden md:block">
        <Sparkles className="w-3 h-3 inline mr-1 text-[#22E748]" />
        El Ídolo · Simulador de carrera futbolística · Hecho con React, Tailwind y Web Audio
      </footer>
    </div>
  );
}
