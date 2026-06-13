"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, FileText, Shield, ArrowLeft, ImageIcon, CheckCircle2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type LoginView  = "login" | "register" | "forgot";
type CodeStatus = "idle" | "error" | "success";

type WordleState = {
  guesses:      string[];
  currentInput: string;
  won:          boolean;
  lost:         boolean;
};

type LetterStatus = "pending" | "correct" | "incorrect";

type PasapalabraState = {
  letterStates: LetterStatus[];
  currentIdx:   number;
  currentInput: string;
  finished:     boolean;
};

// ─────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────

const MAX_WORDLE_GUESSES = 5;

const cases = [
  { id: 1, title: "01: El Comienzo",  code: "VOID"                    },
  { id: 2, title: "02: Sombras",      code: "SRCD"                    },
  { id: 3, title: "03: Metadatos",    code: "SER BUENOS Y SI SON MALOS VIENEN AL CHAT O AL DS Y ME LO CUENTAN" },
  { id: 4, title: "04: La Trampa",    code: "ECHO"                    },
  { id: 5, title: "05: El Testigo",   code: "KILO"                    },
  { id: 6, title: "06: La Verdad",    code: "LIMA"                    },
  { id: 7, title: "07: El Veredicto", code: "FINIS"                   },
];

const case2Words = [
  { label: "EVIDENCIA 1", word: "CINEMA",   fragment: "S", rotate: "-rotate-2" },
  { label: "EVIDENCIA 2", word: "TURRENTS", fragment: "R", rotate: "rotate-1"  },
  { label: "EVIDENCIA 3", word: "AVATAR",   fragment: "C", rotate: "rotate-2"  },
  { label: "EVIDENCIA 4", word: "DIRECTO",  fragment: "D", rotate: "-rotate-1" },
];

const CASE3_SENTENCE = "SER BUENOS Y SI SON MALOS VIENEN AL CHAT O AL DS Y ME LO CUENTAN";

const case3Clues = [
  { letter: "A", clue: "Lugar donde se guardan documentos clasificados",            answer: "A"     },
  { letter: "B", clue: "Registro cronológico de los eventos de una investigación",  answer: "B"    },
  { letter: "C", clue: "Persona responsable de cometer el delito",                  answer: "C"    },
  { letter: "D", clue: "Información recopilada para sostener una acusación",        answer: "D"       },
  { letter: "E", clue: "Prueba material que sustenta un caso judicial",              answer: "E"   },
  { letter: "F", clue: "Registro con los datos personales de un sospechoso",        answer: "F"       },
  { letter: "G", clue: "Persona encargada de la vigilancia de un lugar",            answer: "G"     },
  { letter: "H", clue: "Crimen que investiga la muerte de una persona",             answer: "H"   },
  { letter: "I", clue: "Proceso sistemático para descubrir la verdad",              answer: "I"},
  { letter: "J", clue: "Autoridad que dicta sentencia en un juicio",                answer: "J"        },
  { letter: "K", clue: "Unidad de almacenamiento digital de información",           answer: "K"    },
  { letter: "L", clue: "Norma establecida que regula la convivencia en sociedad",   answer: "L"         },
  { letter: "M", clue: "Razón que impulsa a alguien a cometer un delito",          answer: "M"      },
  { letter: "N", clue: "Lista oficial de personas registradas o vigiladas",         answer: "N"      },
  { letter: "Ñ", clue: "Ave corredora sudamericana similar al avestruz",            answer: "Ñ"       },
  { letter: "O", clue: "Meta principal que se persigue en una investigación",       answer: "O"    },
  { letter: "P", clue: "Señal o indicio que orienta la investigación",              answer: "P"       },
  { letter: "Q", clue: "Denuncia formal presentada ante un tribunal",               answer: "Q"    },
  { letter: "R", clue: "Moderador que llego a alegrar esta hermosa comunidad",        answer: "R" },
  { letter: "S", clue: "Persona sobre quien recaen sospechas de un delito",        answer: "S"  },
  { letter: "T", clue: "Persona que presenció un hecho y puede declararlo",        answer: "T"     },
  { letter: "U", clue: "Grupo especializado de agentes en una operación",           answer: "U"      },
  { letter: "V", clue: "Persona que sufrió las consecuencias de un delito",        answer: "V"     },
  { letter: "W", clue: "Red global de información e intercambio digital",           answer: "W"         },
  { letter: "X", clue: "Técnica que permite reproducir fielmente un documento",    answer: "X"   },
  { letter: "Y", clue: "Sustancia química utilizada en la detección de huellas",   answer: "Y"        },
  { letter: "Z", clue: "Área delimitada donde se realiza una búsqueda policial",   answer: "Z"        },
];

const evidencePapers = [
  { id: 1, title: "EVIDENCIA 1", rotate: "-rotate-2",
    text: "Fotografía tomada en la escena. Los detalles capturados pueden ser cruciales para resolver el caso.",
    image: "evidencia1.jpg" },
  { id: 2, title: "EVIDENCIA 2", rotate: "rotate-1",
    text: "Documento hallado entre los archivos. Contiene información relevante aún pendiente de descifrar.",
    image: "evidencia2.jpg" },
  { id: 3, title: "EVIDENCIA 3", rotate: "rotate-2",
    text: "Registro visual del incidente. Se recomienda analizar con detenimiento cada elemento capturado.",
    image: "evidencia3.jpg" },
  { id: 4, title: "EVIDENCIA 4", rotate: "-rotate-1",
    text: "Material recopilado por el equipo de campo. Pendiente de verificación y cotejo con otros indicios.",
    image: "evidencia4.jpg" },
];

const slideVariants = {
  enter:  { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0  },
  exit:   { opacity: 0, y: -8 },
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
const CASE3_BLANK_ORDER = seededShuffle(
  Array.from(
    { length: CASE3_SENTENCE.split("").filter(c => c !== " ").length },
    (_, i) => i
  ),
  CASE3_SENTENCE
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

const CIRCLE_SIZE   = 280;
const CIRCLE_CENTER = CIRCLE_SIZE / 2;
const CIRCLE_RADIUS = 112;
const LETTER_BOX    = 26;

function PasapalabraGame({
  state, onInput, onAnswer, onPass, onFinish,
}: {
  state:    PasapalabraState;
  onInput:  (v: string) => void;
  onAnswer: () => void;
  onPass:   () => void;
  onFinish: () => void;
}) {
  const currentClue    = !state.finished && state.currentIdx >= 0 ? case3Clues[state.currentIdx] : null;
  const correctCount   = state.letterStates.filter(s => s === "correct").length;
  const incorrectCount = state.letterStates.filter(s => s === "incorrect").length;
  const pendingCount   = state.letterStates.filter(s => s === "pending").length;

  return (
    <div className="bg-[#f4f1ea] border border-neutral-300 shadow-lg p-4 flex flex-col gap-4">
      <div className="border-b border-neutral-400 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-600" />
          <span className="text-xs font-bold text-neutral-800 tracking-widest">ROSCO — ABECEDARIO</span>
        </div>
        {!state.finished && (
          <span className="text-xs text-neutral-600 tracking-widest">{pendingCount} pendientes</span>
        )}
      </div>

      {/* Circle */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
          {case3Clues.map((clue, i) => {
            const angle     = -Math.PI / 2 + (i / case3Clues.length) * 2 * Math.PI;
            const x         = CIRCLE_CENTER + CIRCLE_RADIUS * Math.cos(angle) - LETTER_BOX / 2;
            const y         = CIRCLE_CENTER + CIRCLE_RADIUS * Math.sin(angle) - LETTER_BOX / 2;
            const status    = state.letterStates[i];
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
            ? "¡Rosco completado! Frase revelada íntegramente."
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
// WordlePaper component (state is lifted to Home to persist navigation)
// ─────────────────────────────────────────────────────────────────

function WordlePaper({
  label, word, fragment, rotate, state, onInput, onSubmit,
}: {
  label: string; word: string; fragment: string; rotate: string;
  state: WordleState;
  onInput:  (v: string) => void;
  onSubmit: () => void;
}) {
  const CELL = 28;
  const GAP  = 2;

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

      <div className="flex flex-col" style={{ gap: GAP }}>
        {Array.from({ length: MAX_WORDLE_GUESSES }).map((_, rowIdx) => {
          const submitted = state.guesses[rowIdx];
          const isActive  = rowIdx === state.guesses.length && !state.won && !state.lost;
          const letters   = submitted
            ? submitted.split("")
            : isActive
              ? Array.from({ length: word.length }, (_, i) => state.currentInput[i] ?? "")
              : Array(word.length).fill("");
          const states = submitted ? getLetterStates(submitted, word) : null;

          return (
            <div key={rowIdx} className="flex" style={{ gap: GAP }}>
              {Array.from({ length: word.length }).map((_, colIdx) => {
                const letter = letters[colIdx] ?? "";
                const st     = states?.[colIdx];
                return (
                  <div
                    key={colIdx}
                    style={{ width: CELL, height: CELL }}
                    className={`flex items-center justify-center text-[10px] font-bold border select-none
                      ${st === "correct" ? "bg-green-600  border-green-600  text-white"
                      : st === "present" ? "bg-yellow-500 border-yellow-500 text-white"
                      : st === "absent"  ? "bg-neutral-500 border-neutral-500 text-white"
                      : letter           ? "border-neutral-500 text-neutral-800"
                      :                    "border-neutral-300"}`}
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
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);
  const [loginView,   setLoginView]   = useState<LoginView>("login");
  const [username,    setUsername]    = useState("");
  const [password,    setPassword]    = useState("");
  const [regEmail,    setRegEmail]    = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent,  setForgotSent]  = useState(false);
  const [authError,   setAuthError]   = useState("");

  // ── Folder ──
  const [isOpen,       setIsOpen]       = useState(false);
  const [unlockedUpTo, setUnlockedUpTo] = useState(1);

  // ── Evidence / code ──
  const [activeCase,  setActiveCase]  = useState<number | null>(null);
  const [codeInput,   setCodeInput]   = useState("");
  const [codeStatus,  setCodeStatus]  = useState<CodeStatus>("idle");

  // ── Wordle state for case 2 ──
  const [wordleStates, setWordleStates] = useState<WordleState[]>(() =>
    case2Words.map(() => ({ guesses: [], currentInput: "", won: false, lost: false }))
  );

  // ── Pasapalabra state for case 3 ──
  const [pasapalabraState, setPasapalabraState] = useState<PasapalabraState>(() => ({
    letterStates: case3Clues.map(() => "pending" as LetterStatus),
    currentIdx:   0,
    currentInput: "",
    finished:     false,
  }));

  // ── Derived ──
  const allSolved    = unlockedUpTo > cases.length;
  const orderedCases = [
    ...cases.filter(c => c.id === unlockedUpTo),
    ...cases.filter(c => c.id < unlockedUpTo).reverse(),
    ...cases.filter(c => c.id > unlockedUpTo),
  ];

  const wordle2Fragments   = case2Words.map((w, i) => (wordleStates[i].won ? w.fragment : null));
  const wordle2SolvedCount = wordle2Fragments.filter(Boolean).length;
  const wordle2AllSolved   = wordle2SolvedCount === case2Words.length;

  const case3IncorrectCount = pasapalabraState.letterStates.filter(s => s === "incorrect").length;

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
    const ws     = wordleStates[index];
    const target = case2Words[index].word.toUpperCase();
    const guess  = ws.currentInput.toUpperCase();
    if (guess.length !== target.length || ws.won || ws.lost) return;
    const newGuesses = [...ws.guesses, guess];
    const won  = guess === target;
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
    const clue    = case3Clues[ps.currentIdx];
    const correct = normalizeAnswer(ps.currentInput) === normalizeAnswer(clue.answer);
    const newStates = [...ps.letterStates] as LetterStatus[];
    newStates[ps.currentIdx] = correct ? "correct" : "incorrect";
    const nextIdx  = getNextPendingIdx(newStates, ps.currentIdx);
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

  // ── Sentence display for case 3 code section ──
  const case3SentenceDisplay = (() => {
    const blankedSet = new Set(CASE3_BLANK_ORDER.slice(0, case3IncorrectCount));
    let nonSpaceIdx = 0;
    return CASE3_SENTENCE.split("").map((ch, i) => {
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
                        className={`flex-1 py-2 text-xs tracking-[0.2em] transition-colors border-b-2 -mb-px ${
                          loginView === tab ? "text-neutral-200 border-neutral-400" : "text-neutral-600 border-transparent hover:text-neutral-400"
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

          {/* ── Vista: Carpeta ── */}
          {activeCase === null && (
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
                    const isActive   = c.id === unlockedUpTo && !allSolved;
                    const isSolved   = c.id < unlockedUpTo;
                    const isLocked   = c.id > unlockedUpTo;
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
                          {isLocked  && <Lock className="w-5 h-5 text-neutral-500" />}
                          {isSolved  && <span className="text-blue-700  font-bold text-sm">RESUELTO</span>}
                          {isActive  && <span className="text-green-700 font-bold text-sm">ACTIVO</span>}
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
                            <p className="text-sm text-neutral-600 mb-4 line-clamp-3">
                              {c.id === 2
                                ? "Cuatro palabras ocultas. Cada una guarda un fragmento del código. Descífralas todas para avanzar."
                                : c.id === 3
                                  ? "Un rosco de 27 letras aguarda. Completa el abecedario y descifra la frase para continuar."
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
              {activeCase === 3 ? (
                <div className="flex flex-col gap-6 w-full max-w-2xl">
                  {/* Single evidence paper */}
                  <motion.div
                    initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.45, ease: "backOut" }}
                    className="bg-[#f4f1ea] border border-neutral-300 shadow-lg p-5 flex flex-col gap-3"
                  >
                    <div className="border-b border-neutral-400 pb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-neutral-600" />
                      <span className="text-sm font-bold text-neutral-800 tracking-widest">EVIDENCIA 1</span>
                    </div>
                    <div className="bg-neutral-200 border border-dashed border-neutral-400 flex flex-col items-center justify-center gap-1 h-28">
                      <ImageIcon className="w-6 h-6 text-neutral-400" />
                      <span className="text-neutral-400 text-xs tracking-widest">[ IMAGEN ]</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Los metadatos del archivo revelan patrones ocultos. Completa el rosco de 27 letras del abecedario para descifrar el mensaje. Cada respuesta incorrecta ocultará una letra de la frase final.
                    </p>
                  </motion.div>

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
                <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                  {activeCase === 2
                    ? case2Words.map((w, i) => (
                        <motion.div key={i} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.45, delay: i * 0.08, ease: "backOut" }}>
                          <WordlePaper
                            label={w.label} word={w.word} fragment={w.fragment} rotate={w.rotate}
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

                {/* Case 2: fragment progress */}
                {activeCase === 2 && (
                  <div className="mb-5">
                    <p className="text-neutral-400 text-xs tracking-[0.1em] leading-relaxed mb-4">
                      Descifra las cuatro palabras para revelar el código. Cada palabra resuelta entrega un fragmento.
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
                      {wordle2SolvedCount} DE 4 PALABRAS DESCIFRADAS
                    </p>
                  </div>
                )}

                {/* Case 3: sentence reveal */}
                {activeCase === 3 && (
                  <div className="mb-5">
                    <p className="text-neutral-400 text-xs tracking-[0.1em] leading-relaxed mb-4">
                      Completa el rosco para revelar la frase. Cada error oculta una letra del mensaje.
                    </p>
                    {pasapalabraState.finished && (
                      <div className="bg-neutral-900 border border-neutral-700 p-4 mb-4">
                        <p className="text-neutral-500 text-[10px] tracking-widest mb-3 text-center">MENSAJE DESCIFRADO</p>
                        <div className="flex flex-wrap justify-center gap-1">
                          {case3SentenceDisplay.map(({ ch, key, blank }) =>
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
                        {case3IncorrectCount > 0 && (
                          <p className="text-neutral-600 text-[10px] tracking-widest mt-3 text-center">
                            {case3IncorrectCount} LETRA{case3IncorrectCount !== 1 ? "S" : ""} OCULTADA{case3IncorrectCount !== 1 ? "S" : ""}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeCase !== 2 && activeCase !== 3 && (
                  <p className="text-neutral-400 text-xs tracking-[0.1em] leading-relaxed mb-5">
                    Analiza las evidencias e ingresa el código descifrado para desbloquear el siguiente caso.
                  </p>
                )}

                {/* Code input */}
                {codeStatus !== "success" ? (
                  <form onSubmit={handleCodeSubmit} className="flex gap-3">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeStatus("idle"); }}
                      disabled={activeCase === 2 && !wordle2AllSolved}
                      className={`flex-1 bg-neutral-900 border border-neutral-600 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 uppercase placeholder:text-neutral-700 placeholder:normal-case placeholder:tracking-normal disabled:opacity-30 ${activeCase === 3 ? "tracking-wide" : "tracking-[0.3em]"}`}
                      placeholder={
                        activeCase === 2 && !wordle2AllSolved ? "Descifra las 4 palabras primero"
                        : "Ingresa el código"
                      }
                      maxLength={activeCase === 3 ? 80 : 20}
                    />
                    <button
                      type="submit"
                      disabled={activeCase === 2 && !wordle2AllSolved}
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
