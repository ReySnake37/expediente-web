"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, FileText, Shield } from "lucide-react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const puzzles = [
    { id: 1, title: "01: El Comienzo", status: "unlocked", code: "VOID" },
    { id: 2, title: "02: Sombras", status: "locked", code: null },
    { id: 3, title: "03: Metadatos", status: "locked", code: null },
  ];

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Credenciales inválidas.");
      return;
    }
    // TODO: conectar con backend real
    setIsLoggedIn(true);
    setError("");
  }

  return (
    <div className="min-h-screen bg-neutral-900 font-mono selection:bg-red-900 selection:text-white flex flex-col md:flex-row overflow-hidden">

      {/* ─── PANEL IZQUIERDO: Login ─── */}
      <AnimatePresence initial={false}>
        {!isLoggedIn && (
          <motion.div
            key="login-panel"
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full md:w-1/2 shrink-0 relative flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-neutral-800 overflow-hidden"
          >
            {/* Luz ambiental */}
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-sm">
              {/* Encabezado */}
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-red-700" />
                  <span className="text-red-700 tracking-[0.3em] text-xs font-bold">ACCESO RESTRINGIDO</span>
                  <Shield className="w-4 h-4 text-red-700" />
                </div>
                <h1 className="text-neutral-200 text-3xl font-bold tracking-[0.4em]">POLISPOL</h1>
                <div className="w-full h-px bg-neutral-700 mt-4" />
              </div>

              {/* Formulario */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-neutral-500 text-xs tracking-[0.2em] mb-1">
                    AGENTE
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 tracking-wider placeholder:text-neutral-600"
                    placeholder="ID de agente"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 text-xs tracking-[0.2em] mb-1">
                    CLAVE DE ACCESO
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 tracking-wider placeholder:text-neutral-600"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-xs tracking-widest">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-neutral-800 text-neutral-200 py-2 tracking-[0.2em] text-sm hover:bg-neutral-700 transition-colors border border-neutral-700 hover:border-neutral-500"
                >
                  INGRESAR
                </button>
              </form>

              <p className="mt-8 text-center text-neutral-700 text-xs tracking-[0.2em]">
                NIVEL DE CLASIFICACIÓN: ALTO
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PANEL DERECHO: Carpeta ─── */}
      <motion.div
        layout
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden"
      >
        {/* Luz de lámpara */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Carpeta */}
        <div
          className="relative w-[340px] h-[420px] cursor-pointer perspective-[1200px]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Parte trasera y pestaña */}
          <div className="absolute inset-0 bg-[#c29b62] rounded-b-lg rounded-tr-lg shadow-2xl border border-[#a68250]">
            <div className="absolute -top-10 left-0 w-40 h-10 bg-[#c29b62] rounded-t-lg border-t border-l border-r border-[#a68250] flex items-center px-4">
              <span className="text-neutral-900 font-bold tracking-widest text-sm opacity-60">
                EXPEDIENTE
              </span>
            </div>
            <div className="absolute top-4 right-4 border-2 border-red-800 text-red-800 font-bold px-2 py-1 transform rotate-12 opacity-80">
              CONFIDENCIAL
            </div>
          </div>

          {/* Hojas de puzzles */}
          <div className="absolute inset-0 p-4">
            {puzzles.map((puzzle, index) => {
              const locked = !isLoggedIn || puzzle.status === "locked";
              return (
                <motion.div
                  key={puzzle.id}
                  initial={false}
                  animate={{
                    y: isOpen ? -80 - index * 20 : 0,
                    scale: isOpen ? 1 : 0.95,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: isOpen ? index * 0.1 : 0,
                    ease: "backOut",
                  }}
                  className="absolute top-4 left-4 right-4 bottom-4 bg-[#f4f1ea] rounded shadow-md border border-neutral-300 p-6 flex flex-col"
                  style={{ zIndex: 10 - index }}
                >
                  <div className="border-b-2 border-neutral-800 pb-2 mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Caso #{puzzle.id}
                    </h2>
                    {locked ? (
                      <Lock className="w-5 h-5 text-neutral-500" />
                    ) : (
                      <span className="text-green-700 font-bold text-sm">ACTIVO</span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-neutral-700 mb-2">{puzzle.title}</h3>

                  {locked ? (
                    <div className="mt-auto bg-neutral-200 p-3 text-center text-neutral-500 text-sm border border-neutral-300 border-dashed">
                      CONTENIDO RESTRINGIDO.<br />Autorización pendiente.
                    </div>
                  ) : (
                    <div className="mt-auto">
                      <p className="text-sm text-neutral-600 mb-4 line-clamp-3">
                        El aniversario del canal se acerca, y con él, la revelación de un nuevo misterio. En este caso, el expediente #01: &quot;El Comienzo&quot; nos sumerge en los orígenes de la investigación, donde se descubren pistas cruciales que podrían cambiarlo todo.
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); alert(`Abriendo ${puzzle.title}...`); }}
                        className="w-full bg-neutral-800 text-[#f4f1ea] py-2 hover:bg-neutral-700 transition-colors"
                      >
                        INSPECCIONAR EVIDENCIA
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Portada (rota en 3D al abrir) */}
          <motion.div
            initial={false}
            animate={{
              rotateX: isOpen ? -110 : 0,
              y: isOpen ? 40 : 0,
              opacity: isOpen ? 0 : 1,
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ transformOrigin: "bottom" }}
            className="absolute inset-0 bg-[#d4a86a] rounded-b-lg rounded-tr-lg shadow-inner border border-[#b88f56] z-20 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="w-3/4 h-1/2 border-4 border-[#b88f56]/50 rounded flex items-center justify-center">
              <div className="text-red-800 font-bold text-4xl uppercase tracking-[0.2em] -rotate-45">
                POLISPOL
              </div>
            </div>
          </motion.div>
        </div>

        <motion.p
          animate={{ opacity: isOpen ? 0 : 1 }}
          className="absolute bottom-10 text-neutral-500 tracking-widest text-sm"
        >
          [ CLICK PARA ABRIR EXPEDIENTE ]
        </motion.p>
      </motion.div>
    </div>
  );
}
