import React from 'react';
import { BookOpen, X, Trophy, Shield, Zap, AlertTriangle, Sparkles, Calendar, Target, Coins, TrendingUp, Star } from 'lucide-react';
import { RETIREMENT_AGE, VOLUNTARY_RETIREMENT_AGE, TRAINING_REWARDS_PER_SEASON } from '../game/career';
import { STATUE_IDOLATRY, STATUE_MIN_SEASONS } from '../game/effects';

function Section({ icon, title, children, tone = 'bg-[#0e1712] border-white/5', titleClass = 'text-white' }) {
  return (
    <section className={`border rounded-2xl p-4 ${tone}`}>
      <h3 className={`text-base font-black mb-2 flex items-center gap-2 ${titleClass}`}>
        {icon}
        <span>{title}</span>
      </h3>
      <div className="text-xs text-gray-300 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function GuideModal({ onClose, onOpenTutorial }) {
  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Guía de El Ídolo"
    >
      <div className="bg-[#0b130e] border border-[#22E748]/40 rounded-3xl max-w-3xl w-full p-5 sm:p-6 md:p-8 shadow-2xl relative max-h-[92vh] flex flex-col animate-pop">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#22E748]/10 border border-[#22E748]/30 rounded-xl text-[#22E748]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">Guía de El Ídolo</h2>
              <p className="text-xs text-gray-400">Reglas y consejos para ir de las inferiores a la estatua.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 overflow-y-auto space-y-4 text-sm text-gray-300 pr-1">
          <Section icon={<Zap className="w-4 h-4 text-[#22E748]" />} title="¿De qué se trata?">
            <p>
              Arrancás a los 16 años en un club chico y jugás temporada por temporada hasta los {RETIREMENT_AGE}
              {' '}(en <strong>Modo Ultra</strong>, solo 2 temporadas). Desde los {VOLUNTARY_RETIREMENT_AGE} podés colgar los botines cuando quieras.
              Cada decisión cuenta: no hay vuelta atrás.
            </p>
          </Section>

          <Section icon={<Star className="w-4 h-4 text-amber-300" />} title="Dificultad">
            <p>
              Se elige al crear la carrera. <strong className="text-white">Fácil</strong>: tu equipo rinde más en la tabla y en las copas, minijuegos más amables (+8%), menos lesiones y la hinchada te quiere más rápido.
              <strong className="text-white"> Normal</strong>: la experiencia pensada. <strong className="text-white">Leyenda</strong>: tu equipo rinde menos en la tabla y en las copas, minijuegos un nivel más difíciles (−5%), más lesiones y una hinchada exigente.
              Tu puntaje de gloria en el Salón de la Fama vale ×0,8 en Fácil y ×1,3 en Leyenda.
            </p>
          </Section>

          <Section icon={<Calendar className="w-4 h-4 text-sky-400" />} title="El ciclo de cada año">
            <ol className="list-decimal list-inside space-y-1.5">
              <li><strong className="text-white">Pretemporada:</strong> elegís 1 de 3 cartas de entrenamiento (🪙 5 para cambiarlas, 🪙 15 para quedarte con 2).</li>
              <li><strong className="text-white">Plan de minutos:</strong> rotar (menos partidos, menos desgaste y lesiones), normal o jugar todo (más goles y el DT contento, pero terminás fundido). Si arrancás una temporada con menos de 70% de energía rendís menos, y la energía con la que terminás el año pesa en las finales.</li>
              <li><strong className="text-white">Preparación táctica:</strong> gastá monedas en ventaja para la final, concentración (+1 forma) o fisio (+energía, menos lesiones).</li>
              <li><strong className="text-white">Partidos clave:</strong> el clásico (o un partido decisivo) y a veces una noche de copa o un partido de la Selección. Los jugás con un minijuego o los simulás: ganarlos suma idolatría, confianza del DT y chances de llegar a la final; perderlos resta.</li>
              <li><strong className="text-white">Temporada:</strong> se juegan la liga, la copa nacional y, si tu club clasificó, la copa internacional. Las finales las jugás vos, una detrás de otra.</li>
              <li><strong className="text-white">Receso:</strong> un dilema, después el mercado de pases y vuelta a la pretemporada. Ojo con los dilemas: algunos te cambian de club, te dejan sanciones o secuelas para el año siguiente, o vuelven a aparecer temporadas después. Todo queda guardado aunque cierres la página.</li>
            </ol>
          </Section>

          <Section icon={<Trophy className="w-4 h-4 text-amber-300" />} title="Competencias">
            <ul className="space-y-1.5">
              <li><strong className="text-white">Liga:</strong> la gana el primero de la tabla. Si el título se define por 4 puntos o menos, se juega en la última fecha (una final). En segunda división, el 1° asciende directo y del 2° al 5° juegan el reducido o play-off.</li>
              <li><strong className="text-white">Copa nacional</strong> (Copa Argentina, FA Cup, Copa del Rey...): eliminación directa y la juegan también los de segunda, así que hay batacazos. Ganarla te clasifica a una copa internacional.</li>
              <li><strong className="text-white">Copas internacionales:</strong> se clasifican por la tabla del año anterior. Europa: Champions, Europa League y Conference. Sudamérica: Libertadores y Sudamericana. También Concacaf y AFC. Fase de grupos, octavos, cuartos, semis y final.</li>
              <li><strong className="text-white">Ascensos y descensos:</strong> en Argentina bajan 2 de la Liga Profesional y suben 2 de la Primera Nacional (campeón + reducido); en Inglaterra bajan 3 de la Premier y suben 3 del Championship (2 directos + play-off). Todos los clubes se mueven año a año. Si tu club desciende te podés ir gratis, o quedarte para devolverlo a primera (+12 de idolatría).</li>
              <li><strong className="text-white">Objetivos de la dirigencia:</strong> según el tamaño del club (salir campeón, clasificar a copa, mitad de tabla, evitar el descenso, ascender). Cumplirlo suma +8 con el DT, +4 de idolatría y 3 monedas; no cumplirlo resta (mucho más si descendés).</li>
              <li><strong className="text-white">Supercopas</strong> (al arrancar la temporada siguiente): campeón de liga vs campeón de copa (Supercopa Argentina, Community Shield...), la Recopa Sudamericana o Supercopa de la UEFA si ganaste una copa internacional, y la <strong className="text-white">Copa Intercontinental</strong> contra el campeón del otro continente si ganaste la Libertadores o la Champions. Se juegan como partido clave; si te vas del club, te las perdés.</li>
              <li>Cada título vale distinto en gloria, plata e idolatría: Intercontinental y Champions/Libertadores &gt; liga &gt; copa nacional y copas menores &gt; supercopas.</li>
            </ul>
          </Section>

          <Section icon={<Target className="w-4 h-4 text-amber-400" />} title="Las finales: al mejor de 3 jugadas">
            <p>Cada final se define en una serie de hasta 3 minijuegos: ganás 2 y levantás la copa.</p>
            <ul className="space-y-1">
              <li>⚽ <strong className="text-white">Penal:</strong> tocá un palo cuando la aguja esté en la zona verde (← ↑ →).</li>
              <li>🎯 <strong className="text-white">Tiro libre:</strong> elegí ángulo y comba (rosca equilibrada, fuerte seco que vence al arquero, tres dedos que lo engaña) y frená la aguja.</li>
              <li>🗣️ <strong className="text-white">Cabezazo:</strong> saltá (Espacio) cuando el centro pasa por la zona verde.</li>
              <li>🧤 <strong className="text-white">Atajada:</strong> mirá hacia dónde sale la pelota y tirate a ese rincón (Q / E / A / D) antes de que entre.</li>
              <li>🏆 <strong className="text-white">Trile:</strong> seguí con la vista el vaso que tiene la copa mientras se mezclan.</li>
            </ul>
            <p>Tu atributo clave (Definición, Pegada o Reflejos) agranda la zona verde o te da más tiempo, y la dificultad sube en Libertadores, Champions y Mundial. Tu <strong className="text-white">forma</strong> (±4% por punto) y tu <strong className="text-white">energía</strong> (+3% si estás fresco, hasta −10% si llegás fundido) también suman o restan; si llegás cansado a una final podés cuidarte la semana previa. En la pestaña <strong className="text-white">Entrenar</strong> podés practicar y ganar 🪙 2 por acierto ({TRAINING_REWARDS_PER_SEASON} premios por temporada).</p>
          </Section>

          <Section icon={<Star className="w-4 h-4 text-sky-300" />} title="La Selección">
            <p>
              Te convocan si tu nivel y tu fama alcanzan (los países más fuertes piden más). Las eliminatorias se juegan solas, pero antes de un
              <strong className="text-white"> Mundial o Copa Continental</strong> decidís: ir (más partidos, chance de final, +3% de riesgo de lesión y −2 con el DT de tu club)
              o pedir no ir (+4 con el DT, +3 de idolatría, −3 de fama y, salvo que seas indiscutido, la próxima temporada no te llaman).
            </p>
            <p>
              Debutás con un número de suplente; con 12 partidos y nivel 77 te ganás la titularidad y la camiseta de tu puesto (9, 10 o 1),
              y si sos de los mejores (nivel 84, 45 partidos, entre 27 y 33 años, con mucho liderazgo o fama) podés ser <strong className="text-white">capitán</strong> (+5% en las finales con la Selección).
            </p>
          </Section>

          <Section icon={<Shield className="w-4 h-4 text-amber-400" />} title="Los puestos">
            <ul className="space-y-1.5">
              <li><strong className="text-red-400">El 9 (Delantero):</strong> goles. Definición, Potencia, Gambeta y Resistencia.</li>
              <li><strong className="text-amber-400">El 10 (Enganche):</strong> asistencias y pelota parada. Pegada, Gambeta, Liderazgo y Resistencia.</li>
              <li><strong className="text-cyan-400">El 1 (Arquero):</strong> vallas invictas. Reflejos, Agilidad, Salida, Mando y Resistencia.</li>
            </ul>
            <p>Si una carta o dilema da un atributo que tu puesto no tiene, no aplica. El Liderazgo, en ese caso, suma al clima del vestuario.</p>
          </Section>

          <Section icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} title="Crecer y envejecer">
            <p>
              Hasta los 21 mejorás mucho cada año, hasta los 29 un poco y desde los 31 empieza el declive físico (desde los 33 también el técnico).
              Una gran temporada te sube el atributo clave. El Kinesiólogo de la tienda reduce el declive.
            </p>
          </Section>

          <Section icon={<Coins className="w-4 h-4 text-emerald-400" />} title="Contratos y dinero">
            <p>
              Firmás contratos de 1 a 5 años (los pibes pueden firmar más largo, los veteranos menos). El sueldo queda fijo hasta que termina:
              un contrato largo te protege si bajás el nivel, pero si mejorás vas a cobrar menos de lo que valés. Mientras tengas contrato no vas al mercado:
              solo te vas si un club más grande paga tu cláusula, o tu club te ofrece renegociar si cobrás muy por debajo de tu nivel.
              Cuando se termina, sos libre de elegir club (renovar suma algo de idolatría). Los clubes grandes y las ligas más ricas pagan mucho más,
              y ganar una final suma un premio extra. Con la plata comprás mejoras permanentes en la tienda.
            </p>
          </Section>

          <Section icon={<Trophy className="w-4 h-4 text-yellow-400" />} title="Idolatría y la estatua">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              {[
                ['0 - 20', 'Uno más', 'text-gray-300'],
                ['21 - 45', 'Querido', 'text-emerald-400'],
                ['46 - 70', 'Referente', 'text-blue-400'],
                ['71 - 94', 'Ídolo', 'text-[#22E748]'],
                ['95 - 100', '🗽 Leyenda', 'text-amber-300'],
              ].map(([range, label, c]) => (
                <div key={label} className="bg-black/30 p-2 rounded-lg border border-white/5">
                  <span className="block text-gray-400 text-[10px]">{range}</span>
                  <span className={`font-bold ${c}`}>{label}</span>
                </div>
              ))}
            </div>
            <p>
              Títulos, grandes temporadas y lealtad suman idolatría; un año gris la hace bajar. Cuanto más alta, más cuesta subirla.
              La estatua llega cuando tenés <strong className="text-amber-300">{STATUE_IDOLATRY} de idolatría y al menos {STATUE_MIN_SEASONS} temporadas</strong> en el mismo club.
              Si cambiás de club, arrancás de nuevo (volver a un ex club conserva parte del cariño).
            </p>
          </Section>

          <Section
            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
            title="La traición al clásico rival"
            tone="bg-red-950/30 border-red-500/30"
            titleClass="text-red-300"
          >
            <p className="text-red-200/90">
              El rival de toda la vida puede ofrecerte una fortuna. Si firmás, tu idolatría queda en cero y para tu ex hinchada serás un traidor para siempre.
            </p>
          </Section>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2 items-center justify-between flex-shrink-0">
          {onOpenTutorial && (
            <button
              onClick={() => { onClose(); onOpenTutorial(); }}
              className="px-4 py-2 bg-[#122419] hover:bg-[#1a3826] text-[#22E748] border border-[#22E748]/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ver tutorial rápido
            </button>
          )}
          <button onClick={onClose} className="btn-primary ml-auto text-xs">¡Entendido, a jugar! ➔</button>
        </div>
      </div>
    </div>
  );
}
