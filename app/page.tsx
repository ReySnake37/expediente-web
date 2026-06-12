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

// ─────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────

const MAX_WORDLE_GUESSES = 5;

const cases = [
  { id: 1, title: "01: El Comienzo",  code: "VOID"  },
  { id: 2, title: "02: Sombras",      code: "SRCD"  },
  { id: 3, title: "03: Metadatos",    code: "DATA"  },
  { id: 4, title: "04: La Trampa",    code: "ECHO"  },
  { id: 5, title: "05: El Testigo",   code: "KILO"  },
  { id: 6, title: "06: La Verdad",    code: "LIMA"  },
  { id: 7, title: "07: El Veredicto", code: "FINIS" },
];

// Case 2 Wordle words — each solved word reveals one fragment of "SRCD"
const case2Words = [
  { label: "EVIDENCIA 1", word: "CINEMA",   fragment: "S", rotate: "-rotate-2" },
  { label: "EVIDENCIA 2", word: "TURRENTS", fragment: "R", rotate: "rotate-1"  },
  { label: "EVIDENCIA 3", word: "AVATAR",   fragment: "C", rotate: "rotate-2"  },
  { label: "EVIDENCIA 4", word: "DIRECT",   fragment: "D", rotate: "-rotate-1" },
];

// Default evidence papers (cases other than 2)
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
// Wordle helpers
// ─────────────────────────────────────────────────────────────────

function getLetterStates(guess: string, target: string): ("correct" | "present" | "absent")[] {
  const result: ("correct" | "present" | "absent")[] = Array(guess.length).fill("absent");
  const targetUsed = Array(target.length).fill(false);

  // First pass — correct positions
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      targetUsed[i] = true;
    }
  }
  // Second pass — present (wrong position)
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < target.length; j++) {
      if (!targetUsed[j] && guess[i] === target[j]) {
        result[i] = "present";
        targetUsed[j] = true;
        break;
      }
    }
  }
  return result;
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
      {/* Header */}
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

      {/* Grid */}
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

      {/* Input / result */}
      {!state.won && !state.lost ? (
        <form
          onSubmit={e => { e.preventDefault(); onSubmit(); }}
          className="flex gap-2 mt-1"
        >
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

  // ── Wordle state for case 2 (persists across navigation) ──
  const [wordleStates, setWordleStates] = useState<WordleState[]>(() =>
    case2Words.map(() => ({ guesses: [], currentInput: "", won: false, lost: false }))
  );

  // ── Derived ──
  const allSolved    = unlockedUpTo > cases.length;
  const orderedCases = [
    ...cases.filter(c => c.id === unlockedUpTo),
    ...cases.filter(c => c.id < unlockedUpTo).reverse(),
    ...cases.filter(c => c.id > unlockedUpTo),
  ];

  const wordle2Fragments  = case2Words.map((w, i) => (wordleStates[i].won ? w.fragment : null));
  const wordle2SolvedCount = wordle2Fragments.filter(Boolean).length;
  const wordle2AllSolved   = wordle2SolvedCount === case2Words.length;

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
    if (codeInput.trim().toUpperCase() === current.code) {
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

              {/* Evidence papers — Wordle for case 2, standard for others */}
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

              {/* ── Sección de código ── */}
              <motion.div
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="w-full max-w-2xl border border-neutral-700 bg-neutral-800/40 p-6"
              >
                <p className="text-neutral-500 text-xs tracking-[0.25em] mb-1">RESOLUCIÓN</p>
                <div className="w-full h-px bg-neutral-700 mb-4" />

                {/* Case 2: show fragment progress */}
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

                {activeCase !== 2 && (
                  <p className="text-neutral-400 text-xs tracking-[0.1em] leading-relaxed mb-5">
                    Analiza las evidencias e ingresa el código descifrado para desbloquear el siguiente caso.
                  </p>
                )}

                {/* Code input — for case 2, only enabled when all Wordles solved */}
                {codeStatus !== "success" ? (
                  <form onSubmit={handleCodeSubmit} className="flex gap-3">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeStatus("idle"); }}
                      disabled={activeCase === 2 && !wordle2AllSolved}
                      className="flex-1 bg-neutral-900 border border-neutral-600 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-400 tracking-[0.3em] uppercase placeholder:text-neutral-700 placeholder:normal-case placeholder:tracking-normal disabled:opacity-30"
                      placeholder={activeCase === 2 && !wordle2AllSolved ? "Descifra las 4 palabras primero" : "Ingresa el código"}
                      maxLength={20}
                    />
                    <button type="submit"
                      disabled={activeCase === 2 && !wordle2AllSolved}
                      className="bg-neutral-700 text-neutral-200 px-5 py-2 text-xs tracking-[0.2em] hover:bg-neutral-600 transition-colors border border-neutral-600 hover:border-neutral-400 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed">
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
