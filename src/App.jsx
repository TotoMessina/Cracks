import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import PlayerCard, { PlayerStrip } from './components/PlayerCard';
import CareerTimeline from './components/CareerTimeline';
import SeasonRecap from './components/SeasonRecap';
import AppHeader from './components/AppHeader';
import ClubShield from './components/ClubShield';
import { getSlotData, saveSlotData, getActiveSlotNumber, setActiveSlotNumber } from './utils/storage';
import { checkPlayerAchievements } from './data/achievements';
import {
  createInitialPlayer,
  normalizePlayer,
  simulateSeasonMatches,
  generateKeyMatches,
  seasonOpeners,
  getDifficulty,
  getNationalCallUp,
  nationalFinalBonus,
  autoResolveKeyMatch,
  generateOffseasonMarket,
  offerSignsContract,
  negotiateOffer,
  injuryNeedsDecision,
  applyInjuryChoice,
  makeContract,
  WORKLOADS,
  getWorkload,
  signingBonus,
  contractYearsRange,
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
import { resolveDilemmaOption } from './game/dilemmaEngine';
import { addMoment } from './game/moments';
import { getContinentalEntry, domesticCupName } from './game/competitions';
import { applyEffects, addIdolatry, withStatueCheck, seasonsAtCurrentClub, STATUE_MIN_SEASONS } from './game/effects';
import { drawPreseasonCards } from './data/cards';
import { DILEMMAS, getRandomDilemma } from './data/dilemmas';
import { areRivals, setWorld } from './data/clubs';
import { getClubObjective } from './game/world';
import { getCoach, coachFit, COACH_STYLES } from './game/coach';
import { recordChase, RECORD_INFO } from './game/records';
import { CHALLENGES } from './game/challenges';
import { sound } from './utils/audio';
import {
  Play, Sparkles, Flame, Target, Zap, Save, Crown, Award, Briefcase,
  X, ShoppingBag, Dumbbell, Flag,
} from 'lucide-react';

// Windows and minigames load on demand (smaller first load)
const TrophyCabinet = lazy(() => import('./components/TrophyCabinet'));
const TrainingZone = lazy(() => import('./components/TrainingZone'));
const StoreModal = lazy(() => import('./components/StoreModal'));
const GuideModal = lazy(() => import('./components/GuideModal'));
const NewGameModal = lazy(() => import('./components/NewGameModal'));
const PreseasonCardsModal = lazy(() => import('./components/PreseasonCardsModal'));
const DilemmaModal = lazy(() => import('./components/DilemmaModal'));
const TransfersModal = lazy(() => import('./components/TransfersModal'));
const RetirementScreen = lazy(() => import('./components/RetirementScreen'));
const AchievementsModal = lazy(() => import('./components/AchievementsModal'));
const SavesModal = lazy(() => import('./components/SavesModal'));
const HallOfFameModal = lazy(() => import('./components/HallOfFameModal'));
const ManagerModeModal = lazy(() => import('./components/ManagerModeModal'));
const InteractiveTutorialModal = lazy(() => import('./components/InteractiveTutorialModal'));
const FinalSeries = lazy(() => import('./components/FinalSeries'));
const KeyMatchModal = lazy(() => import('./components/KeyMatchModal'));
const InjuryModal = lazy(() => import('./components/InjuryModal'));
const NationalCallModal = lazy(() => import('./components/NationalCallModal'));

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

const MINI_TONE = { good: 'text-[#22E748]', warn: 'text-amber-300', bad: 'text-red-400', gold: 'text-[#F6B40E]' };
function MiniStat({ label, value, tone = '', title }) {
  return (
    <div className="mini-stat" title={title}>
      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">{label}</span>
      <span className={`text-sm font-black font-mono ${MINI_TONE[tone] || 'text-white'}`}>{value}</span>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" aria-label="Cargando">
      <div className="text-4xl animate-roll">⚽</div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="py-20 flex justify-center" aria-label="Cargando">
      <div className="text-4xl animate-roll">⚽</div>
    </div>
  );
}

export default function App() {
  const [activeSlot, setActiveSlot] = useState(() => getActiveSlotNumber());
  const [player, setPlayerState] = useState(loadInitialPlayer);
  const playerRef = useRef(player);

  /** Single source of truth: every change goes through here with a NEW object. */
  const commitPlayer = useCallback((next) => {
    // Clubs' divisions follow this career's world (promotions / relegations)
    if (next?.world !== playerRef.current?.world) setWorld(next?.world || {});
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
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [keyMatchOpen, setKeyMatchOpen] = useState(false);
  const [ntCallOpen, setNtCallOpen] = useState(false);
  const simRef = useRef({ timer: null, result: null });
  const [simResult, setSimResult] = useState(null);
  const [injuryDecision, setInjuryDecision] = useState(null); // { result, resolved }

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
    if (p.offseasonStep === 'dilemma' && !p.pendingDilemmaResult && !DILEMMAS.some(d => d.id === p.pendingDilemmaId)) {
      next = { ...p, pendingDilemmaId: getRandomDilemma(p, p.seenDilemmas || []).id };
    } else if (p.offseasonStep === 'transfers' && !p.pendingOffers?.length) {
      const market = generateOffseasonMarket(p);
      next = market
        ? { ...p, pendingOffers: market.offers, pendingMarketFree: market.free, pendingMarketReleased: Boolean(market.released) }
        : { ...p, pendingOffers: null, offseasonStep: 'cards', pendingCards: drawCardsFor(p) };
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
    const dilemma = DILEMMAS.find(d => d.id === prev.pendingDilemmaId);
    if (!dilemma) return;
    const { next: resolved, result } = resolveDilemmaOption(prev, dilemma, option);
    const next = {
      ...resolved,
      seenDilemmas: [...(prev.seenDilemmas || []), dilemma.id],
      scheduledDilemmas: (resolved.scheduledDilemmas || []).filter(sd => sd.id !== dilemma.id),
      pendingDilemmaId: null,
      pendingDilemmaResult: result,
    };
    if (result.transferredTo) sound.playTrophy();
    commitPlayer(next);
    pushAchievements(next);
  };

  /** After reading the consequences: go to the market (or straight to pre-season). */
  const handleDilemmaContinue = () => {
    const prev = playerRef.current;
    const result = prev.pendingDilemmaResult;
    const next = { ...prev, pendingDilemmaResult: null };
    if (result?.transferredTo) {
      // You already changed club in the dilemma: no market this off-season
      next.offseasonStep = 'cards';
      next.pendingOffers = null;
      next.loan = null;
      next.pendingCards = drawCardsFor(next);
      commitPlayer(next);
      return;
    }
    // Under contract and nobody came for you? Straight to pre-season.
    const market = generateOffseasonMarket(next);
    if (market) {
      next.offseasonStep = 'transfers';
      next.pendingOffers = market.offers;
      next.pendingMarketFree = market.free;
      next.pendingMarketReleased = Boolean(market.released);
    } else {
      next.offseasonStep = 'cards';
      next.pendingOffers = null;
      next.pendingCards = drawCardsFor(next);
    }
    commitPlayer(next);
    pushAchievements(next);
  };

  const handleAcceptOffer = (offer, years) => {
    const prev = playerRef.current;
    const next = { ...prev, clubHistory: prev.clubHistory.map(h => ({ ...h })) };
    const oldClubId = prev.currentClub.id;

    if (offer.withdrawn) return;
    if (offer.isStay) {
      // Keep the current contract as it is
    } else if (offer.isLoan) {
      // Loaned out for a year: same contract, new club, your club keeps you in mind
      const loanClub = offer.club;
      next.loan = {
        parentClubId: prev.loan?.parentClubId ?? oldClubId,
        parentClubName: prev.loan?.parentClubName ?? prev.currentClub.name,
        parentIdolatry: prev.loan?.parentIdolatry ?? prev.idolatry,
        year: START_YEAR + prev.seasonsPlayed,
      };
      next.currentClub = loanClub;
      const existing = next.clubHistory.find(h => h.clubId === loanClub.id);
      next.idolatry = existing ? Math.round(existing.maxIdolatry * 0.6) : 15;
      next.managerRelationship = 75; // they asked for you: you'll play
      next.lockerRoomChemistry = 65;
      if (!existing) {
        next.clubHistory.push({
          clubId: loanClub.id, clubName: loanClub.name, seasons: 0, goals: 0, matches: 0,
          cleanSheets: 0, titles: 0, maxIdolatry: next.idolatry, leftAsRival: false, loan: true,
        });
      }
      Object.assign(next, addMoment(next, { type: 'loan', icon: '🔁', text: `Cedido a ${loanClub.name} para sumar minutos` }));
    } else if (offer.isLoanReturn) {
      // Back home after the loan, with more experience
      next.currentClub = offer.club;
      next.idolatry = addIdolatry(prev.loan?.parentIdolatry ?? 10, 3);
      next.managerRelationship = 70;
      next.lockerRoomChemistry = 65;
      if (!next.clubHistory.some(h => h.clubId === offer.club.id)) {
        next.clubHistory.push({
          clubId: offer.club.id, clubName: offer.club.name, seasons: 0, goals: 0, matches: 0,
          cleanSheets: 0, titles: 0, maxIdolatry: next.idolatry, leftAsRival: false,
        });
      }
      Object.assign(next, addMoment(next, { type: 'loan_return', icon: '🏠', text: `Volviste a ${offer.club.name} después del préstamo` }));
    } else if (offer.isRenewal && offer.loyalRelegation) {
      // Staying to bring the club back up: the fans will never forget it
      next.idolatry = addIdolatry(prev.idolatry, 12);
      Object.assign(next, addMoment(next, { type: 'loyal_relegation', icon: '🫡', text: `Te quedaste en ${prev.currentClub.name} después del descenso` }));
    } else if (offer.isRenewal) {
      next.idolatry = addIdolatry(prev.idolatry, 5);
    } else {
      const newClub = offer.club;
      const isRival = offer.isRival || areRivals(oldClubId, newClub.id);
      if (isRival) {
        const old = next.clubHistory.find(h => h.clubId === oldClubId);
        if (old) old.leftAsRival = true;
        // Breaking a public oath of loyalty costs you everywhere
        if (prev.flags?.swornLoyalty === oldClubId) {
          next.fame = Math.max(0, (prev.fame || 0) - 10);
          next.flags = { ...(prev.flags || {}), swornLoyalty: null, oathBroken: true };
        }
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

    // Any choice other than a new loan ends the current one
    if (!offer.isLoan) next.loan = null;

    if (offerSignsContract(offer)) {
      const salary = offer.salary || computeSalary(next.currentClub, getPlayerOverall(next));
      const range = contractYearsRange(prev.age);
      const length = Math.max(range.min, Math.min(offer.maxYears ?? range.max, years || range.suggested));
      next.salary = salary;
      next.contract = makeContract(salary, length);
      next.money = (prev.money || 0) + signingBonus(salary, length);
      // Committing long-term to your club wins the fans over
      if (offer.isRenewal && length >= 4) next.idolatry = addIdolatry(next.idolatry, 3);
    }
    Object.assign(next, withStatueCheck(next));
    // Career highlight: changing club (and betrayals)
    if (!offer.isRenewal && !offer.isStay && !offer.isLoan && !offer.isLoanReturn && offer.club?.id !== oldClubId) {
      const betrayal = offer.isRival || areRivals(oldClubId, offer.club.id);
      Object.assign(next, addMoment(next, betrayal
        ? { type: 'betrayal', icon: '🐍', text: `La traición: dejaste ${prev.currentClub.name} por el clásico rival, ${offer.club.name}` }
        : { type: 'transfer', icon: '✈️', text: `${offer.isLoanBuy ? 'Compra definitiva de' : 'Pase a'} ${offer.club.name}${offer.paysClause ? ' (pagaron tu cláusula)' : ''}` }));
    }
    next.pendingOffers = null;
    next.pendingMarketFree = null;
    next.pendingMarketReleased = null;
    next.relegationRelease = null;
    // Market-related promises are used up once you sign
    if (prev.flags?.europeanAgent || prev.flags?.boardAngry) {
      next.flags = { ...(next.flags || prev.flags), europeanAgent: false, boardAngry: offer.isStay ? prev.flags.boardAngry : false };
    }
    next.offseasonStep = 'cards';
    next.pendingCards = drawCardsFor(next);
    commitPlayer(next);
    pushAchievements(next);
  };

  /** Ask a club for better terms (one try per offer). */
  const handleNegotiate = (index, askId) => {
    const prev = playerRef.current;
    const offers = prev.pendingOffers || [];
    const offer = offers[index];
    if (!offer) return null;
    const alive = offers.filter(o => !o.withdrawn).length;
    const { outcome, offer: updated } = negotiateOffer(prev, offer, askId, { canWithdraw: alive > 1 });
    if (!outcome) return null;
    if (outcome === 'withdrawn') sound.playBuzzer(); else if (outcome === 'accepted') sound.playCoin(); else sound.playClick();
    commitPlayer({ ...prev, pendingOffers: offers.map((o, i) => (i === index ? updated : o)) });
    return outcome;
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
      title: 'Ventaja final', done: '✓ Ventaja lista',
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
      title: 'Fisioterapia', done: '✓ Fisio lista',
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
    // Form and end-of-season energy weigh on the finals
    const condition = { form: p.form || 0, energy: result.endEnergy ?? p.energy ?? 100 };
    const playerStat = p.stats?.[keyStat] || 75;

    // Every final of the season, in calendar order: cup, international cup, league decider / promotion, national team
    const queue = (result.finals || []).map(f => ({
      ...f,
      stage: 'club',
      teamName: p.currentClub.name,
      bonus: p.bonusFinal || 0,
    }));
    if (result.nationalTeam?.reachedFinal) {
      queue.push({
        stage: 'national',
        kind: 'national',
        tournament: result.nationalTeam.finalTournament,
        title: finalTitle(result.nationalTeam.finalTournament),
        teamName: result.nationalTeam.nationalTeamName,
        bonus: nationalFinalBonus(p),
        difficulty: getTournamentDifficulty(result.nationalTeam.finalTournament),
      });
    }
    if (queue.length === 0) {
      finalizeSeason(result, { finals: [] });
      return;
    }
    sound.playWhistle();
    setActiveFinal({ ...queue[0], condition, playerStat, seasonResult: result, queue, index: 0, results: [], rested: false });
  };

  const handlePlaySeason = () => {
    const p = playerRef.current;
    if (!p || simProgress !== null || p.offseasonStep || p.isRetired) return;
    setConfirmRetire(false);

    // 0) Big national team tournament? You decide whether to go (persisted)
    let sip = p.seasonInProgress;
    if (!sip) {
      const call = getNationalCallUp(p);
      const needsDecision = Boolean(call?.isMajor);
      sip = {
        ntCall: needsDecision ? { name: call.name, icon: call.icon, isMajor: true } : null,
        ntDecision: needsDecision ? null : (call ? 'auto' : null),
        matches: needsDecision ? null : [...seasonOpeners(p), ...generateKeyMatches(p)],
        results: [],
      };
      commitPlayer({ ...p, seasonInProgress: sip });
    }
    if (sip.ntCall && !sip.ntDecision) {
      sound.playWhistle();
      setNtCallOpen(true);
      return;
    }
    if (!sip.matches) {
      sip = { ...sip, matches: [...seasonOpeners(playerRef.current), ...generateKeyMatches(playerRef.current)] };
      commitPlayer({ ...playerRef.current, seasonInProgress: sip });
    }
    // 1) Key matches first (persisted, so a reload can't skip or replay them)
    if (sip.results.length < sip.matches.length) {
      sound.playWhistle();
      setKeyMatchOpen(true);
      return;
    }
    runSeasonSimulation(playerRef.current);
  };

  const handleNationalDecision = (decision) => {
    const p = playerRef.current;
    if (!p?.seasonInProgress) return;
    const effects = decision === 'go' ? { dt: -2 } : { dt: 4, idolatria: 3, fama: -3 };
    const decided = applyEffects(p, effects);
    const sip = { ...p.seasonInProgress, ntDecision: decision };
    const withSip = { ...decided, seasonInProgress: sip };
    // Key matches depend on the decision (no national-team game if you stay home)
    commitPlayer({ ...withSip, seasonInProgress: { ...sip, matches: [...seasonOpeners(withSip), ...generateKeyMatches(withSip)] } });
    setNtCallOpen(false);
    setTimeout(() => handlePlaySeasonRef.current?.(), 0);
  };

  const handleKeyMatchDone = (won, auto) => {
    const p = playerRef.current;
    const sip = p?.seasonInProgress;
    if (!sip) return;
    const event = sip.matches[sip.results.length];
    if (!event) return;
    const results = [...sip.results, {
      id: event.id, kind: event.kind, label: event.label, title: event.title, stakes: event.stakes, won, auto,
      isTitle: event.isTitle, titleKind: event.titleKind, tournament: event.tournament, weight: event.weight, opponentName: event.opponentName,
    }];
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
    // A serious injury: you decide how to recover before the season plays out
    if (injuryNeedsDecision(result.injury)) {
      sound.playCrowdGasp();
      setInjuryDecision({ result, resolved: null });
      return;
    }
    playSimulation(result);
  };

  const handleInjuryChoice = (choice) => {
    if (!injuryDecision) return;
    const resolved = applyInjuryChoice(injuryDecision.result, choice);
    if (resolved.injury?.relapse) sound.playBuzzer(); else sound.playCoin();
    setInjuryDecision({ ...injuryDecision, resolved });
  };

  const handleInjuryContinue = () => {
    const resolved = injuryDecision?.resolved;
    setInjuryDecision(null);
    if (resolved) playSimulation(resolved);
  };

  const playSimulation = (result) => {
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

  const handlePlaySeasonRef = useRef(null);
  useEffect(() => { handlePlaySeasonRef.current = handlePlaySeason; });

  const handleFinalResult = (won, meta = {}) => {
    let f = activeFinal;
    if (!f) return;
    // Skipping the last league game to rest: the coach doesn't love it (only once per season)
    if (meta.rested && !f.rested && f.seasonResult) {
      f = {
        ...f,
        rested: true,
        condition: { ...f.condition, energy: Math.min(100, (f.condition?.energy ?? 100) + 20) },
        seasonResult: { ...f.seasonResult, newManagerRel: Math.max(0, (f.seasonResult.newManagerRel ?? 65) - 3) },
      };
    }
    const results = [...f.results, {
      stage: f.stage, kind: f.kind, tier: f.tier, tournament: f.tournament, opponent: f.opponent, weight: f.weight, won,
    }];
    const nextIndex = f.index + 1;
    if (nextIndex < f.queue.length) {
      setActiveFinal({ ...f, ...f.queue[nextIndex], index: nextIndex, results });
      return;
    }
    setActiveFinal(null);
    finalizeSeason(f.seasonResult, { finals: results });
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
    if ((outcome.finals || []).some(f => f.won) || next.lastRecap?.titles?.length) sound.playTrophy();
    pushAchievements(next);
  };

  const handleRetire = () => {
    const p = playerRef.current;
    if (!p) return;
    commitPlayer(addMoment({ ...p, isRetired: true, offseasonStep: null }, { type: 'retire', icon: '👋', text: `Colgaste los botines a los ${p.age} años en ${p.currentClub.name}` }));
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
        <Suspense fallback={<LoadingOverlay />}>{sharedModals}</Suspense>
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
  const coach = getCoach(player);
  const coachFitNow = coach ? coachFit(coach, player) : 0;
  const chase = recordChase(player).filter(r => !r.broken);
  const activeChallenge = player.challenge?.status === 'active' ? player.challenge : null;
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
        <Suspense fallback={<LoadingBlock />}>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-5">
                {/* Left column (desktop): full player card */}
                <div className="hidden lg:block lg:col-span-1 space-y-4">
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

                <div className="lg:col-span-2 space-y-3 lg:space-y-5">
                  {/* Mobile: one-line player strip, full card in a sheet */}
                  <div className="lg:hidden">
                    <PlayerStrip player={player} onOpen={() => setShowPlayerCard(true)} />
                  </div>

                  <section className="panel p-3.5 sm:p-5 relative overflow-hidden">
                    <div className="season-glow" />

                    {/* Club header */}
                    <div className="relative flex items-center gap-3">
                      <ClubShield club={player.currentClub} size={44} />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#22E748]">
                          Temporada {seasonYear} · Año {player.seasonsPlayed + 1}
                        </span>
                        <h2 className="font-display text-2xl sm:text-4xl text-white leading-none truncate">
                          {player.currentClub?.name}
                        </h2>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {league} · ${Math.round(player.salary || 0).toLocaleString('es-AR')}/año
                          {player.contract && (
                            <span className={player.contract.yearsLeft <= 1 ? 'text-amber-300' : ''}>
                              {' '}· {player.contract.yearsLeft > 0 ? `${player.contract.yearsLeft} ${player.contract.yearsLeft === 1 ? 'año' : 'años'} de contrato` : 'contrato vence'}
                            </span>
                          )}
                        </p>
                        {coach && (
                          <p className="text-[11px] mt-0.5 truncate" title={COACH_STYLES[coach.style]?.label}>
                            <span className="text-gray-400">DT {coach.name} · </span>
                            <span className={coachFitNow > 0 ? 'text-[#22E748]' : coachFitNow < 0 ? 'text-red-300' : 'text-gray-300'}>
                              {COACH_STYLES[coach.style]?.icon} {COACH_STYLES[coach.style]?.label}
                              {coachFitNow > 0 ? ' (te favorece)' : coachFitNow < 0 ? ' (te juega en contra)' : ''}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {!isSimulating && !offseasonPending && (
                      <>
                        {/* Key numbers */}
                        <div className="relative mt-3 grid grid-cols-4 gap-1.5">
                          <MiniStat label="Energía" value={`${player.energy ?? 100}%`} tone={(player.energy ?? 100) >= 70 ? 'good' : (player.energy ?? 100) >= 45 ? 'warn' : 'bad'} />
                          <MiniStat label="Lesión" value={`${injuryRisk}%`} tone={injuryRisk >= 15 ? 'bad' : injuryRisk >= 9 ? 'warn' : 'good'} />
                          <MiniStat label="Forma" value={player.form > 0 ? `+${player.form}` : `${player.form || 0}`} tone={player.form > 0 ? 'good' : player.form < 0 ? 'bad' : ''} />
                          <MiniStat
                            label="Estatua"
                            value={player.hasStatue ? '🗽' : `${Math.min(seasonsAtCurrentClub(player), STATUE_MIN_SEASONS)}/${STATUE_MIN_SEASONS}`}
                            tone={player.hasStatue ? 'gold' : ''}
                            title={player.hasStatue ? `Tenés tu estatua en ${player.statueClubName || 'el club'}` : `Idolatría ${player.idolatry}/95 y ${STATUE_MIN_SEASONS} temporadas en el club`}
                          />
                        </div>

                        {/* Season context: one swipeable line */}
                        <div className="relative mt-2 -mx-3.5 sm:mx-0 px-3.5 sm:px-0 flex sm:flex-wrap gap-1.5 overflow-x-auto no-scrollbar">
                          {player.nextSeasonMods?.labels?.map((l, i) => <span key={`m${i}`} className="chip chip-gold shrink-0">{l}</span>)}
                          {activeChallenge && (
                            <span className="chip chip-gold shrink-0" title={CHALLENGES[activeChallenge.id]?.desc}>
                              {CHALLENGES[activeChallenge.id]?.icon} Desafío{activeChallenge.id === 'salvar' ? `: ${activeChallenge.seasonsDone || 0}/${CHALLENGES.salvar.seasons} temporadas` : ': ganar la copa grande'}
                            </span>
                          )}
                          {chase.map(r => (
                            <span key={r.scope} className="chip shrink-0" title={`Récord de ${r.teamName}: ${r.holder} (${r.value} ${RECORD_INFO[r.stat].unit})`}>
                              📜 {r.scope === 'national' ? 'Selección' : 'Récord'}: {r.mine}/{r.value}
                            </span>
                          ))}
                          {player.loan && <span className="chip chip-up shrink-0" title="Al final de la temporada elegís si volver">🔁 Cedido por {player.loan.parentClubName}</span>}
                          <span className="chip chip-gold shrink-0" title="Objetivo de la dirigencia">
                            {getClubObjective(player.currentClub).icon} {getClubObjective(player.currentClub).label}
                          </span>
                          {player.bonusFinal > 0 && <span className="chip chip-gold shrink-0">🎯 Final +{player.bonusFinal}%</span>}
                          <span className={`chip shrink-0 ${getContinentalEntry(player) ? 'chip-up' : ''}`} title="Copa internacional">
                            🌎 {getContinentalEntry(player)?.name || 'Sin copa internacional'}
                          </span>
                          <span className="chip shrink-0" title="Copa nacional">🥇 {domesticCupName(player.currentClub.league)}</span>
                          <span className="chip shrink-0" title={getDifficulty(player).desc}>{getDifficulty(player).icon} {getDifficulty(player).label}</span>
                          <span className="chip shrink-0">⏳ {player.gameMode === 'ultra' ? `${yearsLeft} temp. restantes` : `Retiro en ${yearsLeft} años`}</span>
                        </div>

                        {/* Minutes plan: segmented control */}
                        {!player.seasonInProgress?.results?.length && (
                          <div className="relative mt-3">
                            <span className="section-label text-sky-300">Minutos</span>
                            <div className="segmented mt-1">
                              {Object.values(WORKLOADS).map(w => {
                                const active = getWorkload(player).id === w.id;
                                return (
                                  <button
                                    key={w.id}
                                    onClick={() => { sound.playClick(); commitPlayer({ ...playerRef.current, workload: w.id }); }}
                                    className={active ? 'is-active' : ''}
                                    aria-pressed={active}
                                    title={w.desc}
                                  >
                                    {w.icon} {w.label}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 leading-snug line-clamp-2">{getWorkload(player).desc}</p>
                          </div>
                        )}

                        {/* Tactical prep: three compact tiles */}
                        <div className="relative mt-3">
                          <div className="flex items-center justify-between">
                            <span className="section-label text-amber-400">Preparación</span>
                            <span className="text-[10px] font-mono font-bold text-gray-400">🪙 {player.coins}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 mt-1">
                            {BOOSTS.map(b => {
                              const bought = player.seasonBoosts?.[b.id];
                              const blocked = !bought && ((player.coins || 0) < b.cost || b.disabled?.(player));
                              return (
                                <button
                                  key={b.id}
                                  onClick={() => handleBuyBoost(b)}
                                  disabled={bought || blocked}
                                  title={b.desc}
                                  className={`boost-tile boost-${b.color} ${bought ? 'boost-bought' : blocked ? 'boost-blocked' : ''}`}
                                >
                                  <span className="flex items-center justify-between w-full">
                                    <b.Icon className="w-3.5 h-3.5 boost-tile-icon" />
                                    <span className="text-[10px] font-mono font-bold text-amber-400">{bought ? '✓' : `🪙${b.cost}`}</span>
                                  </span>
                                  <span className="text-[11px] font-black leading-tight block mt-1 truncate w-full text-left">{b.title}</span>
                                  <span className="text-[9.5px] text-gray-400 leading-tight block mt-0.5 line-clamp-2 text-left">{b.desc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Simulation */}
                    {isSimulating && (
                      <div className="relative py-6 text-center space-y-4">
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
                        <button onClick={handleSkipSimulation} className="text-xs font-black text-amber-400 hover:text-amber-300 underline cursor-pointer">
                          ⚡ Ver resultado ya
                        </button>
                      </div>
                    )}

                    {/* Recap / off-season */}
                    {showRecap && !isSimulating && (
                      <SeasonRecap recap={player.lastRecap} player={player} onContinue={handleContinueOffseason} />
                    )}
                    {offseasonPending && !showRecap && !isSimulating && (
                      <div className="relative mt-4 p-4 rounded-2xl border border-[#22E748]/30 bg-[#22E748]/5 text-center">
                        <p className="text-sm text-gray-200 font-bold mb-3">
                          {player.offseasonStep === 'cards' ? 'Elegí tu entrenamiento de pretemporada para arrancar el año.' : 'Tenés el receso de temporada pendiente.'}
                        </p>
                        <button onClick={handleContinueOffseason} className="btn-primary">Continuar ➔</button>
                      </div>
                    )}

                    {/* Play */}
                    {!isSimulating && !offseasonPending && (
                      <div className="relative mt-3.5">
                        <button onClick={handlePlaySeason} className="play-btn w-full">
                          <Play className="w-5 h-5 fill-current" />
                          <span>{player.seasonInProgress ? 'Seguir la temporada' : `Jugar temporada ${seasonYear}`}</span>
                        </button>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <button
                            onClick={() => { sound.playClick(); setFastSimulation(f => !f); }}
                            className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer ${fastSimulation ? 'text-amber-300' : 'text-gray-400 hover:text-white'}`}
                            title="Simulación animada o instantánea"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            {fastSimulation ? 'Instantánea' : 'Animada'}
                          </button>
                          {canRetire && (confirmRetire ? (
                            <span className="flex items-center gap-1.5">
                              <span className="text-[11px] text-gray-300">¿Retirarte?</span>
                              <button onClick={handleRetire} className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[11px] font-black cursor-pointer">Sí</button>
                              <button onClick={() => setConfirmRetire(false)} className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-bold cursor-pointer">No</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmRetire(true)} className="text-[11px] font-bold text-gray-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer">
                              <Flag className="w-3 h-3" /> Colgar los botines
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Desktop extras (on mobile they live in Palmarés) */}
                  <div className="hidden lg:block">
                    <CareerTimeline player={player} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vitrina' && (
              <TrophyCabinet player={player} />
            )}
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
        </Suspense>
      </main>

      <Suspense fallback={<LoadingOverlay />}>
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
      {offseasonOpen && player.offseasonStep === 'dilemma' && (player.pendingDilemmaResult || currentDilemma) && (
        <DilemmaModal
          key={player.pendingDilemmaResult ? `result-${player.pendingDilemmaResult.dilemmaId}` : currentDilemma.id}
          dilemma={currentDilemma}
          result={player.pendingDilemmaResult}
          player={player}
          onResolve={handleResolveDilemma}
          onContinue={handleDilemmaContinue}
        />
      )}
      {offseasonOpen && player.offseasonStep === 'transfers' && player.pendingOffers && (
        <TransfersModal
          player={player}
          offers={player.pendingOffers}
          isFreeAgent={player.pendingMarketFree !== false}
          released={Boolean(player.pendingMarketReleased)}
          yearsRange={contractYearsRange(player.age)}
          onAcceptOffer={handleAcceptOffer}
          onNegotiate={handleNegotiate}
          loanEnd={Boolean(player.loan)}
        />
      )}

      {modal === 'store' && <StoreModal player={player} onBuyItem={handleBuyStoreItem} onClose={closeModal} />}

      {/* National team call-up decision */}
      {ntCallOpen && player.seasonInProgress?.ntCall && !player.seasonInProgress.ntDecision && (
        <NationalCallModal player={player} tournament={player.seasonInProgress.ntCall} onDecide={handleNationalDecision} />
      )}

      {/* Key matches during the season */}
      {injuryDecision && (
        <InjuryModal
          injury={injuryDecision.result.injury}
          resolved={injuryDecision.resolved}
          onChoose={handleInjuryChoice}
          onContinue={handleInjuryContinue}
        />
      )}
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
            key={`${activeFinal.index}-${activeFinal.stage}-${activeFinal.tournament}`}
            final={activeFinal}
            player={player}
            onFinish={handleFinalResult}
          />
        </div>
      )}

      {sharedModals}
      </Suspense>

      {showPlayerCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fadeIn" onClick={() => setShowPlayerCard(false)}>
          <div className="sheet animate-slideUp" onClick={e => e.stopPropagation()} role="dialog" aria-label="Ficha del jugador">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-2" />
            <PlayerCard player={player} />
            <button onClick={() => setShowPlayerCard(false)} className="w-full mt-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-200 cursor-pointer">Cerrar</button>
          </div>
        </div>
      )}

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
