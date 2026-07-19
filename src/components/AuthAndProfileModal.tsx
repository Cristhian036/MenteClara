import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  Lock,
  LogOut,
  Sparkles,
  X,
  Eye,
  EyeOff,
  UserCheck,
  Loader2,
  Settings,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import {
  auth,
  loginWithGoogle,
  registerWithEmail,
  loginWithEmail,
  updateUserProfile,
  signOut,
  User as FirebaseUser
} from '../lib/auth.ts';

interface AuthAndProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  isNightMode: boolean;
  onProfileUpdated?: () => void;
}

// Avatares simplificados sin selección manual

export default function AuthAndProfileModal({
  isOpen,
  onClose,
  currentUser,
  isNightMode,
  onProfileUpdated
}: AuthAndProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile configuration states
  const [profileName, setProfileName] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  // Set initial state values when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.displayName || '');
      setProfilePhotoUrl(currentUser.photoURL || '');
    }
  }, [currentUser]);

  if (!isOpen) return null;

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
      setSuccessMsg('¡Sesión iniciada con éxito! 🌸');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
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
    } finally {
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
      setSuccessMsg('¡Cuenta creada correctamente! Sincronizando... ✨');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
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
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      setSuccessMsg('¡Sincronizado con Google! 🚀');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setError('firebase-google-disabled');
      } else {
        setError('No se pudo conectar con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateUserProfile(profileName, profilePhotoUrl);
      setSuccessMsg('¡Perfil actualizado con éxito! 🌸');
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => {
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError('No se pudo actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      setSuccessMsg('Sesión cerrada.');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('Error al cerrar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-500 ${
          isNightMode
            ? 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-slate-950/50'
            : 'bg-white/95 border-neutral-200 text-neutral-800 shadow-neutral-300/40'
        }`}
      >
        {/* Header */}
        <div className={`p-5 flex justify-between items-center border-b ${
          isNightMode ? 'border-slate-800/60' : 'border-neutral-200/60'
        }`}>
          <div className="flex items-center gap-2">
            <Settings className={`w-4 h-4 ${isNightMode ? 'text-teal-400' : 'text-[#00897B]'}`} />
            <h2 className="font-serif font-bold text-lg italic">
              {currentUser ? 'Tu Perfil MenteClara' : 'Sincronizar Espacio'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full hover:scale-105 transition-all cursor-pointer ${
              isNightMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-neutral-100 text-neutral-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full"
            >
              <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs px-5 py-3 text-center">
                {error}
              </div>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`text-xs px-5 py-3 text-center border-b ${
                isNightMode
                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-300'
                  : 'bg-[#00897B]/10 border-[#00897B]/20 text-[#00897B]'
              }`}
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
          {!currentUser ? (
            /* ================= SIGNED OUT VIEW (LOGIN / REGISTER) ================= */
            <div className="space-y-5">
              {/* Tabs */}
              <div className={`flex p-1 rounded-xl border ${
                isNightMode ? 'bg-slate-950/40 border-slate-800' : 'bg-neutral-100 border-neutral-200'
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

              {/* Form */}
              <form onSubmit={activeTab === 'login' ? handleEmailLogin : handleEmailRegister} className="space-y-4">
                {activeTab === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : activeTab === 'login' ? (
                    'Iniciar Sesión'
                  ) : (
                    'Crear Cuenta Estudiantil'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className={`h-px flex-1 ${isNightMode ? 'bg-slate-800' : 'bg-neutral-200'}`} />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">O regístrate con</span>
                <div className={`h-px flex-1 ${isNightMode ? 'bg-slate-800' : 'bg-neutral-200'}`} />
              </div>

              {/* Google Button */}
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
                <span>Iniciar con Google</span>
              </button>
            </div>
          ) : (
            /* ================= SIGNED IN VIEW (PROFILE CONFIGURATION) ================= */
            <div className="space-y-6">
              {/* Current Avatar Header */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-2 shadow-md flex items-center justify-center bg-slate-800 ${
                    isNightMode ? 'border-teal-500/40' : 'border-[#00897B]/40'
                  }`}>
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">{currentUser.displayName || 'Estudiante Sin Nombre'}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{currentUser.email}</p>
                </div>
              </div>

              {/* Edit Profile Form */}
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre de Perfil</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Tu nombre estudiantil"
                    className={`w-full text-xs px-4 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                      isNightMode
                        ? 'bg-slate-950/40 border-slate-800 focus:border-teal-500/50 text-slate-200'
                        : 'bg-neutral-50 border-neutral-200 focus:border-[#00897B]/40 text-neutral-800'
                    }`}
                  />
                </div>

                {/* Avatar selection removed */}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      isNightMode
                        ? 'bg-teal-500 hover:bg-teal-600 text-slate-950'
                        : 'bg-[#00897B] hover:bg-[#00796B] text-white'
                    } disabled:opacity-60`}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Guardar Cambios'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={loading}
                    className={`px-4 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isNightMode
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        : 'bg-red-500/5 border-red-500/10 text-red-600 hover:bg-red-500/10'
                    }`}
                    title="Cerrar Sesión"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
