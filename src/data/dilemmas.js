// Narrative Dilemmas & Career Decisions for El Ídolo
// High-stakes choices with direct consequences on Stats, Idolatry, Fame, and Club status

export const DILEMMAS = [
  // 1. Vida Nocturna & Amigos
  {
    id: "clasico_previa",
    title: "La Noche Antes del Clásico",
    category: "vida_nocturna",
    text: "Tus amigos de la infancia te invitan a un asado y una fiesta clandestina la noche previa al partido más caliente del año. «Tranqui, volvemos a las dos», te dicen.",
    options: [
      {
        text: "Ir a la joda: «Una cerveza no le hace mal a nadie».",
        outcome: "Te sacaron una foto en el boliche a las 4 AM. El DT te cuelga medio tiempo, pero la historia se hizo viral.",
        effects: { forma: -1, resistencia: -2, fama: 4, idolatria: -5 },
        actions: [{ type: 'followUp', dilemmaId: 'clasico_previa_reincidencia', delay: 1, label: 'El DT te va a poner a prueba.' }]
      },
      {
        text: "Quedarte concentrado mirando videos del rival.",
        outcome: "Llegas al partido con la mente afilada y descansas como un profesional.",
        effects: { forma: 1, definicion: 1, liderazgo: 1, idolatria: 4 }
      }
    ]
  },

  // 2. Lesiones & Sacrificio
  {
    id: "lesion_semifinal",
    title: "El Desgarro y la Noche Copera",
    category: "lesion",
    text: "En la semifinal de ida sentiste un pinchazo en el isquiotibial. El médico te dice que tenés un desgarro de 4 mm. La vuelta se juega en 4 días y la gente te suplica que juegues.",
    options: [
      {
        text: "Infiltrarte con anestesia: «Me rompo todo pero la juego».",
        outcome: "Entraste como un león herido, jugaste con el corazón y la hinchada coreó tu nombre hasta las lágrimas, pero terminaste la temporada con la pierna a la miseria.",
        effects: { idolatria: 15, fama: 6, resistencia: -4, definicion: 2 },
        actions: [{ type: 'nextSeason', injuryRisk: 8, label: '+8% de riesgo de lesión por la infiltración' }]
      },
      {
        text: "Cuidarte y recuperarte: «Primero está mi salud y mi carrera».",
        outcome: "El equipo empató sin vos. Algunos hinchas en redes te criticaron por frío, pero estás al 100% para lo que viene.",
        effects: { resistencia: 3, forma: 1, idolatria: -6 }
      }
    ]
  },

  // 3. Prensa & Declaraciones
  {
    id: "arbitraje_prensa",
    title: "Micrófono Abierto: Bronca con el Juez",
    category: "prensa",
    text: "El árbitro les cobró un penal inventado en el minuto 94. Al salir del vestuario, todos los micrófonos de la televisión te apuntan a la cara: «¿Qué tenés para decir del penal?»",
    options: [
      {
        text: "Prender fuego todo: «Esto fue un afano descarado, nos robaron en la cara».",
        outcome: "El tribunal de disciplina te metió 2 fechas de sanción, pero la gente del club te ama por decir la verdad que todos callan.",
        effects: { idolatria: 12, liderazgo: 3, dinero: -10000, fama: 5 },
        actions: [{ type: 'nextSeason', suspension: 2, label: '2 fechas de sanción' }]
      },
      {
        text: "Bajarle el tono: «Los árbitros se equivocan como nosotros, hay que seguir».",
        outcome: "Respuesta impecable de profesional. La prensa elogia tu madurez y el DT te felicita por la frialdad.",
        effects: { liderazgo: 2, fama: 2, forma: 1 }
      }
    ]
  },

  // 4. Vestuario & Jerarquías
  {
    id: "pelea_referente",
    title: "Tormenta en el Vestuario",
    category: "vestuario",
    text: "El capitán del equipo, un veterano de mil batallas, te recriminó a los gritos una jugada donde no le diste el pase: «¡Acá no se juega para la tribuna, pibe!». Todo el plantel mira en silencio.",
    options: [
      {
        text: "Plantarte cara a cara: «El que manda en la cancha hoy soy yo».",
        outcome: "Se armó un revuelo tremendo. Tuvieron que separarlos. El vestuario quedó dividido, pero ganaste estatus de líder con carácter.",
        effects: { liderazgo: 5, potencia: 2, idolatria: -2 }
      },
      {
        text: "Bajar la mirada y pedir disculpas: «Tenés razón, la próxima te la doy».",
        outcome: "El referente te puso el brazo al hombro al final de la práctica. Te ganaste su respeto y sus consejos.",
        effects: { liderazgo: 2, pegada: 1, idolatria: 4 }
      }
    ]
  },

  // 5. Definiciones calientes
  {
    id: "penal_minuto_90",
    title: "El Penal del Campeonato",
    category: "final",
    text: "Minuto 93 de un clásico decisivo. 1 a 1 en el marcador. Penal para tu equipo. La pelota quema en el pasto y el designado habitual mira al banco dudando.",
    options: [
      {
        text: "Agarrar la pelota vos mismo: «Dejamela a mí, esto lo defino yo».",
        outcome: "Caminaste al punto del penal con 50.000 personas enmudecidas. Tu personalidad intimidó al arquero rival.",
        effects: { liderazgo: 4, fama: 5, definicion: 2, idolatria: 8 }
      },
      {
        text: "Darle confianza a tu compañero: «Pateala vos amigo, la vas a clavar».",
        outcome: "Un acto de humildad que unió al grupo para siempre. Tu compañero tomó coraje y la mandó a guardar.",
        effects: { liderazgo: 3, forma: 1, idolatria: 3 }
      }
    ]
  },

  // 6. Oferta tentadora
  {
    id: "oferta_petrodolares",
    title: "La Tentación de Medio Oriente",
    category: "negocios",
    text: "Un emisario de un club árabe llega con una prima de 3 millones de dólares para vos y un sueldo astronómico. Tu club necesita vender para pagar deudas.",
    options: [
      {
        text: "Quedarte por amor a la camiseta: «La gloria no se compra con plata».",
        outcome: "Rechazaste la fortuna. La hinchada te ovaciona de pie y se pintan murales con tu frase en las calles del barrio.",
        effects: { idolatria: 20, fama: 6, dinero: 0 }
      },
      {
        text: "Aceptar la montaña de billetes: «Tengo que salvar a mi familia por 3 generaciones».",
        outcome: "Te vas a jugar en un estadio de jeques aplaudiendo. Tu cuenta bancaria estalla, aunque deportivamente competís en una liga exótica.",
        effects: { dinero: 3000000, fama: -2 },
        actions: [{ type: 'transfer', league: 'sau_pro', salaryMult: 1.6, years: 3, label: 'Te vas ya a la Saudi Pro League con un contrato de 3 años.' }]
      }
    ]
  },

  // 7. Selección Nacional
  {
    id: "llamado_seleccion",
    title: "La Camiseta de tu País",
    category: "seleccion",
    text: "El DT de la Selección te llama por teléfono: «Te estuve mirando, pibe. Te quiero convocar para la próxima doble fecha». El dilema: coincide con una fecha crucial de tu club.",
    options: [
      {
        text: "Viajar corriendo al predio: «Pisar el predio con los colores de mi patria es mi sueño».",
        outcome: "Debutaste en la Mayor con ovación de todo un país. Tu cotización mundial se disparó a las nubes.",
        effects: { fama: 12, liderazgo: 4, definicion: 2, pegada: 2, idolatria: 5 }
      },
      {
        text: "Pedir permiso para quedarte con tu club en este momento crítico.",
        outcome: "La hinchada de tu club no puede creer tu lealtad. El DT de la Selección prometió llamarte para el torneo continental.",
        effects: { idolatria: 15, forma: 2, liderazgo: 3 },
        actions: [{ type: 'nextSeason', forceCallUp: true, label: 'El DT de la Selección te convoca sí o sí' }]
      }
    ]
  },

  // 8. Ética & Apuestas
  {
    id: "apuestas_clandestinas",
    title: "El Hombre del Maletín",
    category: "etica",
    text: "Un sujeto bien vestido te intercepta en el estacionamiento del estadio: «Pibe, hacete sacar una amarilla antes de los 30 minutos del primer tiempo y hay $40.000 verdes en efectivo para vos».",
    options: [
      {
        text: "Echarlo a los gritos: «¡Andate ya o te arranco la cabeza, delincuente!».",
        outcome: "Denunciaste el hecho a la dirigencia. Tu ética intachable te convirtió en un ejemplo para todas las inferiores.",
        effects: { idolatria: 10, liderazgo: 4, forma: 1 }
      },
      {
        text: "Aceptar con disimulo: «Total una amarilla en mitad de cancha no le hace daño a nadie».",
        outcome: "Pegaste una patada desmedida a los 25 minutos y cobraste el dinero, pero la culpa te carcome por dentro cada vez que entrás a la cancha.",
        effects: { dinero: 40000, forma: -1, idolatria: -8, liderazgo: -3 },
        actions: [{ type: 'followUp', dilemmaId: 'apuestas_investigacion', delay: 1, label: 'Alguien filmó la patada...' }]
      }
    ]
  },

  // 9. Medios & Streamers
  {
    id: "streamer_polemica",
    title: "El Streamer del Momento",
    category: "prensa",
    text: "El streamer más popular de habla hispana te invita a prender directo en Twitch ante 120.000 espectadores la semana previa al clásico. Te pide que «tires un poco de picante».",
    options: [
      {
        text: "Prender y picantear: «El domingo los pasamos por arriba, no existen».",
        outcome: "El clip se volvió tendencia mundial en TikTok y Twitter. El clásico se calentó al máximo y tu fama explotó.",
        effects: { fama: 10, dinero: 15000, forma: -1, potencia: 1 }
      },
      {
        text: "Agradecer y rechazar: «En la semana del clásico se habla en la cancha».",
        outcome: "El cuerpo técnico y los hinchas grandes valoraron tu seriedad de tipo grande que no se marea con las luces.",
        effects: { liderazgo: 3, idolatria: 6, forma: 1 }
      }
    ]
  },

  // 10. Hinchada & Barras
  {
    id: "visita_barra",
    title: "La Visita al Entrenamiento",
    category: "hinchada",
    text: "Tras dos derrotas seguidas, diez referentes de la barra brava entran al vestuario sin golpear la puerta. El clima se corta con una gillette: «El domingo hay que ganar como sea».",
    options: [
      {
        text: "Poner el pecho adelante: «Acá nos rompemos el lomo todos los días, respeten».",
        outcome: "Hubo tensión extrema, pero te plantaste sin temblar. El plantel te miró como al verdadero líder del club.",
        effects: { liderazgo: 6, potencia: 2, idolatria: 4 }
      },
      {
        text: "Bajar la cabeza y prometer: «Quédense tranquilos que vamos a dejar la vida».",
        outcome: "Evitaste un problema mayor y la barra se retiró conforme con tus palabras.",
        effects: { forma: 1, liderazgo: -1, idolatria: 1 }
      }
    ]
  },

  // 11. Familia & Orígenes
  {
    id: "casa_madre",
    title: "La Promesa a la Vieja",
    category: "familia",
    text: "Llegó el cobro de tu primera prima importante en el fútbol profesional. Siempre soñaste con sacar a tu mamá del barrio humilde y comprarle una casa digna con jardín.",
    options: [
      {
        text: "Comprarle la casa a mamá sin dudarlo un segundo.",
        outcome: "Tu mamá lloró abrazada a vos con las llaves en la mano. La paz espiritual te llena de energía positiva para jugar.",
        effects: { dinero: -80000, forma: 2, idolatria: 8, liderazgo: 2 }
      },
      {
        text: "Priorizar un auto deportivo de alta gama para posicionar tu imagen.",
        outcome: "Llegas al entrenamiento en una nave que hace ruido, llamando la atención de las marcas y los fotógrafos.",
        effects: { dinero: -60000, fama: 8, idolatria: -2 }
      }
    ]
  },

  // 12. Pillería de potrero
  {
    id: "simulacion_penal",
    title: "La Picardía Criolla",
    category: "etica",
    text: "Minuto 89. Vas 0-0. Entrás al área gambeteando y el central rival tira la pierna sin tocarte. Podés tirarte a la pileta teatralmente o seguir corriendo exigido.",
    options: [
      {
        text: "Tirarte con todo: «En el potrero vale todo para ganar».",
        outcome: "El árbitro compró el engaño y cobró penal. Ganaron el partido, aunque las cámaras de TV te dejaron en evidencia ante el país.",
        effects: { definicion: 2, idolatria: 5, fama: -2 }
      },
      {
        text: "Seguir la jugada de pie intentando definir con orgullo.",
        outcome: "El remate salió mordido y terminó afuera, pero recibiste el aplauso de Fair Play de todo el estadio.",
        effects: { liderazgo: 3, forma: 1, fama: 3 }
      }
    ]
  },

  // 13. Asado de Grupo
  {
    id: "asado_unir_grupo",
    title: "El Asado de la Discordia",
    category: "vestuario",
    text: "El equipo viene dividido entre pibes y grandes. Proponés pagar un gran asado de costillar para todo el plantel, utileros y cuerpo médico para limar asperezas.",
    options: [
      {
        text: "Pagar el asado completo y tocar la guitarra hasta tarde.",
        outcome: "Comieron, cantaron cumbia y se dijeron las verdades en la cara. El grupo salió blindado y unido como una familia.",
        effects: { dinero: -5000, forma: 2, liderazgo: 5, idolatria: 4 }
      },
      {
        text: "Ahorrarte la plata y dejar que el DT lo resuelva con doble turno.",
        outcome: "El ambiente siguió frío en el vestuario, pero no gastaste un solo peso de tu bolsillo.",
        effects: { dinero: 0, forma: -1, liderazgo: -2 }
      }
    ]
  },

  // 14. Pibe de Inferiores
  {
    id: "pibe_inferiores",
    title: "La Joyita de Reserva",
    category: "vestuario",
    text: "Sube a primera un pibe de 16 años que juega en tu mismo puesto y es un demonio con la pelota. En la primera práctica te tira un caño en el loco.",
    options: [
      {
        text: "Felicitarlo, regalarle un par de botines y ser su mentor.",
        outcome: "El pibe te mira con ojos de devoción. Se convirtió en tu mejor socio adentro de la cancha.",
        effects: { liderazgo: 5, idolatria: 6, fama: 3 },
        actions: [{ type: 'followUp', dilemmaId: 'pibe_mentor_regreso', delay: 3, label: 'Ese pibe no se va a olvidar de vos.' }]
      },
      {
        text: "Meterle una murra justa en la siguiente jugada: «Bienvenido a Primera, nene».",
        outcome: "El pibe entendió de golpe cómo se juega por los porotos. Te hiciste respetar por todos los juveniles.",
        effects: { potencia: 3, liderazgo: 2, forma: 1 }
      }
    ]
  },

  // 15. Botines y Tradición
  {
    id: "botines_marca_rival",
    title: "Guerra de Botines",
    category: "negocios",
    text: "Una marca deportiva internacional te ofrece $150.000 al año para que uses sus botines color flúor fosforescente. Los hinchas más veteranos dicen que los cracks juegan con botines negros.",
    options: [
      {
        text: "Firmar el contrato de botines flúor: «La plata no tiene color».",
        outcome: "Tu calzado brilla bajo las luces del estadio. Tu cuenta bancaria festeja cada gambeta.",
        effects: { dinero: 150000, fama: 6, idolatria: -2 }
      },
      {
        text: "Mantener los botines de cuero negro tradicionales: «La elegancia no se negocia».",
        outcome: "Tu estampa clásica enamora a los hinchas de paladar negro. Sos el último romántico del fútbol.",
        effects: { idolatria: 8, pegada: 2, liderazgo: 2 }
      }
    ]
  },

  // 16. Cumpleaños Familiar
  {
    id: "cumple_15_hermana",
    title: "El Cumpleaños de 15",
    category: "familia",
    text: "El cumpleaños de 15 de tu hermana coincide con una concentración para un partido común de liga en el interior. Tu familia te pide que viajes aunque sea a soplar las velitas.",
    options: [
      {
        text: "Escaparte en auto unas horas para estar en el vals familiar.",
        outcome: "Bailaste el vals con tu hermana entre lágrimas. Llegaste con ojeras a la concentración, pero con el alma llena de amor.",
        effects: { forma: -1, resistencia: -1, liderazgo: 2, fama: 2 }
      },
      {
        text: "Quedarte en el hotel concentrado cumpliendo las órdenes del DT.",
        outcome: "Demostraste un profesionalismo de fierro. Tu familia lo entendió y el DT te puso de titular.",
        effects: { forma: 1, resistencia: 2, liderazgo: 3 }
      }
    ]
  },

  // 17. Capricho Táctico
  {
    id: "conflicto_tactico_dt",
    title: "La Pizarra del Entrenador",
    category: "vestuario",
    text: "El entrenador ideó un esquema ultradefensivo y te pide que bajes a marcar hasta el banderín de tu propio córner. «Acá corren todos o no juega nadie».",
    options: [
      {
        text: "Aceptar el rol de sacrificio por el bien táctico del equipo.",
        outcome: "Te mataste corriendo los 90 minutos tapando subidas del lateral rival. No pateaste al arco, pero el DT te aplaudió de pie.",
        effects: { resistencia: 4, liderazgo: 3, definicion: -1 }
      },
      {
        text: "Quedarte suelto arriba buscando el gol: «Yo juego donde lastimo».",
        outcome: "Apareciste fresco y metiste el gol de la victoria en una contra, aunque el DT te fulminó con la mirada en el vestuario.",
        effects: { definicion: 4, forma: 1, liderazgo: -2 }
      }
    ]
  },

  // 18. Redes Sociales
  {
    id: "redes_hinchas_insultos",
    title: "La Furia de las Redes",
    category: "prensa",
    text: "Erraste un gol clave en el último minuto y los comentarios de tus redes sociales se llenaron de críticas feroces y memes crueles.",
    options: [
      {
        text: "Responder con ironía y subir foto con tu auto: «Sigan hablando».",
        outcome: "Se armó un escándalo mediático descomunal. Los programas deportivos debatieron tu soberbia toda la semana.",
        effects: { fama: 8, idolatria: -8, forma: -1 }
      },
      {
        text: "Desinstalar las aplicaciones y entrenar el doble en silencio.",
        outcome: "Canalizaste la bronca en el gimnasio. En el siguiente partido entraste con sangre en los ojos y la rompiste.",
        effects: { definicion: 3, potencia: 3, forma: 2, liderazgo: 3 }
      }
    ]
  },

  // 19. Representante
  {
    id: "cambio_representante",
    title: "El Tiburón de Europa",
    category: "negocios",
    text: "Tu representante actual es el amigo que te llevaba a probarte en colectivo. Aparece un mega-agente de futbolistas de élite que te promete llevarte a Europa en 6 meses si firmas con él.",
    options: [
      {
        text: "Firmar con el mega-empresario europeo: «El tren pasa una sola vez».",
        outcome: "Tu cotización internacional voló y empezaron a llegar ojeadores de la Champions League a verte.",
        effects: { fama: 12, dinero: 100000, idolatria: -3 },
        actions: [{ type: 'flag', key: 'europeanAgent', value: true, label: 'Tu nuevo agente te va a conseguir una oferta de Europa en el próximo mercado.' }]
      },
      {
        text: "Mantenerte con tu amigo de la infancia: «La lealtad vale más que un contrato».",
        outcome: "Tu amigo lloró de emoción. El ambiente del fútbol elogió tus valores de potrero inquebrantables.",
        effects: { idolatria: 10, liderazgo: 4, forma: 1 }
      }
    ]
  },

  // 20. Festejo Alocado
  {
    id: "fiesta_campeon_descontrol",
    title: "El Festejo Descontrolado",
    category: "hinchada",
    text: "Tras conquistar un campeonato, el micro descapotable avanza entre miles de hinchas enloquecidos. Te pasan un bombo y una careta del clásico rival derrotado.",
    options: [
      {
        text: "Subirte al techo con el bombo y cantar con la hinchada a los gritos.",
        outcome: "Las fotos tuyas festejando como un hincha más se hicieron póster en las habitaciones de miles de chicos.",
        effects: { idolatria: 14, fama: 5, dinero: -5000 }
      },
      {
        text: "Festejar con mesura respetando al rival vencido.",
        outcome: "Demostraste clase y estirpe de crack respetado por propios y extraños.",
        effects: { liderazgo: 4, fama: 3, forma: 1 }
      }
    ]
  },

  // 21. Lujo en el Potrero
  {
    id: "pisotear_pelota_cargada",
    title: "La Pisada de la Discordia",
    category: "etica",
    text: "Van ganando 3 a 0 en el minuto 88. Te llega la pelota contra la raya. Podés pararte arriba de la pelota con las dos piernas al estilo potrero puro o jugar a un toque.",
    options: [
      {
        text: "Pararte arriba de la pelota y tirar un sombrero.",
        outcome: "La tribuna enloqueció coreando tu nombre, aunque los defensores rivales casi te parten las dos piernas de una patada.",
        effects: { gambeta: 4, idolatria: 8, forma: 1, resistencia: -2 }
      },
      {
        text: "Tocar simple hacia atrás respetando al rival.",
        outcome: "El capitán rival te estrechó la mano al finalizar. Clase y profesionalismo puro.",
        effects: { liderazgo: 3, pegada: 2, forma: 1 }
      }
    ]
  },

  // 22. Solidaridad Plantel
  {
    id: "huelga_sueldos_plantel",
    title: "Solidaridad con los Pibes",
    category: "vestuario",
    text: "La dirigencia le debe 4 meses de sueldo a los utileros y a los chicos de inferiores. El plantel propone no concentrar antes de un partido televisado. Los dirigentes te piden que no te sumes.",
    options: [
      {
        text: "Encabezar la protesta junto a tus compañeros: «Cobran todos o no juega nadie».",
        outcome: "Los dirigentes te miraron con bronca, pero los trabajadores del club te abrazaron llorando. Sos el líder moral de la institución.",
        effects: { liderazgo: 8, idolatria: 10, dinero: -20000 },
        actions: [{ type: 'flag', key: 'boardAngry', value: true, label: 'La dirigencia te va a ofrecer menos plata en la próxima renovación.' }]
      },
      {
        text: "Concentrar solo para cuidar tu relación con la comisión directiva.",
        outcome: "El presidente te premió con una mejora de contrato, pero el vestuario te dio la espalda.",
        effects: { liderazgo: -6, idolatria: -5 },
        actions: [{ type: 'salaryRaise', pct: 0.12, label: '💰 El presidente te sube el sueldo un 12%.' }]
      }
    ]
  },

  // 23. Inversiones Locas
  {
    id: "inversion_criptos",
    title: "El Lobo del Vestuario",
    category: "negocios",
    text: "Un compañero que se cree gurú financiero te propone meter $50.000 de tus ahorros en un fondo de inversión de criptomonedas y tecnología que promete triplicar en un año.",
    options: [
      {
        text: "Invertir los $50.000 en el fondo riesgoso.",
        outcome: "El mercado acompañó y recuperaste tu inversión con ganancias fabulosas para comprar lujos.",
        effects: {},
        actions: [{ type: 'gamble', chance: 0.55, win: { effects: { dinero: 120000, fama: 3 }, outcome: 'El fondo multiplicó tu plata. Tu compañero gurú ahora te pide consejos a vos.' }, lose: { effects: { dinero: -50000, forma: -1 }, outcome: 'El fondo se desplomó y perdiste los $50.000. Te pasaste la semana mirando gráficos en vez de entrenar.' } }]
      },
      {
        text: "Guardar el dinero en ladrillos seguros: «La plata se gana sudando la camiseta».",
        outcome: "Evitaste el estrés financiero y mantuviste tu cabeza 100% enfocada en los entrenamientos.",
        effects: { forma: 1, resistencia: 1, liderazgo: 2 }
      }
    ]
  },

  // 24. Bandera Popular
  {
    id: "bandera_barra_homenaje",
    title: "El Trapo en la Popular",
    category: "hinchada",
    text: "La hinchada confeccionó una bandera gigante con tu rostro y la frase «EL ÍDOLO DEL PUEBLO». Te invitan a inaugurarla en el quincho del club comiendo choripanes.",
    options: [
      {
        text: "Ir a compartir la noche con los hinchas en el quincho.",
        outcome: "Cantaste con ellos, firmaste camisetas y te convertiste en una leyenda de carne y hueso para la tribuna.",
        effects: { idolatria: 15, fama: 5, forma: 1 }
      },
      {
        text: "Agradecer por video desde tu casa para mantener distancia profesional.",
        outcome: "La bandera flamea igual en la tribuna, pero algunos sintieron que te faltó calor popular.",
        effects: { idolatria: 5, liderazgo: 1 }
      }
    ]
  },

  // 25. La Cinta de Capitán
  {
    id: "la_cinta_de_capitan",
    title: "El Brazalete Sagrado",
    category: "vestuario",
    text: "El entrenador decide sacarle la capitanía al zaguero veterano para dártela a vos frente a todo el grupo: «Este equipo necesita tu fuego sagrado».",
    options: [
      {
        text: "Aceptar la cinta con orgullo: «Asumo la responsabilidad histórica».",
        outcome: "Te calzaste el brazalete y guiaste al equipo al frente con presencia imponente ante los árbitros.",
        effects: { liderazgo: 8, idolatria: 8, pegada: 2 }
      },
      {
        text: "Rechazarla en público y devolvérsela a tu compañero veterano: «El capitán sigue siendo él».",
        outcome: "Un gesto de grandeza moral tan inmenso que conmovió a todo el fútbol nacional. Te ganaste la lealtad eterna del plantel.",
        effects: { liderazgo: 7, idolatria: 12, forma: 2 }
      }
    ]
  },

  // 26. Veteranía & Retiro
  {
    id: "oferta_dt_retiro",
    title: "El Banco de los Suplentes",
    category: "veterania",
    minAge: 32,
    text: "Con más de 32 años en el lomo, el DT te avisa que empezará a rotar el equipo y vas a ir al banco en varios partidos para darle rodaje a los jóvenes.",
    options: [
      {
        text: "Aceptar el rol de recambio de lujo y aportar experiencia en los minutos finales.",
        outcome: "Entraste fresco en los segundos tiempos a definir partidos cerrados con pura jerarquía.",
        effects: { liderazgo: 6, definicion: 3, forma: 1, idolatria: 6 },
        actions: [{ type: 'nextSeason', matchesFactor: 0.8, injuryRisk: -5, label: 'Rotación: jugás menos partidos pero te cuidás (−5% lesión)' }]
      },
      {
        text: "Exigir titularidad absoluta: «Mientras respire, juego los 90 minutos».",
        outcome: "Forzaste la máquina al límite. Tu orgullo conmovió a la gente, aunque tu cuerpo sintió el desgaste físico.",
        effects: { potencia: 3, resistencia: -3, idolatria: 4 },
        actions: [{ type: 'nextSeason', injuryRisk: 5, label: '+5% de riesgo de lesión por exigirte de más' }]
      }
    ]
  },

  // 27. El Clima Hostil
  {
    id: "el_clima_hostil_visitante",
    title: "La Caldera del Diablo",
    category: "hinchada",
    text: "Viajan a jugar de visitante en un estadio infernal. Al entrar a la cancha, 40.000 hinchas rivales te insultan a coro y te tiran monedas.",
    options: [
      {
        text: "Sonreír, aplaudir con ironía y pedirles que canten más fuerte.",
        outcome: "La hostilidad te encendió el fuego sagrado del potrero. Jugaste con rabia ganadora y silenciaste el estadio.",
        effects: { potencia: 4, liderazgo: 4, forma: 1, fama: 5 }
      },
      {
        text: "Mantener la mirada gacha y concentrarte estrictamente en la pelota.",
        outcome: "Demostraste hielo en las venas y no caíste en ninguna provocación del rival.",
        effects: { forma: 2, definicion: 2, pegada: 2 }
      }
    ]
  },

  // 28. Amor Eterno
  {
    id: "declaracion_amor_eterno",
    title: "El Juramento de Amor",
    category: "prensa",
    text: "En una entrevista en vivo por TV tras un clásico soñado, el periodista te pregunta: «¿Le jurás al hincha que jamás vestirías la camiseta del rival de toda la vida?».",
    options: [
      {
        text: "Jurar amor incondicional: «Nunca en mi vida, antes me corto las piernas».",
        outcome: "La hinchada enloqueció. La frase se convirtió en bandera, remeras y tatuajes populares.",
        effects: { idolatria: 20, fama: 8 },
        actions: [{ type: 'flag', key: 'swornLoyalty', value: 'currentClub', label: 'Juraste amor eterno: irte al rival ahora sería imperdonable.' }, { type: 'followUp', dilemmaId: 'juramento_tentacion', delay: 2, label: 'Algún día te van a poner a prueba...' }]
      },
      {
        text: "Ser cauto y diplomático: «Uno es profesional y nunca sabe qué depara el futuro».",
        outcome: "La prensa elogió tu madurez, pero algunos hinchas te tildaron de frío y calculador.",
        effects: { dinero: 20000, idolatria: -6, liderazgo: 1 }
      }
    ]
  },

  // 29. El Gol Fantasma
  {
    id: "el_gol_fantasma",
    title: "La Mano de Dios Moderna",
    category: "etica",
    text: "En un centro cerrado al área, metés un cabezazo que en realidad rozó en tu mano antes de entrar. El árbitro no vio nada y cobra gol. El arquero rival enloquece protestando.",
    options: [
      {
        text: "Festejarlo con el alma corriendo hacia la tribuna: «Si el juez no la vio, es gol».",
        outcome: "Gol convalidado y tres puntos a la bolsa. Los rivales te odian, pero la hinchada festeja la picardía.",
        effects: { definicion: 3, idolatria: 7, fama: 4 }
      },
      {
        text: "Acercarte al árbitro y confesar la mano con hidalguía deportiva.",
        outcome: "El gol fue anulado, pero tu gesto dio la vuelta al planeta como el Fair Play del año.",
        effects: { liderazgo: 6, fama: 10, idolatria: -2, forma: 1 }
      }
    ]
  },

  // 30. El DT Interino
  {
    id: "dt_interino_crisis",
    title: "La Crisis Institucional",
    category: "vestuario",
    minAge: 33,
    text: "El DT renunció en medio de una racha negra de 5 partidos sin ganar. El presidente te llama a solas: «Sos el ídolo del club. Necesito que vos armes el equipo y des la charla técnica».",
    options: [
      {
        text: "Ponerte el buzo de líder: armar la táctica y dar la arenga vos mismo.",
        outcome: "El equipo salió a la cancha transformado por tu arenga emotiva y cortaron la mala racha.",
        effects: { liderazgo: 10, idolatria: 12, forma: 2, pegada: 2 }
      },
      {
        text: "Negarte: «Yo soy jugador, contraten un entrenador profesional rápido».",
        outcome: "Cuidaste tu lugar de futbolista, aunque los dirigentes sintieron que les soltaste la mano en la tormenta.",
        effects: { resistencia: 2, liderazgo: -2, idolatria: 2 }
      }
    ]
  },

  // 31. Selección: Mundial Infiltrado
  {
    id: "seleccion_mundial_infiltrado",
    title: "Llamado a la Selección: ¿Infiltrarse o Bajarse?",
    category: "seleccion",
    text: "Llega la citación para el gran torneo con la Selección Nacional, pero venís arrastrando una molestia muscular importante. El cuerpo médico del club te pide reposo absoluto.",
    options: [
      {
        text: "Infiltrarse con analgésicos: «Por la camiseta de mi país juego en una pierna».",
        outcome: "Fuiste al torneo internacional con el corazón. Te consagraste ante los ojos de millones, aunque tu club se enfureció por el riesgo.",
        effects: { fama: 8, idolatria: 8, dt: -10, resistencia: -3, vestuario: 6 },
        actions: [{ type: 'nextSeason', injuryRisk: 6, label: '+6% de riesgo de lesión por jugar infiltrado' }]
      },
      {
        text: "Bajarse con madurez: «No estoy al 100%, que juegue un compañero sano».",
        outcome: "Tu club agradeció tu compromiso profesional y volviste a tu mejor nivel físico en las canchas.",
        effects: { forma: 1, resistencia: 3, dt: 10, vestuario: -4 }
      }
    ]
  },

  // 32. Selección: Guerra de Dorsales
  {
    id: "seleccion_dorsal_10",
    title: "La Guerra por la Camiseta en la Selección",
    category: "seleccion",
    text: "En la concentración nacional, una figura veterana reclama la camiseta emblemática del equipo que la prensa y los hinchas venían pidiendo para vos.",
    options: [
      {
        text: "Plantarte y pedir la titularidad y la camiseta: «Me la gané jugando al fútbol».",
        outcome: "Tu audacia dividió las aguas en el país. Los jóvenes te aclaman, pero los viejos del vestuario te miran con recelo.",
        effects: { liderazgo: 3, fama: 6, vestuario: -8, pegada: 1 },
        actions: [{ type: 'flag', key: 'nationalShirt10', value: true, label: 'En la próxima convocatoria vas a usar la 10.' }]
      },
      {
        text: "Cederle el número con una sonrisa: «El número no juega, juega el corazón».",
        outcome: "Mostraste una humildad que unió a todo el plantel nacional. El capitán te dio un abrazo frente a las cámaras.",
        effects: { vestuario: 12, dt: 8, liderazgo: 2 }
      }
    ]
  },

  // 33. Táctica del DT
  {
    id: "dt_tactica_jaula",
    title: "El Planteo Táctico: ¿Pico y Pala o Gambeta Libre?",
    category: "vestuario",
    text: "El entrenador prepara un partido cerrado y te ordena retroceder 40 metros para marcar al lateral contrario durante los 90 minutos: «Acá corren todos o vas al banco».",
    options: [
      {
        text: "Acatar la orden militar y tirarse a los pies.",
        outcome: "Terminaste con las piernas acalambradas pero el DT te aplaudió en el vestuario por tu disciplina de equipo.",
        effects: { dt: 15, resistencia: 2, vestuario: 5, forma: -1 }
      },
      {
        text: "Discutir la idea: «Si me ponés a correr marcadores perdés mi magia arriba».",
        outcome: "El técnico te mandó al banco dos partidos por contestador, pero cuando entraste la clavaste en el ángulo y demostraste tu razón.",
        effects: { dt: -18, definicion: 2, pegada: 2, fama: 4 }
      }
    ]
  },

  // 34. Clima de Vestuario
  {
    id: "vestuario_pelea_referentes",
    title: "Trompadas en el Entretiempo",
    category: "vestuario",
    text: "El equipo se fue al descanso perdiendo el clásico. En el túnel dos compañeros pesados se tiraron un cabezazo culpándose de la marca en el tiro libre.",
    options: [
      {
        text: "Separar de guapo y dar una arenga a los gritos para despertar al grupo.",
        outcome: "Te plantaste con personalidad de líder. El vestuario recuperó la cordura y salieron a empatarlo.",
        effects: { liderazgo: 4, vestuario: 14, dt: 8 }
      },
      {
        text: "Hacerse el desentendido tomando mate: «Es calentura de partido, ya se pasa».",
        outcome: "Nadie calmó las aguas y el segundo tiempo fue un desastre de desconcentración.",
        effects: { vestuario: -10, forma: -1 }
      }
    ]
  },

  // 35. Vacaciones y Energía
  {
    id: "recuperacion_playa_vs_gym",
    title: "El Receso: ¿Desconexión Total o Gimnasio Silencioso?",
    category: "entrenamiento",
    text: "Termina un semestre agotador con 45 partidos disputados. Tenés 20 días libres antes de empezar la pretemporada y tus amigos te invitan a una playa del caribe.",
    options: [
      {
        text: "Viajar a la playa, comer asado y apagar el teléfono durante dos semanas.",
        outcome: "Recargaste energías mentales y felicidad al 100%, aunque te costó una semana recuperar el aire en las pasadas.",
        effects: { forma: -1, resistencia: -1, energia: 30, fama: 3 }
      },
      {
        text: "Entrenar con preparador personal en doble turno durante el receso.",
        outcome: "Llegaste a la pretemporada hecho una fiera física. Volás en la cancha desde el día uno.",
        effects: { resistencia: 3, potencia: 2, energia: -10, dt: 8 }
      }
    ]
  },

  // 36. Respaldo al DT
  {
    id: "dt_crisis_respaldo",
    title: "Crisis de Resultados: ¿Salvar al Técnico o Dejarlo Caer?",
    category: "vestuario",
    text: "El equipo lleva cinco partidos sin ganar y la tribuna pide la cabeza del entrenador. La dirigencia te consulta en privado sobre el clima del vestuario.",
    options: [
      {
        text: "Poner el pecho por el DT: «El plantel está a muerte con este proyecto».",
        outcome: "El entrenador recuperó respaldo gracias a tu testimonio y te agradeció con una confianza inquebrantable.",
        effects: { dt: 22, vestuario: 8, idolatria: 4 }
      },
      {
        text: "Decir la verdad: «El mensaje ya no llega y hace falta un cambio de aire».",
        outcome: "A los dos días renunció el técnico. El vestuario quedó con cierta tensión pero llegó un nuevo DT con ganas.",
        effects: { vestuario: -6, dinero: 10000 },
        actions: [{ type: 'resetManager', value: 60, label: 'Llega un DT nuevo: la relación arranca de cero (60)' }]
      }
    ]
  },

  // ---------------- Follow-up dilemmas (only appear as a consequence) ----------------
  {
    id: "apuestas_investigacion",
    followUpOnly: true,
    title: "La Fiscalía Deportiva Toca la Puerta",
    category: "etica",
    text: "Apareció un video de la patada que te hiciste sacar por el apostador. La fiscalía deportiva abrió una investigación y los periodistas te esperan en la puerta de tu casa.",
    options: [
      {
        text: "Confesar todo y colaborar con la investigación.",
        outcome: "Te sancionaron, pero tu sinceridad te dio una segunda oportunidad. La gente valora que des la cara.",
        effects: { idolatria: -6, fama: -4, liderazgo: 2 },
        actions: [{ type: 'nextSeason', suspension: 6, label: '6 fechas de suspensión' }]
      },
      {
        text: "Negar todo: «Fue una jugada de fútbol, nada más».",
        outcome: "Te la jugaste a que no hubiera pruebas.",
        effects: {},
        actions: [{
          type: 'gamble', chance: 0.5,
          win: { effects: { fama: 2 }, outcome: "El caso se archivó por falta de pruebas. Zafaste, pero sabés lo que hiciste." },
          lose: { effects: { idolatria: -20, fama: -10, dt: -15 }, outcome: "Apareció un audio tuyo con el apostador. Escándalo nacional y una sanción durísima." }
        }]
      }
    ]
  },
  {
    id: "pibe_mentor_regreso",
    followUpOnly: true,
    title: "El Pibe que Ayudaste",
    category: "vestuario",
    text: "Aquel pibe de reserva al que le regalaste botines hoy es figura y lo vende el club a Europa. En la conferencia de despedida dice: «Todo se lo debo a él», y te señala.",
    options: [
      {
        text: "Subir al escenario y abrazarlo frente a todos.",
        outcome: "La foto del abrazo dio la vuelta al país. La hinchada te ve como el padre futbolístico del club.",
        effects: { idolatria: 8, fama: 5, vestuario: 6 }
      },
      {
        text: "Mandarle un mensaje en privado: «El mérito es tuyo, campeón».",
        outcome: "El pibe lo contó igual en una entrevista. Tu humildad agrandó tu leyenda en el vestuario.",
        effects: { liderazgo: 4, vestuario: 10, idolatria: 4 }
      }
    ]
  },
  {
    id: "juramento_tentacion",
    followUpOnly: true,
    requires: "swornLoyalty",
    title: "La Prueba del Juramento",
    category: "negocios",
    text: "Años después de jurar amor eterno en televisión, el presidente del clásico rival te cita en secreto en un hotel: «Ponés la cifra que quieras».",
    options: [
      {
        text: "Levantarte de la mesa y contarlo públicamente.",
        outcome: "Contaste todo en una radio. La hinchada te ve como el último hombre leal del fútbol.",
        effects: { idolatria: 10, fama: 4 }
      },
      {
        text: "Usar la oferta para pedirle un aumento a tu club.",
        outcome: "Tu club te subió el sueldo, pero la reunión se filtró y muchos hinchas empezaron a dudar de tu juramento.",
        effects: { idolatria: -8 },
        actions: [{ type: 'salaryRaise', pct: 0.2, label: '💰 Tu club te sube el sueldo un 20% para retenerte.' }]
      }
    ]
  },
  {
    id: "clasico_previa_reincidencia",
    followUpOnly: true,
    title: "El DT No Se Olvida",
    category: "vida_nocturna",
    text: "Se acerca otro clásico y el DT junta al plantel: «El año pasado alguno salió de joda la noche anterior. Esta vez quiero ver quién está comprometido». Todos te miran.",
    options: [
      {
        text: "Pedir disculpas delante del plantel y concentrar dos días antes.",
        outcome: "El DT valoró el gesto. Cerraste la herida y volviste a ser titular indiscutido.",
        effects: { dt: 12, vestuario: 4, forma: 1 }
      },
      {
        text: "Redoblar la apuesta: «Lo que hago fuera de la cancha es asunto mío».",
        outcome: "El DT te mandó al banco para el clásico y el vínculo quedó roto.",
        effects: { dt: -15, fama: 3 },
        actions: [{ type: 'nextSeason', matchesFactor: 0.85, label: 'El DT te rota más: jugás menos partidos' }]
      }
    ]
  }
];

// Helper to draw a dilemma without repeating recently seen ones
export function getRandomDilemma(player = null, seenIds = []) {
  // 1. A follow-up that is due this off-season always comes first
  if (player?.scheduledDilemmas?.length) {
    const due = player.scheduledDilemmas
      .filter(sd => sd.dueSeason <= (player.seasonsPlayed || 0))
      .map(sd => DILEMMAS.find(d => d.id === sd.id))
      .find(d => d && (!d.requires || isRequirementMet(player, d.requires)));
    if (due) return due;
  }

  let pool = DILEMMAS.filter(d => !d.followUpOnly && !seenIds.includes(d.id));

  if (player) {
    const positionMatches = pool.filter(d => !d.position || d.position === player.position);
    if (positionMatches.length > 0) pool = positionMatches;

    const ageMatches = pool.filter(d => {
      if (d.minAge && player.age < d.minAge) return false;
      if (d.maxAge && player.age > d.maxAge) return false;
      return true;
    });
    if (ageMatches.length > 0) pool = ageMatches;
  }

  // If every dilemma was already seen, start over (follow-ups excluded)
  if (pool.length === 0) pool = DILEMMAS.filter(d => !d.followUpOnly);

  return pool[Math.floor(Math.random() * pool.length)];
}

function isRequirementMet(player, requirement) {
  if (requirement === 'swornLoyalty') return player.flags?.swornLoyalty === player.currentClub?.id;
  return Boolean(player.flags?.[requirement]);
}
