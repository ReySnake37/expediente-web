"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, FileText, Shield, ArrowLeft, ImageIcon, CheckCircle2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type LoginView = "login" | "register" | "forgot";
type CodeStatus = "idle" | "error" | "success";

type WordleState = {
  guesses: string[];
  currentInput: string;
  won: boolean;
  lost: boolean;
};

type LetterStatus = "pending" | "correct" | "incorrect";

type Day3RoundData = {
  images: [string, string, string, string];
  word: string;
};

type Day3ChatMsg = {
  id: number;
  user: string;
  text: string;
  correct: boolean;
};

type Day3State = {
  currentRound: number;
  streamerScore: number;
  chatScore: number;
  roundActive: boolean;
  roundWinner: "streamer" | "chat" | null;
  gameFinished: boolean;
};

type PasapalabraState = {
  letterStates: LetterStatus[];
  currentIdx: number;
  currentInput: string;
  finished: boolean;
};

type BoomPhase = "waiting" | "playing" | "roundOver" | "finished";
type BoomPlayer = { name: string; eliminated: boolean; score: number };
type BoomQuestion = { text: string; answer: string };

// ─────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────

const MAX_WORDLE_GUESSES = 5;

const cases = [
  { id: 1, title: "01: El Comienzo", code: "INICIO" },
  { id: 2, title: "02: Vida", code: "SER BUENOS Y SI SON MALOS VIENEN AL CHAT O AL DISCORD Y ME LO CUENTAN" },
  { id: 3, title: "03: Detalle", code: "RASTRO" },
  { id: 4, title: "04: La Trampa", code: "BIENVENIDOS A ESTA SANTA CASA" },
  { id: 5, title: "05: Los Imitadores", code: "ORIGINAL" },
  { id: 6, title: "06: La Verdad", code: "LIMA" },
  { id: 7, title: "07: El Veredicto", code: "FINIS" },
];

const case2Words = [
  { label: "EVIDENCIA 1", word: "ACEITUNAS", fragment: "I", rotate: "-rotate-2", clue: "Hemos encontrado un alimento que el sospechoso ama comer" },
  { label: "EVIDENCIA 2", word: "VENTILADOR", fragment: "N", rotate: "rotate-1", clue: "El sospechoso olvida sus rutinas y antes de su aparición en público debería tenerlo encendido" },
  { label: "EVIDENCIA 3", word: "CAMPANADAS", fragment: "I", rotate: "rotate-2", clue: "El sospechoso se reune con su comunidad siempre en esta fecha para celebrar" },
  { label: "EVIDENCIA 4", word: "MARIACHIS", fragment: "C", rotate: "-rotate-1", clue: "En una ocasión lo visitaron en su casa" },
  { label: "EVIDENCIA 5", word: "AURONPLAY", fragment: "I", rotate: "rotate-1.5", clue: "En reiteradas ocasiones se ha visto al sospechoso compartiendo con este personaje" },
  { label: "EVIDENCIA 6", word: "TURRENTS", fragment: "O", rotate: "-rotate-1", clue: "Es una de las maneras de identificar al sospechoso" },
];

const PASAPALABRA_SENTENCE = "SER BUENOS Y SI SON MALOS VIENEN AL CHAT O AL DISCORD Y ME LO CUENTAN";

const pasapalabraClues = [
  { letter: "A", clue: "Inicia: En este lugar el sospechoso asesino una cucaracha.", answer: "Andorra" },
  { letter: "B", clue: "Inicia: Excusandose en un videojuego el sospechoso fue visto en esta ciudad.", answer: "Berlín" },
  { letter: "C", clue: "Inicia: Basado en investigaciones creemos que es el postre favorito del sospechoso.", answer: "Cheesecake" },
  { letter: "D", clue: "Inicia: El sospechoso y sus aliados no permiten que la comunidad solicite esto en sus directos.", answer: "Donación" },
  { letter: "E", clue: "Inicia: Manera agresiva que emplea el sospechoso para decirle a alguien que 'reaccione'.", answer: "Espabila" },
  { letter: "F", clue: "Inicia: El sospechoso a comentado mas de una vez que le encantan.", answer: "Fotografias" },
  { letter: "G", clue: "Contiene la G: Es la bebida mas recurrente del sospechoso.", answer: "Agua" },
  { letter: "H", clue: "Inicia: El sospechoso tiene un gran interés en estos animales.", answer: "Halcones" },
  { letter: "I", clue: "Inicia: Las interacciones con este personaje lo hicieron replantear el tener hijos.", answer: "Imantado" },
  { letter: "J", clue: "Inicia: Cada momento en el que el sospechoso se siente cansado habla de esto.", answer: "Jubilación" },
  { letter: "K", clue: "Contiene la K: El sospechoso fue visto trabajando con esta marca.", answer: "Phoskitos" },
  { letter: "L", clue: "Inicia: El sospechoso tiene algunas cajas pendientes de este elemento.", answer: "Lego" },
  { letter: "M", clue: "Inicia: El equipo que apoya al sospechoso.", answer: "Mods" },
  { letter: "N", clue: "Inicia: El sospechoso a demostrado gran amor por esta fecha.", answer: "Navidad" },
  { letter: "Ñ", clue: "Contiene la Ñ: Nacionalidad del sospechoso.", answer: "Español" },
  { letter: "O", clue: "Inicia: En ocasiones cuando se dirijen al sujeto con terminos Otakus el responde de esta manera.", answer: "onii chan" },
  { letter: "P", clue: "Inicia: El sujeto siempre se queja de dolor en esta zona.", answer: "Pies" },
  { letter: "Q", clue: "Inicia: Cuando te piden un pedacito es de", answer: "Queso" },
  { letter: "R", clue: "Inicia: El sospechoso tiene tendencia a convertir este genero musical en poesia.", answer: "Reggaeton" },
  { letter: "S", clue: "Inicia: En este país el sospechoso fue testigo de un accidente.", answer: "Senegal" },
  { letter: "T", clue: "Inicia: El sospechoso abiertamente a declarado su odio a esta persona.", answer: "Tebas" },
  { letter: "U", clue: "Inicia: En este lugar el sospechoso habito una evento llamado 'Exodo'.", answer: "Universo" },
  { letter: "V", clue: "Contiene la V: El sospechoso fue visto trabajando mayormente en este medio.", answer: "Television" },
  { letter: "W", clue: "Inicia: En epocas antiguas el sospechoso usaba este dispositivo para escuchar música.", answer: "Walkman" },
  { letter: "X", clue: "Contiene la X: En esta seríe el sospechoso fue visto trabajando como psicologo.", answer: "Extremo" },
  { letter: "Y", clue: "Contiene la Y: El sospechoso fue visto explorando cuevas con esta persona.", answer: "Mayichi" },
  { letter: "Z", clue: "Contiene la Z: En esta ciudad el sospechoso fue visto trabajando con la doble V.", answer: "Zaragoza" }
];

const evidencePapers = [
  {
    id: 1, title: "EVIDENCIA 1", rotate: "-rotate-2",
    text: "Fotografía tomada en la escena. Los detalles capturados pueden ser cruciales para resolver el caso.",
    image: "evidencia1.jpg"
  },
  {
    id: 2, title: "EVIDENCIA 2", rotate: "rotate-1",
    text: "Documento hallado entre los archivos. Contiene información relevante aún pendiente de descifrar.",
    image: "evidencia2.jpg"
  },
  {
    id: 3, title: "EVIDENCIA 3", rotate: "rotate-2",
    text: "Registro visual del incidente. Se recomienda analizar con detenimiento cada elemento capturado.",
    image: "evidencia3.jpg"
  },
  {
    id: 4, title: "EVIDENCIA 4", rotate: "-rotate-1",
    text: "Material recopilado por el equipo de campo. Pendiente de verificación y cotejo con otros indicios.",
    image: "evidencia4.jpg"
  },
];

const TWITCH_CHANNEL = "polispol1";

const day3Rounds: Day3RoundData[] = [
  { images: ["day3/r01_1.jpg", "day3/r01_2.jpg", "day3/r01_3.jpg", "day3/r01_4.jpg"], word: "Polispol" },
  { images: ["day3/r02_1.jpg", "day3/r02_2.jpg", "day3/r02_3.jpg", "day3/r02_4.jpg"], word: "Peluca" },
  { images: ["day3/r03_1.jpg", "day3/r03_2.jpg", "day3/r03_3.jpg", "day3/r03_4.jpg"], word: "Puerta a puerta" },
  { images: ["day3/r04_1.jpg", "day3/r04_2.jpg", "day3/r04_3.jpg", "day3/r04_4.jpg"], word: "Paco" },
  { images: ["day3/r05_1.jpg", "day3/r05_2.jpg", "day3/r05_3.jpg", "day3/r05_4.jpg"], word: "Padre" },
  { images: ["day3/r06_1.jpg", "day3/r06_2.jpg", "day3/r06_3.jpg", "day3/r06_4.jpg"], word: "Crepusculon" },
  { images: ["day3/r07_1.jpg", "day3/r07_2.jpg", "day3/r07_3.jpg", "day3/r07_4.jpg"], word: "Carton Pol" },
  { images: ["day3/r08_1.jpg", "day3/r08_2.jpg", "day3/r08_3.jpg", "day3/r08_4.jpg"], word: "Rodando" },
  { images: ["day3/r09_1.jpg", "day3/r09_2.jpg", "day3/r09_3.jpg", "day3/r09_4.jpg"], word: "Publicidad" },
  { images: ["day3/r10_1.jpg", "day3/r10_2.jpg", "day3/r10_3.jpg", "day3/r10_4.jpg"], word: "Stream" },
];

const MAX_BOOM_PLAYERS = 3;
const TOTAL_ROUNDS = 3;
const BOOM_CIRCLE_SIZE = 340;
const BOOM_CIRCLE_CENTER = BOOM_CIRCLE_SIZE / 2;
const BOOM_CIRCLE_RADIUS = 140;

const BOOM_QUESTIONS: BoomQuestion[] = [
  { text: "¿A qué huele Pol?", answer: "PALOMITAS" },
  { text: "¿A dónde fue Pol en su #AD de un coche?", answer: "CANFRANC" },
  { text: "¿Qué le robó Noni a Pol?", answer: "SETUP" },
  { text: "¿Qué juego le piden a Pol reiteradamente?", answer: "AMONGUS" },
  { text: "¿Con qué juego funaron a Pol?", answer: "FIFA" },
  { text: "¿Qué hizo llorar a Pol en Tortilla 2?", answer: "FANTASMAS" },
  { text: "¿Qué canción cantó Pol en Bellum?", answer: "PEACHES" },
  { text: "¿Qué IRL hace Pol cada año?", answer: "ESTRELLAS" },
  { text: "¿A qué evento de gala llevó Pol a Axozer?", answer: "GOYA" },
  { text: "¿Qué regalo de Pol reventó en directo Auron?", answer: "BERENJENA" },
  { text: "¿Quién es la superamiga de Pol?", answer: "LA POBLET" },
  { text: "¿Por qué película se pintó las uñas Pol?", answer: "WICKED" },
  { text: "¿Cuál es el nombre de la cantante que Pol escucha cada año en diciembre?", answer: "MARIAH" },
  { text: "¿Cuál es el nombre del cuervo favorito de Pol?", answer: "FOCUS" },
  { text: "¿Qué tiene Pol pegado en el techo del setup?", answer: "MANOS LOCAS" },
  { text: "¿Qué animal es Trufa?", answer: "GATO" },
  { text: "¿Cuál fue la primera receta con VdeBikingo?", answer: "ESPAGUETIS" },
  { text: "¿Qué se pone Pol por puntos del canal?", answer: "PELUCA" },
  { text: "¿Cuál es el grito cuando alguien se suscribe?", answer: "COWABUNGA" },
  { text: "¿Cómo empieza la canción de inicio del stream?", answer: "TIME" },
  { text: "¿Cómo acaba la canción de inicio del stream?", answer: "ENDS" },
  { text: "¿Qué imagen aparece al final de todos los streams?", answer: "DVD" },
  { text: "¿Cuál es el streamer con el que ha hecho más tik toks?", answer: "NONI" },
  { text: "¿Cuál es el género de cine favorito de Pol?", answer: "MUSICALES" },
  { text: "¿Cuál es el sitio más raro en el que Pol ha montado un PC?", answer: "NORIA" },
  { text: "¿A quién no ha conseguido grabar un videoclip a pesar de insistirle?", answer: "JOKKI" },
  { text: "¿Qué lee Pol en sus reels en blanco y negro?", answer: "POESÍA" },
  { text: "¿De qué fruta era el jugo más asqueroso que probó Pol?", answer: "NONI" },
  { text: "¿En qué evento grabó un reel en el baño con Roier?", answer: "LA VELADA" },
  { text: "¿Nombre del creador de contenido con el que comparan a Pol?", answer: "PACO" },
  { text: "¿Banda musical favorita de Pol?", answer: "ABBA" },
  { text: "¿Juego favorito de Pol?", answer: "GEOGUESSR" },
  { text: "¿Rango que adquirió Pol en Twitch?", answer: "EMBARAZADOR" },
  { text: "¿Pol es director de?", answer: "FOTOGRAFÍA" },
  { text: "¿Pol vive en?", answer: "BARCELONA" },
  { text: "¿Marca favorita de cámaras de Pol?", answer: "SONY" },
  { text: "¿Lugar favorito de Barcelona de Pol?", answer: "LA SAGRADA FAMILIA" },
  { text: "¿Lengua que habla Pol además del Español?", answer: "CATALAN" },
  { text: "¿Que artista le escribio una canción a Pol?", answer: "PEP SALA" },
  { text: "¿Nombre del canción que Pep Sala le escribio a Pol?", answer: "NÚVOLS DE COLOR" },
  { text: "¿Con que pelicula nominaron a Pol a \"mejor dirección de fotografía en los premios Gaudí\"?", answer: "XTREMS" },
  { text: "¿Moderadora Chilena del canal de Polispol?", answer: "SUUGGIE" },
  { text: "¿Genia creativa detras de los emotes y badges de Polispol?", answer: "CABRUU" },
  { text: "¿Nombre del bloc de Pol donde nos habla de Fotografía?", answer: "DIRECTORDEFOTOGRAFIA" },
  { text: "¿Nombre del cine favorito de Pol?", answer: "PHENOMENA" },
  { text: "¿Pelicula en la que Pol participo como Director de Fotografía rodada en Madrid?", answer: "VENUS" },
  { text: "¿Como se le llama a la comunidad que creo Polispol?", answer: "POLICARPIERS" },
  { text: "¿Pol conocio a Jon M. Chu, director de?", answer: "WICKED" },
  { text: "¿Que personaje de Toy Story fue secuestrado por Pol?", answer: "WOODY" },
  { text: "¿Moderador que se caso con una seguidora del canal?", answer: "DOOPA" },
  { text: "¿Miembro de la comunidad que destaca por tener GIF de cualquier tema del canal?", answer: "MONIRAPIDA" },
  { text: "¿Moderador que le gana a Pol en Tetris?", answer: "DAHER" },
  { text: "¿Moderadora Colombiana Fan de BTS?", answer: "STEPHY" },
  { text: "¿El video clip llamado \"Una vida por delante\" dirigido por Pol es de?", answer: "NACH" },
  { text: "¿Red social que premio a Polispol?", answer: "TIKTOK" },
  { text: "¿Pol coordino y superviso la transición de 4:3 a 16:9 para Aragón TV y ...?", answer: "TV3" },
  { text: "¿Colega Masón de Pol CEO de Twtich?", answer: "DAN CLANCY" },
  { text: "¿Amiga de Pol que vive en el campo?", answer: "POBLET" },
  { text: "¿Marca del coche de Pol?", answer: "TOYOTA" },
  { text: "¿Fornite llevo a Pol a un evento en los?", answer: "ANGELES" },
  { text: "¿Animal al que la comunidad le hacia seguimiento a sus crias?", answer: "HALCON" },
  { text: "¿Que elemento del Setup Pol quiere cambiar hace meses y no lo hace?", answer: "SILLA" },
  { text: "¿Seríe en la que Pol nos prometio un barco de cine y no lo hizo?", answer: "PELAGO" },
  { text: "¿Como se refiere Pol a los viewers?", answer: "CHAT/CERDOS V:" },
  { text: "¿País de latinoamerica en el que vivio Pol?", answer: "ARGENTINA" },
  { text: "¿Director de las peliculas de Batman favoritas donde aparece el Jokker favorito de Pol?", answer: "TIM BURTON" },
  { text: "¿Pais en el que Pol encontro un accidente en GeoGuessr?", answer: "SENEGAL" },
];

const slideVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function normalizeAnswer(str: string): string {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
}

// Deterministic shuffle using the sentence as a seed, so blank positions are
// always the same run-to-run but look random (not front-to-back).
function seededShuffle(arr: number[], seed: string): number[] {
  const result = [...arr];
  let s = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Pre-computed order in which non-space character positions get blanked.
const PASAPALABRA_BLANK_ORDER = seededShuffle(
  Array.from(
    { length: PASAPALABRA_SENTENCE.split("").filter(c => c !== " ").length },
    (_, i) => i
  ),
  PASAPALABRA_SENTENCE
);

function getNextPendingIdx(states: LetterStatus[], from: number): number {
  for (let offset = 1; offset <= states.length; offset++) {
    const idx = (from + offset) % states.length;
    if (states[idx] === "pending") return idx;
  }
  return -1;
}

function getLetterStates(guess: string, target: string): ("correct" | "present" | "absent")[] {
  const result: ("correct" | "present" | "absent")[] = Array(guess.length).fill("absent");
  const targetUsed = Array(target.length).fill(false);

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) { result[i] = "correct"; targetUsed[i] = true; }
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < target.length; j++) {
      if (!targetUsed[j] && guess[i] === target[j]) { result[i] = "present"; targetUsed[j] = true; break; }
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────
// PasapalabraGame component
// ─────────────────────────────────────────────────────────────────

const CIRCLE_SIZE = 280;
const CIRCLE_CENTER = CIRCLE_SIZE / 2;
const CIRCLE_RADIUS = 112;
const LETTER_BOX = 26;

function PasapalabraGame({
  state, onInput, onAnswer, onPass, onFinish,
}: {
  state: PasapalabraState;
  onInput: (v: string) => void;
  onAnswer: () => void;
  onPass: () => void;
  onFinish: () => void;
}) {
  const currentClue = !state.finished && state.currentIdx >= 0 ? pasapalabraClues[state.currentIdx] : null;
  const correctCount = state.letterStates.filter(s => s === "correct").length;
  const incorrectCount = state.letterStates.filter(s => s === "incorrect").length;
  const pendingCount = state.letterStates.filter(s => s === "pending").length;

  return (
    <div className="bg-[#f4f1ea] border border-neutral-300 shadow-lg p-4 flex flex-col gap-4">
      <div className="border-b border-neutral-400 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-600" />
          <span className="text-xs font-bold text-neutral-800 tracking-widest">PASAPALABRAS — ABECEDARIO</span>
        </div>
        {!state.finished && (
          <span className="text-xs text-neutral-600 tracking-widest">{pendingCount} pendientes</span>
        )}
      </div>

      {/* Circle */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
          {pasapalabraClues.map((clue, i) => {
            const angle = -Math.PI / 2 + (i / pasapalabraClues.length) * 2 * Math.PI;
            const x = CIRCLE_CENTER + CIRCLE_RADIUS * Math.cos(angle) - LETTER_BOX / 2;
            const y = CIRCLE_CENTER + CIRCLE_RADIUS * Math.sin(angle) - LETTER_BOX / 2;
            const status = state.letterStates[i];
            const isCurrent = i === state.currentIdx && !state.finished;

            return (
              <div
                key={clue.letter}
                style={{ left: x, top: y, width: LETTER_BOX, height: LETTER_BOX, position: "absolute" }}
                className={`flex items-center justify-center text-[10px] font-bold rounded-full border-2 select-none transition-colors
                  ${isCurrent
                    ? "bg-amber-400 border-amber-500 text-neutral-900"
                    : status === "correct"
                      ? "bg-green-600 border-green-600 text-white"
                      : status === "incorrect"
                        ? "bg-red-600 border-red-600 text-white"
                        : "bg-neutral-700 border-neutral-600 text-neutral-300"}`}
              >
                {clue.letter}
              </div>
            );
          })}

          {/* Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {state.finished ? (
              <>
                <p className="text-3xl font-bold text-neutral-800">
                  {correctCount}<span className="text-lg text-neutral-500">/27</span>
                </p>
                <p className="text-[10px] tracking-widest text-neutral-600 mt-1">CORRECTAS</p>
              </>
            ) : (
              <p className="text-5xl font-bold text-amber-500 leading-none">{currentClue?.letter}</p>
            )}
          </div>
        </div>
      </div>

      {/* Clue + input */}
      {!state.finished && currentClue && (
        <div className="flex flex-col gap-3">
          <div className="bg-neutral-100 border border-neutral-300 p-3">
            <p className="text-[10px] text-neutral-500 tracking-widest mb-1">PISTA — {currentClue.letter}</p>
            <p className="text-sm text-neutral-800 leading-relaxed">{currentClue.clue}</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); onAnswer(); }} className="flex gap-2">
            <input
              type="text"
              value={state.currentInput}
              onChange={e => onInput(e.target.value.toUpperCase())}
              className="flex-1 min-w-0 bg-white border border-neutral-400 text-neutral-800 px-2 py-1.5 text-xs tracking-[0.15em] uppercase focus:outline-none focus:border-neutral-600"
              placeholder="Tu respuesta"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!state.currentInput.trim()}
              className="bg-neutral-800 text-white px-3 py-1.5 text-xs tracking-widest hover:bg-neutral-700 transition-colors disabled:opacity-40 shrink-0"
            >
              OK
            </button>
            <button
              type="button"
              onClick={onPass}
              className="bg-neutral-300 text-neutral-800 px-3 py-1.5 text-xs tracking-widest hover:bg-neutral-200 transition-colors shrink-0"
            >
              PASAR
            </button>
          </form>
        </div>
      )}

      {state.finished ? (
        <p className="text-center text-xs text-neutral-600 tracking-[0.1em] py-1">
          {incorrectCount === 0
            ? "¡Pasapalabras completado! Frase revelada íntegramente."
            : `${incorrectCount} error${incorrectCount !== 1 ? "es" : ""}. ${incorrectCount} letra${incorrectCount !== 1 ? "s" : ""} de la frase ocultada${incorrectCount !== 1 ? "s" : ""}.`}
        </p>
      ) : (
        <button
          onClick={onFinish}
          className="text-neutral-500 text-xs tracking-widest hover:text-neutral-700 underline text-center transition-colors"
        >
          Terminar ronda
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Day3Game — 1 vs Chat image-guessing game with Twitch integration
// ─────────────────────────────────────────────────────────────────

function Day3Game({
  state, onStartRound, onStreamerGuess, onChatWin, onNextRound,
}: {
  state: Day3State;
  onStartRound: () => void;
  onStreamerGuess: (text: string) => void;
  onChatWin: (user: string) => void;
  onNextRound: () => void;
}) {
  const [input, setInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<Day3ChatMsg[]>([]);
  const [connected, setConnected] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef("");
  const activeRef = useRef(false);
  const onChatWinRef = useRef(onChatWin);

  // Keep refs current without restarting the WebSocket
  const round = day3Rounds[state.currentRound];
  wordRef.current = state.roundActive ? (round?.word ?? "") : "";
  activeRef.current = state.roundActive && !state.roundWinner;
  onChatWinRef.current = onChatWin;

  // Twitch IRC (anonymous read-only)
  useEffect(() => {
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send("PASS oauth:poop");
      ws.send("NICK justinfan77777");
      ws.send(`JOIN #${TWITCH_CHANNEL}`);
      setConnected(true);
    };

    ws.onclose = () => setConnected(false);

    ws.onmessage = (evt) => {
      const raw = evt.data as string;
      if (raw.startsWith("PING")) { ws.send("PONG :tmi.twitch.tv"); return; }
      if (!raw.includes("PRIVMSG")) return;

      const text = raw.match(/PRIVMSG #\w+ :(.+)/)?.[1]?.trim();
      if (!text) return;

      const user =
        raw.match(/display-name=([^;]+)/)?.[1] ||
        raw.match(/:(\w+)!\w+@/)?.[1] ||
        "chat";

      const correct =
        activeRef.current &&
        normalizeAnswer(text) === normalizeAnswer(wordRef.current);

      if (correct) onChatWinRef.current(user);

      setChatMsgs(prev => [
        ...prev.slice(-49),
        { id: Date.now() + Math.random(), user, text, correct },
      ]);
    };

    return () => ws.close();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  function handleStreamerGuess(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!input.trim() || !state.roundActive || !!state.roundWinner) return;
    onStreamerGuess(input.trim());
    setInput("");
  }

  const isLast = state.currentRound >= day3Rounds.length - 1;
  const hasWinner = !!state.roundWinner;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">

      {/* ── Header: round + scores ── */}
      <div className="flex items-center justify-between">
        <span className="text-neutral-400 text-xs tracking-widest">
          RONDA {state.currentRound + 1} / {day3Rounds.length}
        </span>
        <div className="flex items-center gap-4 text-sm font-bold tracking-widest">
          <span className={state.streamerScore > state.chatScore ? "text-green-400" : "text-neutral-300"}>
            POLISPOL {state.streamerScore}
          </span>
          <span className="text-neutral-600">vs</span>
          <span className={state.chatScore > state.streamerScore ? "text-green-400" : "text-neutral-300"}>
            {state.chatScore} CHAT
          </span>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] tracking-widest ${connected ? "text-green-500" : "text-neutral-600"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-neutral-600"}`} />
          {connected ? "CHAT CONECTADO" : "CONECTANDO..."}
        </div>
      </div>

      {/* ── 2×2 image grid + chat feed ── */}
      <div className="flex gap-4">

        {/* Images */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          {(round?.images ?? ["", "", "", ""]).map((img, i) => (
            <div
              key={i}
              className="aspect-square bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden"
            >
              {state.roundActive || hasWinner ? (
                img ? (
                  <img src={img} alt={`Pista ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-neutral-600">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] tracking-widest">IMAGEN {i + 1}</span>
                  </div>
                )
              ) : (
                <span className="text-3xl font-bold text-neutral-700">{i + 1}</span>
              )}
            </div>
          ))}
        </div>

        {/* Chat feed */}
        <div className="w-48 flex flex-col gap-1">
          <p className="text-[10px] text-neutral-600 tracking-widest mb-1">CHAT — #{TWITCH_CHANNEL}</p>
          <div className="overflow-y-auto max-h-[40vh] flex flex-col gap-0.5 pr-1">
            {chatMsgs.length === 0 ? (
              <p className="text-neutral-700 text-[10px] italic">Sin mensajes aún...</p>
            ) : (
              chatMsgs.map(msg => (
                <div
                  key={msg.id}
                  className={`text-[11px] leading-tight break-words ${msg.correct ? "text-green-400 font-bold" : "text-neutral-400"
                    }`}
                >
                  <span className="text-purple-400 font-bold">{msg.user}</span>
                  {": "}{msg.text}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* ── Round status ── */}
      {!state.roundActive && !hasWinner && !state.gameFinished && (
        <button
          onClick={onStartRound}
          className="w-full bg-neutral-800 text-neutral-100 py-3 text-sm tracking-[0.3em] hover:bg-neutral-700 transition-colors border border-neutral-700"
        >
          INICIAR RONDA {state.currentRound + 1}
        </button>
      )}

      {state.roundActive && !hasWinner && (
        <form onSubmit={handleStreamerGuess} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            className="flex-1 bg-neutral-900 border border-neutral-600 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 tracking-[0.2em] uppercase placeholder:text-neutral-700 placeholder:tracking-normal"
            placeholder="Tu respuesta..."
            autoComplete="off"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-neutral-700 text-neutral-200 px-5 py-2 text-xs tracking-[0.2em] hover:bg-neutral-600 transition-colors border border-neutral-600 disabled:opacity-30 shrink-0"
          >
            ADIVINAR
          </button>
        </form>
      )}

      {hasWinner && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`border p-4 flex items-center justify-between gap-4 ${state.roundWinner === "streamer"
              ? "border-yellow-600 bg-yellow-950/40"
              : "border-purple-600 bg-purple-950/40"
            }`}
        >
          <div>
            <p className={`text-sm font-bold tracking-widest ${state.roundWinner === "streamer" ? "text-yellow-400" : "text-purple-400"
              }`}>
              {state.roundWinner === "streamer" ? "¡POLISPOL GANA LA RONDA!" : "¡EL CHAT GANA LA RONDA!"}
            </p>
            <p className="text-neutral-400 text-xs mt-1 tracking-widest">
              LA PALABRA ERA: <span className="text-neutral-100 font-bold">{round?.word}</span>
            </p>
          </div>
          <button
            onClick={onNextRound}
            className="bg-neutral-700 text-neutral-200 px-4 py-2 text-xs tracking-[0.2em] hover:bg-neutral-600 transition-colors border border-neutral-600 shrink-0"
          >
            {isLast ? "VER RESULTADO →" : `RONDA ${state.currentRound + 2} →`}
          </button>
        </motion.div>
      )}

      {state.gameFinished && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="border border-neutral-600 bg-neutral-800/60 p-6 text-center"
        >
          <p className="text-neutral-400 text-[10px] tracking-[0.3em] mb-2">PARTIDA COMPLETADA</p>
          <p className="text-3xl font-bold tracking-widest mb-1">
            {state.streamerScore > state.chatScore
              ? <span className="text-yellow-400">POLISPOL GANA</span>
              : state.chatScore > state.streamerScore
                ? <span className="text-purple-400">CHAT GANA</span>
                : <span className="text-neutral-200">EMPATE</span>}
          </p>
          <p className="text-neutral-500 text-sm tracking-widest">
            {state.streamerScore} — {state.chatScore}
          </p>
          {state.streamerScore > state.chatScore && (
            <p className="text-yellow-400/70 text-xs tracking-[0.3em] mt-3">
              PALABRA CLAVE: <span className="text-yellow-400 font-bold">RASTRO</span>
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BoomGame — Boom Party–style syllable game with Twitch chat
// ─────────────────────────────────────────────────────────────────

function BoomGame({ onFinish, username }: { onFinish: () => void; username: string }) {
  const [phase, setPhase] = useState<BoomPhase>("waiting");
  const [roundNumber, setRoundNumber] = useState(1);
  const [players, setPlayers] = useState<BoomPlayer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [question, setQuestion] = useState<BoomQuestion | null>(null);
  const [usedQIdxs, setUsedQIdxs] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(7);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs] = useState<{ id: number; user: string; text: string; highlight: boolean }[]>([]);
  const [connected, setConnected] = useState(false);
  const [streamerInput, setStreamerInput] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<BoomPhase>("waiting");
  const playersRef = useRef<BoomPlayer[]>([]);
  const currentIdxRef = useRef(0);
  const questionRef = useRef<BoomQuestion | null>(null);
  const usedQIdxsRef = useRef<number[]>([]);
  const onFinishRef = useRef(onFinish);

  phaseRef.current = phase;
  playersRef.current = players;
  currentIdxRef.current = currentIdx;
  questionRef.current = question;
  usedQIdxsRef.current = usedQIdxs;
  onFinishRef.current = onFinish;

  function timerFor(idx: number, arr: BoomPlayer[]): number {
    return arr[idx]?.name.toLowerCase() === username.toLowerCase() ? 7 : 8;
  }

  function pickQuestion(used: number[]): { q: BoomQuestion; qIdx: number } {
    const available = BOOM_QUESTIONS.map((_, i) => i).filter(i => !used.includes(i));
    const pool = available.length > 0 ? available : BOOM_QUESTIONS.map((_, i) => i);
    const qIdx = pool[Math.floor(Math.random() * pool.length)];
    return { q: BOOM_QUESTIONS[qIdx], qIdx };
  }

  function getNextAliveIdx(from: number, arr: BoomPlayer[]): number {
    for (let i = 1; i <= arr.length; i++) {
      const idx = (from + i) % arr.length;
      if (!arr[idx].eliminated) return idx;
    }
    return from;
  }

  function countAlive(arr: BoomPlayer[]): number {
    return arr.filter(p => !p.eliminated).length;
  }

  function isStreamerTurn(): boolean {
    return players[currentIdx]?.name.toLowerCase() === username.toLowerCase();
  }

  // Called when only 1 player remains — ends the current round
  function endRound(finalPlayers: BoomPlayer[]) {
    const w = finalPlayers.find(p => !p.eliminated)?.name ?? "Nadie";
    setRoundWinner(w);
    setPlayers(finalPlayers);
    setPhase("roundOver");
  }

  // Advance to next player after a correct answer or timeout
  function advanceTurn(updatedPlayers: BoomPlayer[], fromIdx: number) {
    if (countAlive(updatedPlayers) <= 1) { endRound(updatedPlayers); return; }
    const next = getNextAliveIdx(fromIdx, updatedPlayers);
    const { q, qIdx } = pickQuestion(usedQIdxsRef.current);
    setUsedQIdxs(prev => [...prev, qIdx]);
    setQuestion(q);
    setCurrentIdx(next);
    setTimeLeft(timerFor(next, updatedPlayers));
    setPlayers(updatedPlayers);
  }

  // Called when streamer clicks "Siguiente Ronda" or "Finalizar"
  function handleNextRound() {
    if (roundNumber >= TOTAL_ROUNDS) {
      setPhase("finished");
      onFinishRef.current();
      return;
    }
    const newRound = roundNumber + 1;
    setRoundNumber(newRound);
    setRoundWinner(null);
    setQuestion(null);
    setUsedQIdxs([]);
    setChatMsgs([]);
    setCurrentIdx(0);
    setStreamerInput("");
    setPlayers([{ name: username.trim() || "POLISPOL", eliminated: false, score: 0 }]);
    setPhase("waiting");
  }

  function handleStreamerSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (phase !== "playing" || !isStreamerTurn() || !questionRef.current) return;
    const normalized = normalizeAnswer(streamerInput);
    const expected = normalizeAnswer(questionRef.current.answer);
    setStreamerInput("");
    if (!normalized || normalized !== expected) return;
    const updated = playersRef.current.map((p, i) =>
      i === currentIdxRef.current ? { ...p, score: p.score + 1 } : p
    );
    advanceTurn(updated, currentIdxRef.current);
  }

  // Seed streamer as first player on mount
  useEffect(() => {
    setPlayers([{ name: username.trim() || "POLISPOL", eliminated: false, score: 0 }]);
  }, []);

  // Countdown timer — eliminates current player on timeout
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      const idx = currentIdxRef.current;
      const cur = playersRef.current[idx];
      if (!cur || cur.eliminated) return;
      const updated = playersRef.current.map((p, i) =>
        i === idx ? { ...p, eliminated: true } : p
      );
      advanceTurn(updated, idx);
      return;
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  // Twitch IRC — registration (!imitador) + answer detection
  useEffect(() => {
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send("PASS oauth:poop");
      ws.send("NICK justinfan33333");
      ws.send(`JOIN #${TWITCH_CHANNEL}`);
      setConnected(true);
    };
    ws.onclose = () => setConnected(false);
    ws.onmessage = (evt) => {
      const raw = evt.data as string;
      if (raw.startsWith("PING")) { ws.send("PONG :tmi.twitch.tv"); return; }
      if (!raw.includes("PRIVMSG")) return;
      const text = raw.match(/PRIVMSG #\w+ :(.+)/)?.[1]?.trim() ?? "";
      const user = (
        raw.match(/display-name=([^;]+)/)?.[1] ||
        raw.match(/:(\w+)!\w+@/)?.[1] ||
        "anon"
      ).toLowerCase();

      if (phaseRef.current === "waiting") {
        if (text.toLowerCase() === "!imitador") {
          setPlayers(prev => {
            if (prev.length >= MAX_BOOM_PLAYERS) return prev;
            if (prev.some(p => p.name.toLowerCase() === user)) return prev;
            return [...prev, { name: user, eliminated: false, score: 0 }];
          });
        }
        return;
      }

      if (phaseRef.current === "playing") {
        const cur = playersRef.current[currentIdxRef.current];
        const baseMsg = { id: Date.now() + Math.random(), user, text, highlight: false };
        if (!cur || cur.name.toLowerCase() !== user || !questionRef.current) {
          setChatMsgs(prev => [...prev.slice(-49), baseMsg]);
          return;
        }
        const normalized = normalizeAnswer(text);
        const expected = normalizeAnswer(questionRef.current.answer);
        if (normalized !== expected) {
          setChatMsgs(prev => [...prev.slice(-49), baseMsg]);
          return;
        }
        setChatMsgs(prev => [...prev.slice(-49), { ...baseMsg, highlight: true }]);
        const updated = playersRef.current.map((p, i) =>
          i === currentIdxRef.current ? { ...p, score: p.score + 1 } : p
        );
        advanceTurn(updated, currentIdxRef.current);
      }
    };
    return () => ws.close();
  }, []);

  const arrowDeg = players.length > 0 ? (currentIdx / players.length) * 360 : 0;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-neutral-400 text-xs tracking-widest">
          {phase === "finished"
            ? "PARTIDA FINALIZADA"
            : `RONDA ${roundNumber} / ${TOTAL_ROUNDS}${phase === "playing" ? ` — ${countAlive(players)} EN JUEGO` : ""}`}
        </span>
        <div className={`flex items-center gap-1.5 text-[10px] tracking-widest ${connected ? "text-green-500" : "text-neutral-600"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-neutral-600"}`} />
          {connected ? "CHAT CONECTADO" : "CONECTANDO..."}
        </div>
      </div>

      {/* Waiting — player registration */}
      {phase === "waiting" && (
        <div className="flex flex-col gap-4">
          <div className="bg-neutral-800/40 border border-neutral-700 p-4">
            <p className="text-neutral-400 text-xs tracking-widest mb-3">
              Los primeros <span className="text-amber-400 font-bold">{MAX_BOOM_PLAYERS}</span> en escribir{" "}
              <span className="text-amber-400 font-bold">!imitador</span> en el chat participarán en la ronda {roundNumber}.
            </p>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {players.map((p, i) => (
                <span key={i} className="bg-neutral-700 text-neutral-200 px-2 py-1 text-xs tracking-wider">
                  {i + 1}. {p.name}
                </span>
              ))}
              {players.length === 0 && (
                <span className="text-neutral-600 text-xs italic">Esperando jugadores...</span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              if (players.length < 2) return;
              const { q, qIdx } = pickQuestion([]);
              setQuestion(q);
              setUsedQIdxs([qIdx]);
              setCurrentIdx(0);
              setTimeLeft(timerFor(0, players));
              setPhase("playing");
            }}
            disabled={players.length < 2}
            className="w-full bg-neutral-800 text-neutral-100 py-3 text-sm tracking-[0.3em] hover:bg-neutral-700 transition-colors border border-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {players.length < 2
              ? `ESPERANDO JUGADORES (${players.length} / ${MAX_BOOM_PLAYERS})`
              : `INICIAR RONDA ${roundNumber} CON ${players.length} JUGADORES`}
          </button>
        </div>
      )}

      {/* Round over — show winner + next round / finish button */}
      {phase === "roundOver" && (
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="border border-amber-600 bg-amber-950/40 p-6 text-center"
          >
            <p className="text-[10px] tracking-widest text-amber-500/70 mb-1">
              GANADOR / GANADORA — RONDA {roundNumber}
            </p>
            <p className="text-2xl font-bold text-amber-400 tracking-widest break-words mt-2">
              {roundWinner}
            </p>
          </motion.div>
          <button
            onClick={handleNextRound}
            className="w-full bg-neutral-800 text-neutral-100 py-3 text-sm tracking-[0.3em] hover:bg-neutral-700 transition-colors border border-neutral-700"
          >
            {roundNumber >= TOTAL_ROUNDS ? "FINALIZAR PARTIDA →" : `RONDA ${roundNumber + 1} →`}
          </button>
        </div>
      )}

      {/* Finished — all rounds done */}
      {phase === "finished" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="border border-neutral-600 bg-neutral-800/40 p-6 text-center"
        >
          <p className="text-[10px] tracking-widest text-neutral-500 mb-2">PARTIDA COMPLETADA — {TOTAL_ROUNDS} RONDAS</p>
          <p className="text-neutral-400 text-sm mb-3">Ingresa el código para continuar.</p>
          <p className="text-amber-500/70 text-xs tracking-[0.3em]">
            PALABRA CLAVE: <span className="text-amber-400 font-bold">ORIGINAL</span>
          </p>
        </motion.div>
      )}

      {/* Playing — circle + right panel */}
      {phase === "playing" && (
        <div className="flex gap-4 items-start">

          {/* Circle */}
          <div
            className="relative shrink-0"
            style={{ width: BOOM_CIRCLE_SIZE, height: BOOM_CIRCLE_SIZE }}
          >
            {players.map((p, i) => {
              const angle = -Math.PI / 2 + (i / players.length) * 2 * Math.PI;
              const x = BOOM_CIRCLE_CENTER + BOOM_CIRCLE_RADIUS * Math.cos(angle);
              const y = BOOM_CIRCLE_CENTER + BOOM_CIRCLE_RADIUS * Math.sin(angle);
              const isCurr = i === currentIdx;
              return (
                <div
                  key={i}
                  style={{ left: x, top: y, transform: "translate(-50%,-50%)", position: "absolute" }}
                  className={`px-1.5 py-0.5 text-[9px] font-bold tracking-wide border text-center w-[72px] transition-colors
                    ${p.eliminated
                      ? "bg-neutral-900 border-neutral-800 text-neutral-700 line-through"
                      : isCurr
                        ? "bg-amber-400 border-amber-500 text-neutral-900"
                        : "bg-neutral-800 border-neutral-600 text-neutral-200"}`}
                >
                  <div className="truncate">{p.name}</div>
                </div>
              );
            })}

            {/* Arrow */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={BOOM_CIRCLE_SIZE}
              height={BOOM_CIRCLE_SIZE}
            >
              <g
                style={{
                  transform: `rotate(${arrowDeg}deg)`,
                  transformOrigin: `${BOOM_CIRCLE_CENTER}px ${BOOM_CIRCLE_CENTER}px`,
                  transition: "transform 0.6s ease",
                }}
              >
                <line
                  x1={BOOM_CIRCLE_CENTER} y1={BOOM_CIRCLE_CENTER - 52}
                  x2={BOOM_CIRCLE_CENTER} y2={BOOM_CIRCLE_CENTER - BOOM_CIRCLE_RADIUS + 22}
                  stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"
                />
                <polygon
                  points={`${BOOM_CIRCLE_CENTER},${BOOM_CIRCLE_CENTER - BOOM_CIRCLE_RADIUS + 5} ${BOOM_CIRCLE_CENTER - 8},${BOOM_CIRCLE_CENTER - BOOM_CIRCLE_RADIUS + 23} ${BOOM_CIRCLE_CENTER + 8},${BOOM_CIRCLE_CENTER - BOOM_CIRCLE_RADIUS + 23}`}
                  fill="#fbbf24"
                />
              </g>
            </svg>

            {/* Timer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`text-5xl font-bold tabular-nums ${timeLeft <= 2 ? "text-red-400" : timeLeft <= 3 ? "text-yellow-400" : "text-green-400"
                }`}>
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">

            {/* Question */}
            {question && (
              <div className="bg-neutral-900 border border-neutral-600 p-3">
                <p className="text-[10px] text-neutral-500 tracking-widest mb-1.5">PREGUNTA</p>
                <p className="text-sm text-neutral-100 leading-relaxed">{question.text}</p>
              </div>
            )}

            {/* Turn */}
            <div className="bg-neutral-800/60 border border-neutral-700 px-3 py-2">
              <p className="text-[10px] text-neutral-500 tracking-widest mb-0.5">TURNO DE</p>
              <p className="text-sm font-bold text-amber-400 tracking-wider truncate">
                {players[currentIdx]?.name}
              </p>
            </div>

            {/* Streamer input */}
            {isStreamerTurn() && (
              <form onSubmit={handleStreamerSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={streamerInput}
                  onChange={e => setStreamerInput(e.target.value)}
                  className="flex-1 min-w-0 bg-neutral-900 border border-amber-600 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
                  placeholder="Tu respuesta..."
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!streamerInput.trim()}
                  className="bg-amber-700 text-neutral-100 px-4 py-2 text-xs tracking-[0.2em] hover:bg-amber-600 transition-colors border border-amber-600 disabled:opacity-30 shrink-0"
                >
                  ENVIAR
                </button>
              </form>
            )}

            {/* Chat */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-neutral-600 tracking-widest">CHAT — #{TWITCH_CHANNEL}</p>
              <div className="overflow-y-auto max-h-[22vh] flex flex-col gap-0.5">
                {chatMsgs.length === 0 && (
                  <p className="text-neutral-700 text-[10px] italic">Sin mensajes aún...</p>
                )}
                {chatMsgs.map(msg => (
                  <div
                    key={msg.id}
                    className={`text-[11px] leading-tight break-words ${msg.highlight ? "text-green-400 font-bold" : "text-neutral-400"
                      }`}
                  >
                    <span className="text-purple-400 font-bold">{msg.user}</span>: {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// WordlePaper component (state is lifted to Home to persist navigation)
// ─────────────────────────────────────────────────────────────────

function WordlePaper({
  label, word, fragment, rotate, clue, state, onInput, onSubmit,
}: {
  label: string; word: string; fragment: string; rotate: string; clue?: string;
  state: WordleState;
  onInput: (v: string) => void;
  onSubmit: () => void;
}) {
  const CELL = 28;
  const GAP = 2;

  return (
    <div className={`bg-[#f4f1ea] border border-neutral-300 shadow-lg p-4 flex flex-col gap-3 ${rotate}`}>
      <div className="border-b border-neutral-400 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-600" />
          <span className="text-xs font-bold text-neutral-800 tracking-widest">{label}</span>
        </div>
        {state.won && (
          <span className="text-sm font-bold text-green-700 border border-green-600 px-2 tracking-widest">
            {fragment}
          </span>
        )}
      </div>

      {clue && (
        <div className="bg-neutral-100 border border-neutral-300 px-3 py-2">
          <p className="text-[10px] text-neutral-500 tracking-widest mb-0.5">PISTA</p>
          <p className="text-xs text-neutral-700 leading-relaxed">{clue}</p>
        </div>
      )}

      <div className="flex flex-col" style={{ gap: GAP }}>
        {Array.from({ length: MAX_WORDLE_GUESSES }).map((_, rowIdx) => {
          const submitted = state.guesses[rowIdx];
          const isActive = rowIdx === state.guesses.length && !state.won && !state.lost;
          const letters = submitted
            ? submitted.split("")
            : isActive
              ? Array.from({ length: word.length }, (_, i) => state.currentInput[i] ?? "")
              : Array(word.length).fill("");
          const states = submitted ? getLetterStates(submitted, word) : null;

          return (
            <div key={rowIdx} className="flex" style={{ gap: GAP }}>
              {Array.from({ length: word.length }).map((_, colIdx) => {
                const letter = letters[colIdx] ?? "";
                const st = states?.[colIdx];
                return (
                  <div
                    key={colIdx}
                    style={{ width: CELL, height: CELL }}
                    className={`flex items-center justify-center text-[10px] font-bold border select-none
                      ${st === "correct" ? "bg-green-600  border-green-600  text-white"
                        : st === "present" ? "bg-yellow-500 border-yellow-500 text-white"
                          : st === "absent" ? "bg-neutral-500 border-neutral-500 text-white"
                            : letter ? "border-neutral-500 text-neutral-800"
                              : "border-neutral-300"}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {!state.won && !state.lost ? (
        <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="flex gap-2 mt-1">
          <input
            type="text"
            value={state.currentInput}
            onChange={e =>
              onInput(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, word.length))
            }
            className="flex-1 min-w-0 bg-white border border-neutral-400 text-neutral-800 px-2 py-1 text-xs tracking-[0.15em] uppercase focus:outline-none focus:border-neutral-600"
            placeholder={`${word.length} letras`}
          />
          <button
            type="submit"
            disabled={state.currentInput.length !== word.length}
            className="bg-neutral-800 text-white px-3 py-1 text-xs hover:bg-neutral-700 transition-colors disabled:opacity-40 shrink-0"
          >
            ↵
          </button>
        </form>
      ) : state.won ? (
        <div className="bg-green-50 border border-green-300 p-2 text-center">
          <p className="text-green-700 text-xs font-bold tracking-widest">¡DESCIFRADO!</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fragment}</p>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-300 p-2 text-center">
          <p className="text-red-600 text-xs tracking-widest">INTENTOS AGOTADOS</p>
          <p className="text-xs text-red-500 mt-1 font-bold tracking-widest">{word}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────

export default function Home() {
  // ── Auth ──
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginView, setLoginView] = useState<LoginView>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [authError, setAuthError] = useState("");

  // ── Intro ──
  const [introSeen, setIntroSeen] = useState(false);

  // ── Folder ──
  const [isOpen, setIsOpen] = useState(false);
  const [unlockedUpTo, setUnlockedUpTo] = useState(1);

  // ── Evidence / code ──
  const [activeCase, setActiveCase] = useState<number | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeStatus, setCodeStatus] = useState<CodeStatus>("idle");

  // ── Wordle state for case 2 ──
  const [wordleStates, setWordleStates] = useState<WordleState[]>(() =>
    case2Words.map(() => ({ guesses: [], currentInput: "", won: false, lost: false }))
  );

  // ── Boom Party finished flag for case 5 ──
  const [boomFinished, setBoomFinished] = useState(false);

  // ── Day3 game state for case 3 ──
  const [day3State, setDay3State] = useState<Day3State>({
    currentRound: 0,
    streamerScore: 0,
    chatScore: 0,
    roundActive: false,
    roundWinner: null,
    gameFinished: false,
  });

  // ── Pasapalabra state for case 3 ──
  const [pasapalabraState, setPasapalabraState] = useState<PasapalabraState>(() => ({
    letterStates: pasapalabraClues.map(() => "pending" as LetterStatus),
    currentIdx: 0,
    currentInput: "",
    finished: false,
  }));

  // ── Derived ──
  const allSolved = unlockedUpTo > cases.length;
  const orderedCases = [
    ...cases.filter(c => c.id === unlockedUpTo),
    ...cases.filter(c => c.id < unlockedUpTo).reverse(),
    ...cases.filter(c => c.id > unlockedUpTo),
  ];

  const wordleFragments = case2Words.map((w, i) => (wordleStates[i].won ? w.fragment : null));
  const wordleSolvedCount = wordleFragments.filter(Boolean).length;
  const wordleAllSolved = wordleSolvedCount === case2Words.length;

  const pasapalabraIncorrectCount = pasapalabraState.letterStates.filter(s => s === "incorrect").length;

  // ── Auth handlers ──
  function switchView(view: LoginView) { setAuthError(""); setForgotSent(false); setLoginView(view); }

  function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setAuthError("Credenciales inválidas."); return; }
    setIsLoggedIn(true); setAuthError("");
  }

  function handleRegister(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!regEmail.trim() || !regUsername.trim() || !regPassword.trim()) { setAuthError("Completa todos los campos."); return; }
    setAuthError(""); switchView("login");
  }

  function handleForgotPassword(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) { setAuthError("Ingresa tu correo electrónico."); return; }
    setAuthError(""); setForgotSent(true);
  }

  // ── Case / evidence handlers ──
  function openCase(id: number) {
    setIsOpen(false); setActiveCase(id); setCodeInput(""); setCodeStatus("idle");
  }

  function closeEvidence() {
    setActiveCase(null); setCodeInput(""); setCodeStatus("idle");
  }

  function handleCodeSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const current = cases.find(c => c.id === activeCase);
    if (!current) return;
    const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");
    if (norm(codeInput) === norm(current.code)) {
      setCodeStatus("success");
      setUnlockedUpTo(current.id + 1);
    } else {
      setCodeStatus("error");
    }
  }

  // ── Wordle handlers ──
  function handleWordleInput(index: number, value: string) {
    setWordleStates(prev => prev.map((s, i) => i === index ? { ...s, currentInput: value } : s));
  }

  function handleWordleSubmit(index: number) {
    const ws = wordleStates[index];
    const target = case2Words[index].word.toUpperCase();
    const guess = ws.currentInput.toUpperCase();
    if (guess.length !== target.length || ws.won || ws.lost) return;
    const newGuesses = [...ws.guesses, guess];
    const won = guess === target;
    const lost = !won && newGuesses.length >= MAX_WORDLE_GUESSES;
    setWordleStates(prev => prev.map((s, i) =>
      i === index ? { ...s, guesses: newGuesses, currentInput: "", won, lost } : s
    ));
  }

  // ── Pasapalabra handlers ──
  function handlePasapalabraInput(v: string) {
    setPasapalabraState(prev => ({ ...prev, currentInput: v }));
  }

  function handlePasapalabraAnswer() {
    const ps = pasapalabraState;
    if (ps.finished || !ps.currentInput.trim()) return;
    const clue = pasapalabraClues[ps.currentIdx];
    const correct = normalizeAnswer(ps.currentInput) === normalizeAnswer(clue.answer);
    const newStates = [...ps.letterStates] as LetterStatus[];
    newStates[ps.currentIdx] = correct ? "correct" : "incorrect";
    const nextIdx = getNextPendingIdx(newStates, ps.currentIdx);
    const finished = nextIdx === -1;
    setPasapalabraState({ letterStates: newStates, currentIdx: finished ? ps.currentIdx : nextIdx, currentInput: "", finished });
  }

  function handlePasapalabraPass() {
    const ps = pasapalabraState;
    if (ps.finished) return;
    const nextIdx = getNextPendingIdx(ps.letterStates, ps.currentIdx);
    if (nextIdx === -1) {
      setPasapalabraState(prev => ({
        ...prev,
        letterStates: prev.letterStates.map(s => s === "pending" ? "incorrect" : s) as LetterStatus[],
        finished: true,
      }));
      return;
    }
    setPasapalabraState(prev => ({ ...prev, currentIdx: nextIdx, currentInput: "" }));
  }

  function handlePasapalabraFinish() {
    setPasapalabraState(prev => ({
      ...prev,
      letterStates: prev.letterStates.map(s => s === "pending" ? "incorrect" : s) as LetterStatus[],
      finished: true,
    }));
  }

  // ── Day3 handlers ──
  function handleDay3StartRound() {
    setDay3State(prev => ({ ...prev, roundActive: true, roundWinner: null }));
  }

  function handleDay3StreamerGuess(text: string) {
    const round = day3Rounds[day3State.currentRound];
    if (!round || !day3State.roundActive || day3State.roundWinner) return;
    if (normalizeAnswer(text) === normalizeAnswer(round.word)) {
      setDay3State(prev => ({
        ...prev,
        roundActive: false,
        roundWinner: "streamer",
        streamerScore: prev.streamerScore + 1,
      }));
    }
  }

  function handleDay3ChatWin(user: string) {
    setDay3State(prev => {
      if (!prev.roundActive || prev.roundWinner) return prev;
      return { ...prev, roundActive: false, roundWinner: "chat", chatScore: prev.chatScore + 1 };
    });
    void user;
  }

  function handleDay3NextRound() {
    setDay3State(prev => {
      const next = prev.currentRound + 1;
      if (next >= day3Rounds.length) {
        return { ...prev, roundActive: false, roundWinner: null, gameFinished: true };
      }
      return { ...prev, currentRound: next, roundActive: false, roundWinner: null };
    });
  }

  // ── Sentence display for case 3 code section ──
  const pasapalabrasDisplay = (() => {
    const blankedSet = new Set(PASAPALABRA_BLANK_ORDER.slice(0, pasapalabraIncorrectCount));
    let nonSpaceIdx = 0;
    return PASAPALABRA_SENTENCE.split("").map((ch, i) => {
      if (ch === " ") return { ch: " ", key: `sp-${i}`, blank: false };
      const blank = blankedSet.has(nonSpaceIdx);
      nonSpaceIdx++;
      return { ch, key: `c-${i}`, blank };
    });
  })();

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-900 font-mono selection:bg-red-900 selection:text-white flex flex-col md:flex-row overflow-hidden">

      {/* ─── PANEL IZQUIERDO: Login / Registro ─── */}
      <AnimatePresence initial={false}>
        {!isLoggedIn && (
          <motion.div
            key="login-panel"
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full md:w-1/2 shrink-0 relative flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-neutral-800 overflow-hidden"
          >
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="relative w-full max-w-sm">

              <div className="mb-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-red-700" />
                  <span className="text-red-700 tracking-[0.3em] text-xs font-bold">ACCESO RESTRINGIDO</span>
                  <Shield className="w-4 h-4 text-red-700" />
                </div>
                <h1 className="text-neutral-200 text-3xl font-bold tracking-[0.4em]">POLISPOL</h1>
                <div className="w-full h-px bg-neutral-700 mt-4" />
              </div>

              <AnimatePresence initial={false}>
                {loginView !== "forgot" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                    className="flex mb-6 border-b border-neutral-700 overflow-hidden"
                  >
                    {(["login", "register"] as const).map(tab => (
                      <button key={tab} onClick={() => switchView(tab)}
                        className={`flex-1 py-2 text-xs tracking-[0.2em] transition-colors border-b-2 -mb-px ${loginView === tab ? "text-neutral-200 border-neutral-400" : "text-neutral-600 border-transparent hover:text-neutral-400"
                          }`}>
                        {tab === "login" ? "ACCESO" : "REGISTRO"}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait" initial={false}>

                {loginView === "login" && (
                  <motion.div key="login" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div>
                        <label className="block text-neutral-500 text-xs tracking-[0.2em] mb-1">AGENTE</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username"
                          className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 tracking-wider placeholder:text-neutral-600"
                          placeholder="ID de agente" />
                      </div>
                      <div>
                        <label className="block text-neutral-500 text-xs tracking-[0.2em] mb-1">CLAVE DE ACCESO</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                          className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 tracking-wider placeholder:text-neutral-600"
                          placeholder="••••••••" />
                      </div>
                      {authError && <p className="text-red-600 text-xs tracking-widest">{authError}</p>}
                      <button type="submit" className="w-full bg-neutral-800 text-neutral-200 py-2 tracking-[0.2em] text-sm hover:bg-neutral-700 transition-colors border border-neutral-700 hover:border-neutral-500">
                        INGRESAR
                      </button>
                    </form>
                    <button onClick={() => switchView("forgot")} className="mt-4 w-full text-center text-neutral-600 hover:text-neutral-400 text-xs tracking-[0.15em] transition-colors">
                      ¿Olvidaste tu clave de acceso?
                    </button>
                  </motion.div>
                )}

                {loginView === "register" && (
                  <motion.div key="register" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                    <form onSubmit={handleRegister} className="space-y-5">
                      <div>
                        <label className="block text-neutral-500 text-xs tracking-[0.2em] mb-1">CORREO ELECTRÓNICO</label>
                        <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} autoComplete="email"
                          className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 tracking-wider placeholder:text-neutral-600"
                          placeholder="agente@polispol.com" />
                      </div>
                      <div>
                        <label className="block text-neutral-500 text-xs tracking-[0.2em] mb-1">NOMBRE DE AGENTE</label>
                        <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} autoComplete="username"
                          className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 tracking-wider placeholder:text-neutral-600"
                          placeholder="ID de agente" />
                      </div>
                      <div>
                        <label className="block text-neutral-500 text-xs tracking-[0.2em] mb-1">CLAVE DE ACCESO</label>
                        <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} autoComplete="new-password"
                          className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 tracking-wider placeholder:text-neutral-600"
                          placeholder="••••••••" />
                      </div>
                      {authError && <p className="text-red-600 text-xs tracking-widest">{authError}</p>}
                      <button type="submit" className="w-full bg-neutral-800 text-neutral-200 py-2 tracking-[0.2em] text-sm hover:bg-neutral-700 transition-colors border border-neutral-700 hover:border-neutral-500">
                        SOLICITAR ACCESO
                      </button>
                    </form>
                  </motion.div>
                )}

                {loginView === "forgot" && (
                  <motion.div key="forgot" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
                    <button onClick={() => switchView("login")} className="flex items-center gap-1 text-neutral-600 hover:text-neutral-400 text-xs tracking-widest mb-6 transition-colors">
                      <ArrowLeft className="w-3 h-3" /> VOLVER AL ACCESO
                    </button>
                    <p className="text-neutral-400 text-xs tracking-[0.15em] mb-5 leading-relaxed">
                      Ingresa tu correo registrado. Se enviarán instrucciones para restablecer tu clave.
                    </p>
                    {!forgotSent ? (
                      <form onSubmit={handleForgotPassword} className="space-y-5">
                        <div>
                          <label className="block text-neutral-500 text-xs tracking-[0.2em] mb-1">CORREO ELECTRÓNICO</label>
                          <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} autoComplete="email"
                            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 tracking-wider placeholder:text-neutral-600"
                            placeholder="agente@polispol.com" />
                        </div>
                        {authError && <p className="text-red-600 text-xs tracking-widest">{authError}</p>}
                        <button type="submit" className="w-full bg-neutral-800 text-neutral-200 py-2 tracking-[0.2em] text-sm hover:bg-neutral-700 transition-colors border border-neutral-700 hover:border-neutral-500">
                          ENVIAR INSTRUCCIONES
                        </button>
                      </form>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="border border-neutral-700 bg-neutral-800/50 p-4 text-center text-neutral-400 text-xs tracking-widest leading-relaxed">
                        INSTRUCCIONES ENVIADAS.<br />Revisa tu correo.
                      </motion.div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>

              <p className="mt-8 text-center text-neutral-700 text-xs tracking-[0.2em]">NIVEL DE CLASIFICACIÓN: ALTO</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PANEL DERECHO: Carpeta / Evidencia ─── */}
      <motion.div
        layout
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

        <AnimatePresence mode="wait">

          {/* ── Vista: Intro / Briefing ── */}
          {isLoggedIn && !introSeen && (
            <motion.div
              key="intro-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-xl flex flex-col gap-6"
            >
              {/* Briefing document */}
              <div className="bg-[#f4f1ea] border border-neutral-300 shadow-2xl p-8 relative">
                {/* Stamp */}
                <div className="absolute top-4 right-4 border-2 border-red-800 text-red-800 font-bold px-2 py-1 text-xs rotate-6 opacity-80 tracking-widest">
                  CONFIDENCIAL
                </div>

                {/* Header */}
                <div className="border-b-2 border-neutral-800 pb-4 mb-6">
                  <p className="text-neutral-500 text-[10px] tracking-[0.3em] mb-1">EXPEDIENTE POLISPOL</p>
                  <h2 className="text-2xl font-bold text-neutral-800 tracking-widest">BIENVENIDO, AGENTE <span className="text-red-800">{username.toUpperCase()}</span></h2>
                </div>

                {/* Body — placeholder text, replace with real context */}
                <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">
                  <p>
                    Si ha llegado hasta este punto, significa que ha sido seleccionado para formar parte de la unidad de investigación especial de Polispol. Su misión será resolver una serie de casos que requieren habilidades analíticas, deductivas y de trabajo en equipo.
                  </p>
                  <p>
                    Durante 7 días enfrentara diversos casos que nos ayudaran a analizar al sospechoso y su expediente, se enfrentara a una prueba por día que de completar de manera correcta le permitirá avanzar al siguiente día.
                  </p>
                  <p>
                    Mucha suerte en el proceso.
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-neutral-300 flex items-center justify-between">
                  <p className="text-neutral-400 text-[10px] tracking-widest">NIVEL DE ACCESO: AUTORIZADO</p>
                  <button
                    onClick={() => setIntroSeen(true)}
                    className="bg-neutral-800 text-[#f4f1ea] px-6 py-2 text-xs tracking-[0.25em] hover:bg-neutral-700 transition-colors border border-neutral-700"
                  >
                    ABRIR EXPEDIENTE →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Vista: Carpeta ── */}
          {(!isLoggedIn || introSeen) && activeCase === null && (
            <motion.div key="folder-view" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="flex flex-col items-center">
              <div className="relative w-[340px] h-[420px] cursor-pointer perspective-[1200px]" onClick={() => setIsOpen(!isOpen)}>

                <div className="absolute inset-0 bg-[#c29b62] rounded-b-lg rounded-tr-lg shadow-2xl border border-[#a68250]">
                  <div className="absolute -top-10 left-0 w-40 h-10 bg-[#c29b62] rounded-t-lg border-t border-l border-r border-[#a68250] flex items-center px-4">
                    <span className="text-neutral-900 font-bold tracking-widest text-sm opacity-60">EXPEDIENTE</span>
                  </div>
                  <div className="absolute top-4 right-4 border-2 border-red-800 text-red-800 font-bold px-2 py-1 transform rotate-12 opacity-80">CONFIDENCIAL</div>
                </div>

                <div className={`absolute inset-0 p-4 ${!isOpen ? "pointer-events-none" : ""}`}>
                  {orderedCases.map((c, index) => {
                    const isActive = c.id === unlockedUpTo && !allSolved;
                    const isSolved = c.id < unlockedUpTo;
                    const isLocked = c.id > unlockedUpTo;
                    const accessible = isActive && isLoggedIn;

                    return (
                      <motion.div
                        key={c.id}
                        initial={false}
                        animate={{ y: isOpen ? -55 - index * 15 : 0, scale: isOpen ? 1 : 0.95 }}
                        transition={{ duration: 0.5, delay: isOpen ? index * 0.07 : 0, ease: "backOut" }}
                        onClick={e => { e.stopPropagation(); if (accessible) openCase(c.id); }}
                        className={`absolute top-4 left-4 right-4 bottom-4 bg-[#f4f1ea] rounded shadow-md border border-neutral-300 p-6 flex flex-col ${accessible ? "cursor-pointer" : "cursor-default"}`}
                        style={{ zIndex: 10 - index }}
                      >
                        <div className="border-b-2 border-neutral-800 pb-2 mb-4 flex justify-between items-center">
                          <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                            <FileText className="w-5 h-5" /> Caso #{c.id}
                          </h2>
                          {isLocked && <Lock className="w-5 h-5 text-neutral-500" />}
                          {isSolved && <span className="text-blue-700  font-bold text-sm">RESUELTO</span>}
                          {isActive && <span className="text-green-700 font-bold text-sm">ACTIVO</span>}
                        </div>
                        <h3 className="text-lg font-bold text-neutral-700 mb-2">{c.title}</h3>
                        {(isLocked || (isActive && !isLoggedIn)) && (
                          <div className="mt-auto bg-neutral-200 p-3 text-center text-neutral-500 text-sm border border-neutral-300 border-dashed">
                            CONTENIDO RESTRINGIDO.<br />Autorización pendiente.
                          </div>
                        )}
                        {isSolved && (
                          <div className="mt-auto bg-blue-50 border border-blue-200 border-dashed p-3 text-center text-blue-600 text-sm">
                            CASO RESUELTO.
                          </div>
                        )}
                        {accessible && (
                          <div className="mt-auto">
                            <p className="text-sm text-neutral-600 mb-4">
                              {c.id === 1
                                ? "El día de hoy inicia la investigación del sospechoso, iniciaremos con un analisis que requiere descifrar algunas palabras clave relacionadas a su entorno y actividades recientes."
                                : c.id === 2
                                  ? "El día de hoy requerimos encontrar una frase clave empleada por el sospechoso en sus comunicaciones, para ello debemos encontrar su comportamiento con respecto a las letras que conforman el alfabeto."
                                  : c.id === 3
                                    ? "Ya logramos identificar algunas tendencias del sospechoso, ahora necesitamos analizar su comportamiento en situaciones bajo presión."
                                    : c.id === 4
                                      ? "Nuestra agente MoniRapida nos a contactado el día de hoy con un avance en su investigación, busca clasificar correctamente el archivo para poder continuar con el análisis del sospechoso."
                                      : c.id === 5
                                        ? "El día de hoy nos encontramos con un problema que frena nuestra investigación, debemos poner al sujeto a prueba para encontrar al verdadero Polispol entre algunos imitadores."
                                        : "Analiza las evidencias disponibles y descifra el código para avanzar en la investigación."}
                            </p>
                            <button
                              onClick={e => { e.stopPropagation(); openCase(c.id); }}
                              className="w-full bg-neutral-800 text-[#f4f1ea] py-2 hover:bg-neutral-700 transition-colors text-sm tracking-widest"
                            >
                              INSPECCIONAR EVIDENCIA
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  initial={false}
                  animate={{ rotateX: isOpen ? -110 : 0, y: isOpen ? 40 : 0, opacity: isOpen ? 0 : 1 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  style={{ transformOrigin: "bottom" }}
                  className="absolute inset-0 bg-[#d4a86a] rounded-b-lg rounded-tr-lg shadow-inner border border-[#b88f56] z-20 flex flex-col items-center justify-center pointer-events-none"
                >
                  <div className="w-3/4 h-1/2 border-4 border-[#b88f56]/50 rounded flex items-center justify-center">
                    <div className="text-red-800 font-bold text-4xl uppercase tracking-[0.2em] -rotate-45">POLISPOL</div>
                  </div>
                </motion.div>
              </div>

              <motion.p animate={{ opacity: isOpen ? 0 : 1 }} className="mt-6 text-neutral-500 tracking-widest text-sm">
                [ CLICK PARA ABRIR EXPEDIENTE ]
              </motion.p>
            </motion.div>
          )}

          {/* ── Vista: Evidencia + Código ── */}
          {activeCase !== null && (
            <motion.div
              key={`evidence-${activeCase}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center gap-6 overflow-y-auto max-h-screen py-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between w-full max-w-2xl">
                <button onClick={closeEvidence} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors text-xs tracking-widest">
                  <ArrowLeft className="w-4 h-4" /> VOLVER AL EXPEDIENTE
                </button>
                <span className="text-neutral-600 text-xs tracking-[0.2em]">
                  CASO #{activeCase} — {cases.find(c => c.id === activeCase)?.title}
                </span>
              </div>

              {/* Evidence papers */}
              {activeCase === 5 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "backOut" }}
                >
                  <BoomGame onFinish={() => setBoomFinished(true)} username={username} />
                </motion.div>
              ) : activeCase === 4 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "backOut" }}
                  className="w-full max-w-2xl"
                >
                  {/* Agent letter — Day 4 */}
                  <div className="bg-[#f4f1ea] border border-neutral-300 shadow-lg p-8 relative">
                    <div className="absolute top-4 right-4 border-2 border-red-800 text-red-800 font-bold px-2 py-1 text-xs rotate-6 opacity-80 tracking-widest">
                      CONFIDENCIAL
                    </div>

                    <div className="border-b-2 border-neutral-800 pb-4 mb-6">
                      <p className="text-neutral-500 text-[10px] tracking-[0.3em] mb-1">PERFIL PSICOLÓGICO — AGENTE DE CAMPO</p>
                      <h2 className="text-xl font-bold text-neutral-800 tracking-widest">ANÁLISIS DE COMPORTAMIENTO</h2>
                    </div>

                    <div className="space-y-4 text-sm text-neutral-700 leading-relaxed mb-8">
                      <p>
                        MoniRapida realizo una ardua investigación en el archivo del sospechoso, allí encontro situaciones que generan alerta y deben ser identificadas.
                      </p>
                      <p>
                        Así que para poder continuar con la investigación debemos ir a su registro y terminar lo que ella inicio.
                      </p>
                      <p>
                        Nos comenta que si logramos clasificar correctamente el archivo, recibiremos un código que nos permitirá continuar con la investigación y acercarnos a la resolución del caso.
                      </p>
                    </div>

                    <div className="border-t border-neutral-300 pt-5 flex items-center justify-between">
                      <div>
                        <p className="text-neutral-500 text-[10px] tracking-widest">AGENTE DE CAMPO — CLASIFICADO</p>
                        <p className="text-neutral-400 text-[10px] tracking-widest mt-0.5">ACCESO NIVEL: ALTO</p>
                      </div>
                      <a
                        href="https://polispol.pages.dev/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-neutral-800 text-[#f4f1ea] px-6 py-2.5 text-xs tracking-[0.25em] hover:bg-neutral-700 transition-colors border border-neutral-700 shrink-0"
                      >
                        ACCEDER A LA INVESTIGACIÓN →
                      </a>
                    </div>
                  </div>
                </motion.div>
              ) : activeCase === 3 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "backOut" }}
                >
                  <Day3Game
                    state={day3State}
                    onStartRound={handleDay3StartRound}
                    onStreamerGuess={handleDay3StreamerGuess}
                    onChatWin={handleDay3ChatWin}
                    onNextRound={handleDay3NextRound}
                  />
                </motion.div>
              ) : activeCase === 2 ? (
                <div className="flex flex-col gap-6 w-full max-w-2xl">

                  {/* Pasapalabra game */}
                  <motion.div
                    initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.1, ease: "backOut" }}
                  >
                    <PasapalabraGame
                      state={pasapalabraState}
                      onInput={handlePasapalabraInput}
                      onAnswer={handlePasapalabraAnswer}
                      onPass={handlePasapalabraPass}
                      onFinish={handlePasapalabraFinish}
                    />
                  </motion.div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
                  {activeCase === 1
                    ? case2Words.map((w, i) => (
                      <motion.div key={i} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.45, delay: i * 0.08, ease: "backOut" }}>
                        <WordlePaper
                          label={w.label} word={w.word} fragment={w.fragment} rotate={w.rotate} clue={w.clue}
                          state={wordleStates[i]}
                          onInput={v => handleWordleInput(i, v)}
                          onSubmit={() => handleWordleSubmit(i)}
                        />
                      </motion.div>
                    ))
                    : evidencePapers.map((paper, index) => (
                      <motion.div key={paper.id} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.45, delay: index * 0.08, ease: "backOut" }}
                        className={`bg-[#f4f1ea] border border-neutral-300 shadow-lg p-5 flex flex-col gap-3 ${paper.rotate}`}>
                        <div className="border-b border-neutral-400 pb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-neutral-600" />
                          <span className="text-sm font-bold text-neutral-800 tracking-widest">{paper.title}</span>
                        </div>
                        {paper.image ? (
                          <img src={paper.image} alt={paper.title} className="w-full h-28 object-cover" />
                        ) : (
                          <div className="bg-neutral-200 border border-dashed border-neutral-400 flex flex-col items-center justify-center gap-1 h-28">
                            <ImageIcon className="w-6 h-6 text-neutral-400" />
                            <span className="text-neutral-400 text-xs tracking-widest">[ IMAGEN ]</span>
                          </div>
                        )}
                        <p className="text-xs text-neutral-600 leading-relaxed">{paper.text}</p>
                      </motion.div>
                    ))
                  }
                </div>
              )}

              {/* ── Sección de código ── */}
              <motion.div
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="w-full max-w-2xl border border-neutral-700 bg-neutral-800/40 p-6"
              >
                <p className="text-neutral-500 text-xs tracking-[0.25em] mb-1">RESOLUCIÓN</p>
                <div className="w-full h-px bg-neutral-700 mb-4" />

                {/* Case 1: fragment progress */}
                {activeCase === 1 && (
                  <div className="mb-5">
                    <p className="text-neutral-400 text-xs tracking-[0.1em] leading-relaxed mb-4">
                      Descifra las seis palabras para revelar el código. Cada palabra resuelta entrega un fragmento.
                    </p>
                    <div className="flex gap-3 justify-center mb-3">
                      {case2Words.map((w, i) => (
                        <div key={i}
                          className={`w-10 h-10 border-2 flex items-center justify-center text-base font-bold tracking-widest transition-colors
                            ${wordleStates[i].won ? "border-green-600 text-green-400" : "border-neutral-600 text-neutral-600"}`}>
                          {wordleStates[i].won ? w.fragment : "?"}
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-neutral-600 text-xs tracking-widest">
                      {wordleSolvedCount} DE 6 LETRAS DESCIFRADAS
                    </p>
                  </div>
                )}

                {/* Case 2: sentence reveal */}
                {activeCase === 2 && (
                  <div className="mb-5">
                    <p className="text-neutral-400 text-xs tracking-[0.1em] leading-relaxed mb-4">
                      Completa el pasapalabras para revelar la frase. Cada error oculta una letra del mensaje.
                    </p>
                    {pasapalabraState.finished && (
                      <div className="bg-neutral-900 border border-neutral-700 p-4 mb-4">
                        <p className="text-neutral-500 text-[10px] tracking-widest mb-3 text-center">MENSAJE DESCIFRADO</p>
                        <div className="flex flex-wrap justify-center gap-1">
                          {pasapalabrasDisplay.map(({ ch, key, blank }) =>
                            ch === " " ? (
                              <div key={key} className="w-3" />
                            ) : (
                              <div
                                key={key}
                                className={`w-6 h-8 flex items-end justify-center pb-0.5 border-b-2 text-sm font-bold
                                  ${blank ? "border-red-600 text-red-700" : "border-neutral-500 text-neutral-100"}`}
                              >
                                {blank ? "_" : ch}
                              </div>
                            )
                          )}
                        </div>
                        {pasapalabraIncorrectCount > 0 && (
                          <p className="text-neutral-600 text-[10px] tracking-widest mt-3 text-center">
                            {pasapalabraIncorrectCount} LETRA{pasapalabraIncorrectCount !== 1 ? "S" : ""} OCULTADA{pasapalabraIncorrectCount !== 1 ? "S" : ""}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeCase === 3 && !day3State.gameFinished && (
                  <p className="text-neutral-400 text-xs tracking-[0.1em] leading-relaxed mb-5">
                    Completa las 10 rondas para revelar el código del siguiente caso.
                  </p>
                )}

                {activeCase === 5 && !boomFinished && (
                  <p className="text-neutral-400 text-xs tracking-[0.1em] leading-relaxed mb-5">
                    Juega el Boom Party hasta que haya un ganador para revelar el código.
                  </p>
                )}

                {activeCase !== 1 && activeCase !== 2 && activeCase !== 3 && activeCase !== 5 && (
                  <p className="text-neutral-400 text-xs tracking-[0.1em] leading-relaxed mb-5">
                    Analiza las evidencias e ingresa el código descifrado para desbloquear el siguiente caso.
                  </p>
                )}

                {/* Code input */}
                {((activeCase !== 3 || day3State.gameFinished) && (activeCase !== 5 || boomFinished)) && codeStatus !== "success" ? (
                  <form onSubmit={handleCodeSubmit} className="flex gap-3">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeStatus("idle"); }}
                      disabled={activeCase === 1 && !wordleAllSolved}
                      className={`flex-1 bg-neutral-900 border border-neutral-600 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 uppercase placeholder:text-neutral-700 placeholder:normal-case placeholder:tracking-normal disabled:opacity-30 ${activeCase === 2 ? "tracking-wide" : "tracking-[0.3em]"}`}
                      placeholder={
                        activeCase === 1 && !wordleAllSolved ? "Descifra las 6 palabras primero"
                          : "Ingresa el código"
                      }
                      maxLength={activeCase === 2 ? 80 : 50}
                    />
                    <button
                      type="submit"
                      disabled={activeCase === 1 && !wordleAllSolved}
                      className="bg-neutral-700 text-neutral-200 px-5 py-2 text-xs tracking-[0.2em] hover:bg-neutral-600 transition-colors border border-neutral-600 hover:border-neutral-400 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      VERIFICAR
                    </button>
                  </form>
                ) : null}

                {codeStatus === "error" && (
                  <p className="mt-3 text-red-500 text-xs tracking-widest">✗ CÓDIGO INCORRECTO — Intenta de nuevo.</p>
                )}

                {codeStatus === "success" && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                    {allSolved ? (
                      <>
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs tracking-widest">INVESTIGACIÓN COMPLETADA — Todos los casos han sido resueltos.</span>
                        </div>
                        <button onClick={closeEvidence} className="w-full bg-neutral-700 text-neutral-200 py-2 text-xs tracking-[0.2em] hover:bg-neutral-600 transition-colors border border-neutral-600">
                          VOLVER AL ARCHIVO
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs tracking-widest">CÓDIGO CORRECTO — CASO #{activeCase + 1} DESBLOQUEADO.</span>
                        </div>
                        <button onClick={closeEvidence} className="w-full bg-neutral-700 text-neutral-200 py-2 text-xs tracking-[0.2em] hover:bg-neutral-600 transition-colors border border-neutral-600">
                          IR AL CASO #{activeCase + 1}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
