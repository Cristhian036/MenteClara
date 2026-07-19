import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  User,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  BrainCircuit,
  Moon,
  Sun,
  Activity,
  ArrowRight,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import {
  loginWithGoogle,
  registerWithEmail,
  loginWithEmail
} from '../lib/auth.ts';

interface FullScreenAuthProps {
  isNightMode: boolean;
  onToggleTheme: () => void;
}

export default function FullScreenAuth({
  isNightMode,
  onToggleTheme
}: FullScreenAuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
      setSuccessMsg('¡Sesión iniciada con éxito! Bienvenido a MenteClara 🌸');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setError('firebase-auth-disabled');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico es inválido.');
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerWithEmail(email, password, name);
      setSuccessMsg('¡Cuenta creada correctamente! Sincronizando tu espacio... ✨');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setError('firebase-auth-disabled');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico es inválido.');
      } else {
        setError('No pudimos crear tu cuenta en este momento.');
      }
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      setSuccessMsg('¡Sincronizado con Google! Redirigiendo... 🚀');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setError('firebase-google-disabled');
      } else {
        setError('No se pudo conectar con Google.');
      }
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col md:flex-row transition-colors duration-500 font-sans ${
      isNightMode ? 'bg-[#0f141c] text-slate-100' : 'bg-[#F8F5F1] text-neutral-800'
    }`}>
      
      {/* Theme Toggle (floating top-right) */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={onToggleTheme}
          className={`p-3 rounded-full border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs ${
            isNightMode
              ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-850'
              : 'bg-white border-neutral-200 text-[#00897B] hover:bg-neutral-50'
          }`}
          title={isNightMode ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {isNightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Authentication Form Left/Top Pane */}
      <div className={`flex-1 flex items-center justify-center p-6 md:p-12 relative border-b md:border-b-0 md:border-r transition-colors duration-500 ${
        isNightMode ? 'border-slate-900/60' : 'border-neutral-200/40'
      }`}>
        <div className="w-full max-w-sm space-y-6">
          
          {/* Header Logo */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-dashed border-slate-500/10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs ${
              isNightMode ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' : 'bg-[#00897B]/10 text-[#00897B] border border-[#00897B]/10'
            }`}>
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className={`font-serif font-bold text-base tracking-wide italic block leading-none ${isNightMode ? 'text-slate-100' : 'text-neutral-800'}`}>MenteClara</span>
              <span className="text-[9px] text-slate-400 font-mono tracking-widest font-bold uppercase">Espacio de Enfoque</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className={`font-serif text-2xl font-bold italic ${
              isNightMode ? 'text-slate-100' : 'text-neutral-800'
            }`}>
              {activeTab === 'login' ? 'Bienvenido de vuelta' : 'Crea tu espacio'}
            </h2>
            <p className="text-xs text-slate-400">
              {activeTab === 'login' 
                ? 'Accede para sincronizar tus pendientes y estadísticas de estudio.' 
                : 'Regístrate gratis para comenzar a gestionar tu ansiedad académica.'}
            </p>
          </div>

          {/* Form Tabs */}
          <div className={`flex p-1 rounded-xl border transition-colors ${
            isNightMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-neutral-100 border-neutral-200'
          }`}>
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'login'
                  ? isNightMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-neutral-800 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'register'
                  ? isNightMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-neutral-800 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Error and Success Banners */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="w-full text-left"
              >
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center leading-normal">
                  {error}
                </div>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`p-3.5 rounded-xl border text-xs text-center leading-normal ${
                  isNightMode
                    ? 'bg-teal-500/10 border-teal-500/20 text-teal-300'
                    : 'bg-[#00897B]/10 border-[#00897B]/20 text-[#00897B]'
                }`}
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Form */}
          <form onSubmit={activeTab === 'login' ? handleEmailLogin : handleEmailRegister} className="space-y-4">
            
            {activeTab === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cristhian Huaracha"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                      isNightMode
                        ? 'bg-slate-950/40 border-slate-800 focus:border-teal-500/50 text-slate-200'
                        : 'bg-neutral-50 border-neutral-200 focus:border-[#00897B]/40 text-neutral-800'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="estudiante@universidad.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                    isNightMode
                      ? 'bg-slate-950/40 border-slate-800 focus:border-teal-500/50 text-slate-200'
                      : 'bg-neutral-50 border-neutral-200 focus:border-[#00897B]/40 text-neutral-800'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                    isNightMode
                      ? 'bg-slate-950/40 border-slate-800 focus:border-teal-500/50 text-slate-200'
                      : 'bg-neutral-50 border-neutral-200 focus:border-[#00897B]/40 text-neutral-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                isNightMode
                  ? 'bg-teal-500 hover:bg-teal-600 text-slate-950'
                  : 'bg-[#00897B] hover:bg-[#00796B] text-white'
              } disabled:opacity-60`}
            >
              {loading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <div className="flex items-center gap-1">
                  <span>{activeTab === 'login' ? 'Iniciar Sesión' : 'Registrar Cuenta'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className={`h-px flex-1 ${isNightMode ? 'bg-slate-800' : 'bg-neutral-200'}`} />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">O con un solo clic</span>
            <div className={`h-px flex-1 ${isNightMode ? 'bg-slate-800' : 'bg-neutral-200'}`} />
          </div>

          {/* Google SSO */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className={`w-full py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isNightMode
                ? 'bg-slate-950/30 border-slate-800 hover:bg-slate-850 text-slate-300'
                : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
            <span>Sincronizar con Google</span>
          </button>
        </div>
      </div>

      {/* Brand & Concept Right/Bottom Pane */}
      <div className={`flex-1 flex flex-col justify-center p-8 md:p-16 transition-colors duration-500 ${
        isNightMode ? 'bg-slate-950/20 text-slate-100' : 'bg-[#fcfaf7] text-neutral-800'
      }`}>

        {/* Content & Aesthetic Description */}
        <div className="max-w-lg space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`font-serif text-3xl md:text-5xl italic leading-tight ${
              isNightMode ? 'text-slate-100' : 'text-[#2D3436]'
            }`}
          >
            Disuelve la parálisis por análisis, <span className="opacity-70">recupera tu enfoque.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className={`text-xs md:text-sm leading-relaxed ${
              isNightMode ? 'text-slate-400' : 'text-neutral-600'
            }`}
          >
            MenteClara es una herramienta diseñada con principios de Interacción Humano-Computadora y Psicología Cognitiva. Te ayudamos a superar la procrastinación dividiendo tareas complejas mediante bloques de micro-enfoque adaptativos, temporizadores generosos y respiración guiada.
          </motion.p>

          {/* Core Applet Features bullet list */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold font-mono text-[10px] mt-0.5 ${
                isNightMode ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-[#00897B]/10 text-[#00897B] border border-[#00897B]/10'
              }`}>01</span>
              <div>
                <p className="font-bold">Heurísticas de Ansiedad</p>
                <p className="text-[10px] text-slate-400">Consejos de tutor inteligente para disolver fricción.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold font-mono text-[10px] mt-0.5 ${
                isNightMode ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-[#00897B]/10 text-[#00897B] border border-[#00897B]/10'
              }`}>02</span>
              <div>
                <p className="font-bold">Focus Vortex Central</p>
                <p className="text-[10px] text-slate-400">Visualiza y arrastra para concentrarte al instante.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold font-mono text-[10px] mt-0.5 ${
                isNightMode ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-[#00897B]/10 text-[#00897B] border border-[#00897B]/10'
              }`}>03</span>
              <div>
                <p className="font-bold">Desconexión Activa</p>
                <p className="text-[10px] text-slate-400">Micro-sesiones de respiración diafragmática zen.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold font-mono text-[10px] mt-0.5 ${
                isNightMode ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-[#00897B]/10 text-[#00897B] border border-[#00897B]/10'
              }`}>04</span>
              <div>
                <p className="font-bold">Sincronización Total</p>
                <p className="text-[10px] text-slate-400">Guarda tus estadísticas de estudio y progreso seguro.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-6">
          <Activity className="w-3.5 h-3.5 animate-pulse text-[#00897B]" />
          <span>CIENCIA COGNITIVA & REGULACIÓN EMOCIONAL</span>
        </div>
      </div>

    </div>
  );
}
