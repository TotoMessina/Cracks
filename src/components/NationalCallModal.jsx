import React from 'react';
import Flag from './Flag';
import { getCountryById } from '../data/clubs';
import { getNationalCareer, NT_STATUS_LABEL, getPlayerOverall } from '../game/career';
import { sound } from '../utils/audio';

export default function NationalCallModal({ player, tournament, onDecide }) {
  const country = getCountryById(player.country);
  const nt = getNationalCareer(player);
  const indispensable = getPlayerOverall(player) >= 85;
  const debut = nt.status === 'none';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="mg-card max-w-xl text-center space-y-4 animate-pop border-sky-400/40">
        <div className="flex justify-center"><Flag code={player.country} size={40} title={country.name} /></div>
        <div>
          <span className="mg-badge text-sky-300 bg-sky-400/10 border-sky-400/30">Convocatoria</span>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-2">{tournament.icon} {tournament.name}</h3>
          <p className="text-sm text-gray-300 mt-1">
            {debut
              ? `¡${country.nationalTeam} te convoca por primera vez para el gran torneo!`
              : `${country.nationalTeam} te vuelve a convocar · ${NT_STATUS_LABEL[nt.status]}${nt.shirt ? ` · camiseta ${nt.shirt}` : ''}`}
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Tu club ({player.currentClub.shortName}) prefiere que descanses: el torneo te come parte de la pretemporada.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
          <button
            onClick={() => { sound.playWhistle(); onDecide('go'); }}
            className="p-3 rounded-xl border border-sky-400/50 bg-sky-400/10 hover:bg-sky-400/20 cursor-pointer"
          >
            <span className="text-sm font-black text-white block">✈️ Ir al torneo</span>
            <span className="text-[11px] text-gray-300 block mt-1">Partidos y goles con la Selección, chance de jugar la final y de crecer en jerarquía.</span>
            <span className="text-[11px] text-red-300 block mt-1">+3% de riesgo de lesión · más desgaste · −2 con el DT de tu club</span>
          </button>
          <button
            onClick={() => { sound.playClick(); onDecide('decline'); }}
            className="p-3 rounded-xl border border-white/15 bg-black/30 hover:border-white/30 cursor-pointer"
          >
            <span className="text-sm font-black text-white block">🏠 Pedir no ir</span>
            <span className="text-[11px] text-gray-300 block mt-1">+4 con el DT de tu club, +3 de idolatría y llegás más fresco.</span>
            <span className="text-[11px] text-red-300 block mt-1">
              −3 de fama · {indispensable ? 'sos indiscutido: te van a seguir llamando' : 'la próxima temporada no te convocan'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
