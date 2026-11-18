# ⚽ El Ídolo — Simulador de carrera futbolística

Simulador roguelike de carrera: arrancás a los 16 en un club chico y peleás por llegar a Primera, a Europa, a la Selección… y a tu estatua.

### Novedades de esta versión
- Finales al **mejor de 3 jugadas** con marcador, en vez de un único tiro.
- Minijuegos rehechos: el arquero ahora *ve venir* la pelota, el trile anima la mezcla de vasos de verdad, el tiro libre usa la comba elegida.
- **Progresión por edad** (crecés de pibe, declinás de veterano) y **sueldos reales** según el contrato firmado.
- El receso (dilema → mercado de pases → pretemporada) se guarda: si recargás la página no se pierde nada.
- Estatua: requiere 95 de idolatría **y** 5 temporadas en el club.
- Retiro voluntario desde los 32, premios en monedas por entrenar, interfaz adaptada a celular.

---

## 🌟 Características Principales

### 1. Creación de Futbolista (Setup)
- **Puestos de juego**:
  - **9 - Delantero**: Enfocado en Definición, Potencia, Gambeta y Resistencia. Pelea por el Botín de Oro.
  - **10 - Enganche**: Asistencias, visión periférica y tiro libre con Pegada y Liderazgo.
  - **1 - Arquero**: Carrera alternativa enfocada en vallas invictas, atajadas salvadoras y reflejos.
- **Clases de Jugador**:
  - **Habilidoso**: Define las finales con minijuegos de puntería y tiempo de reacción.
  - **Cabulero**: Resuelve las finales mediante azar, corazonadas y el trile.
  - **Mixto**: Estilo balanceado.
- **Arquetipos**:
  - **De las Inferiores (Normal)**: Arranca a los 16 años con estadísticas base de potrero.
  - **Pibe Maravilla (Wonderkid)**: Talento generacional con +8 en atributos y fama temprana.
- **Ligas de Debut**:
  - Ascenso Argentino (Primera Nacional: Chacarita, Ferro, Quilmes, All Boys, Atlanta, Colón, etc.).
  - Liga Profesional Argentina (Boca, River, Racing, Independiente, San Lorenzo, Vélez, etc.).
  - Campeonato Uruguayo (Peñarol, Nacional, Defensor Sporting, etc.).
- **Modos de Juego**:
  - **Carrera Completa**: 16 a 38 años.
  - **Modo Ultra**: Partidas exprés de 2 temporadas.
  - **Modo Sin Reglas**: Sandbox con stats al 99 y presupuesto libre.

### 2. Pretemporada y Cartas de Entrenamiento
- Antes de cada torneo se sortean 3 cartas de entrenamiento:
  - **Común** (Verde)
  - **Rara** (Azul)
  - **Dorada** (Oro)
  - **Icónica** (Púrpura)
- Opciones de cambio de cartas (*Reroll*).

### 3. Simulación de Temporada y Partidos
- Cálculo de partidos, goles, asistencias y vallas invictas según rendimiento, nivel del club y forma.
- Posibilidad de clasificar y disputar la **Gran Final por el Título** (Torneo Local, Copa Argentina, Copa Libertadores o UEFA Champions League).

### 4. Minijuegos Interactivos para las Finales
- **Tiros de Penal / Definición al Arco**: Medidor de precisión y timing oscilante con dirección del remate.
- **El Trile / La Cábala**: Minijuego de seguimiento visual donde la copa se esconde y mezcla a gran velocidad.
- **Atajada del 1**: Minijuego de arquero con reacción en milisegundos hacia los cuatro ángulos.

### 5. Dilemas Narrativos de Carrera
- Decisiones con consecuencias directas: salidas nocturnas antes del clásico, infiltración con lesiones, conferencias de prensa polémicas, peleas de vestuario y convocatorias a la Selección.

### 6. Mercado de Pases y Alerta de Clásico Rival
- Ofertas de renovación o transferencias al salto europeo (Real Madrid, Man City, Bayern, PSG, etc.).
- **Alerta de Traición**: Firmar con el clásico rival (ej. Boca a River, Peñarol a Nacional) reduce la idolatría a 0 y declara al jugador traidor ante su ex-afición.

### 7. Escala de Idolatría & La Estatua de Bronce 🗽
- Progreso de relación con la hinchada:
  1. *Uno más* (0-20)
  2. *Querido* (21-45)
  3. *Referente* (46-70)
  4. *Ídolo* (71-94)
  5. **Leyenda (95-100)** ➔ **¡Estatua de bronce erigida en la puerta del estadio!**

### 8. Vitrina de Trofeos, Palmarés y Tienda de Vida
- Historial completo de clubes, títulos ganados, Botines de Oro y Balones de Oro.
- Tienda de estilo de vida con compras de Mansión, Yate, Jet Privado, Fisioterapeuta y Fundación con bonificaciones pasivas.

### 9. Motor de Audio Sintetizado (Web Audio API)
- Silbato del árbitro, patada del balón, ovación de gol, jingle de trofeos y efectos arcade 100% integrados sin descargas externas.

---

## 🚀 Cómo Ejecutar el Proyecto

```bash
# 1. Entrar a la carpeta del proyecto
cd el-idolo

# 2. Instalar dependencias (si aún no se instalaron)
npm install

# 3. Iniciar el servidor local de desarrollo
npm run dev
```

Abre en tu navegador la dirección mostrada en pantalla (generalmente `http://localhost:5173/`).

### 📦 Compilación para Producción

```bash
npm run build
```
Generará los archivos listos para desplegar en la carpeta `dist/`.
