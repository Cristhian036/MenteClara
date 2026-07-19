import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, StressLevel } from '../types';
import { STRESS_PRESETS, DEFAULTS_CATEGORIES } from '../data';
import { X, ArrowRight, ArrowLeft, Check, Smile, Milestone, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  isNightMode?: boolean;
}

export default function QuickAddModal({ isOpen, onClose, onAdd, isNightMode = false }: QuickAddModalProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEFAULTS_CATEGORIES[0]);
  const [stressScore, setStressScore] = useState<number>(3); // Default is 3 (Moderada)
  const [dueDate, setDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);

  // Sync recommended minutes whenever the stressScore changes, unless user touched it
  useEffect(() => {
    const recommended = STRESS_PRESETS[stressScore]?.recommendedMinutes || 25;
    setEstimatedMinutes(recommended);
  }, [stressScore]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTitle('');
      setCategory(DEFAULTS_CATEGORIES[0]);
      setStressScore(3);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
      setEstimatedMinutes(25);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPreset = STRESS_PRESETS[stressScore];

  const handleNext = () => {
    if (step === 1 && !title.trim()) return;
    if (step < 5) {
      setStep(step + 1);
    } else {
      onAdd({
        title: title.trim(),
        category,
        stressLevel: currentPreset.level,
        stressScore,
        stressLabel: currentPreset.label,
        estimatedMinutes,
        dueDate,
      });
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className={`relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-500 border ${
          isNightMode ? 'bg-[#151c2c] border-slate-800 text-slate-100' : 'bg-white border-neutral-100 text-neutral-800'
        }`}
      >
        {/* Progress header bar */}
        <div className={`p-5 border-b ${isNightMode ? 'border-slate-800' : 'border-neutral-100'}`}>
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-[11px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
              Nuevo Pendiente • Paso {step} de 5
            </span>
            <button
               id="close-add-modal"
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isNightMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100' : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isNightMode ? 'bg-slate-900' : 'bg-neutral-100'}`}>
            <motion.div
              initial={{ width: "20%" }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full rounded-full ${isNightMode ? 'bg-teal-650' : 'bg-neutral-900'}`}
            />
          </div>
        </div>

        {/* Dynamic Card Container */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-center min-h-[300px]">
          <AnimatePresence mode="wait" custom={step}>
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-[#9a3412]">
                  <Smile className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">Empecemos con calma</span>
                </div>
                <h2 className={`text-lg font-bold font-display tracking-tight ${isNightMode ? 'text-slate-100' : 'text-neutral-900'}`}>
                  ¿Qué tienes pendiente por resolver?
                </h2>
                <div className="space-y-1">
                  <textarea
                    id="input-task-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Redactar el informe de IHC o preparar diapositivas de sustentación..."
                    className={`w-full h-24 p-4 rounded-2xl text-sm outline-none transition-all resize-none leading-relaxed placeholder:text-neutral-400 ${
                      isNightMode ? 'bg-slate-950 border-slate-800 focus:border-teal-500 focus:bg-slate-900 text-slate-100' : 'bg-neutral-50 border-neutral-200 focus:border-neutral-900 focus:bg-white text-neutral-808'
                    }`}
                    maxLength={100}
                    autoFocus
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400 font-mono px-1">
                    <span>Expresa tu pensamiento sin adornos</span>
                    <span>{title.length}/100</span>
                  </div>
                </div>

                {title.trim().length > 0 && title.trim().length < 5 && (
                  <p className={`text-[11px] italic p-2 rounded-xl border ${
                    isNightMode ? 'bg-amber-950/20 text-amber-300 border-amber-900/30' : 'bg-amber-50 text-neutral-500 border-amber-100'
                  }`}>
                    Consejo: Sé específico para reducir la ambigüedad en tu mente.
                  </p>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-neutral-500">
                  <Milestone className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Dimensión del evento</span>
                </div>
                <h2 className={`text-lg font-bold font-display tracking-tight ${isNightMode ? 'text-slate-100' : 'text-neutral-900'}`}>
                  ¿A qué ámbito corresponde?
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULTS_CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        id={`cat-btn-${cat.replace(/\s+/g, '-')}`}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-3 text-xs text-left rounded-xl border font-medium transition-all ${
                          isSelected
                            ? isNightMode 
                              ? 'bg-teal-650 text-white border-teal-600 shadow-sm' 
                              : 'bg-neutral-900 text-white border-neutral-950 shadow-xs'
                            : isNightMode
                              ? 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
                              : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/80 text-neutral-700'
                        } cursor-pointer`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 text-neutral-500">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Escala de Carga Espiritual</span>
                </div>
                <h2 className={`text-lg font-bold font-display tracking-tight leading-tight ${isNightMode ? 'text-slate-100' : 'text-neutral-900'}`}>
                  Sincérate: ¿Qué tan pesada se siente esta tarea en tu mente?
                </h2>

                <div className="pt-4 pb-2 space-y-6">
                  <input
                    id="input-stress-slider"
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={stressScore}
                    onChange={(e) => setStressScore(parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition-colors ${
                      isNightMode ? 'bg-slate-900 accent-teal-500' : 'bg-neutral-200 accent-neutral-900'
                    }`}
                  />
                  <div className="flex justify-between text-xs px-1 text-neutral-400 font-mono font-semibold">
                    <span>1 (Un paseo)</span>
                    <span>3 (Moderado)</span>
                    <span>5 (Pesadilla)</span>
                  </div>
                </div>

                {/* Live Feedback Card */}
                <motion.div
                  key={stressScore}
                  initial={{ scale: 0.98, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-4 rounded-2xl border-2 transition-colors duration-305 ${
                    isNightMode
                      ? stressScore >= 4
                        ? 'bg-[#251b14] border-[#D35400]/40'
                        : stressScore === 3
                        ? 'bg-[#232112] border-[#D4AC0D]/35'
                        : 'bg-[#101b1c] border-[#00897B]/35'
                      : `${currentPreset.colorClass.bg} ${currentPreset.colorClass.border}`
                  } space-y-2`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${isNightMode ? 'text-slate-200' : 'text-neutral-800'}`}>
                      Siento el peso como: {currentPreset.label}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isNightMode ? 'bg-slate-950/60 text-slate-400 border border-slate-900' : currentPreset.colorClass.pill
                    }`}>
                      Predicción activa
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed font-sans ${isNightMode ? 'text-slate-400' : 'text-neutral-600'}`}>
                    {currentPreset.colorClass.description}
                  </p>
                </motion.div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-teal-400">
                  <Sliders className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Seguimiento Real</span>
                </div>
                <h2 className={`text-lg font-bold font-display tracking-tight leading-tight ${isNightMode ? 'text-slate-100' : 'text-neutral-900'}`}>
                  ¿Cuándo es la fecha de entrega exacta?
                </h2>
                <p className={`text-xs leading-relaxed ${isNightMode ? 'text-slate-400' : 'text-neutral-500'}`}>
                  Conocer el límite real nos ayuda a estructurar tus dosis de calma sin generar autocomplacencia o alarmismo irracional.
                </p>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      id="input-task-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className={`w-full p-4 rounded-2xl text-sm outline-none transition-all font-mono font-bold ${
                        isNightMode 
                          ? 'bg-slate-950 border-slate-805/40 focus:border-teal-500 focus:bg-slate-905 text-slate-100' 
                          : 'bg-neutral-50 border-neutral-200 focus:border-neutral-900 focus:bg-white text-neutral-800'
                      }`}
                    />
                  </div>

                  {dueDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-[10px] font-semibold italic p-3 border rounded-2xl leading-relaxed text-center ${
                        isNightMode 
                          ? 'bg-teal-950/25 border-teal-900/35 text-teal-300' 
                          : 'bg-[#E0F2F1]/55 border-[#B2DFDB]/50 text-neutral-500'
                      }`}
                    >
                      {new Date(dueDate).getTime() < Date.now() - 1000 * 60 * 60 * 24
                        ? 'Esta fecha parece ser anterior o vencer hoy. ¡Justo a tiempo para un micro-paso de emergencia sin pánico!'
                        : `Sincronizado para el ${new Date(dueDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}.`
                      }
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Estrategia Preventiva</span>
                </div>
                <h2 className={`text-lg font-bold font-display tracking-tight ${isNightMode ? 'text-slate-100' : 'text-neutral-900'}`}>
                  Tiempo sugerido para no abrumarte
                </h2>
                <p className={`text-xs leading-relaxed ${isNightMode ? 'text-slate-400' : 'text-neutral-500'}`}>
                  Basado en una carga <strong className={isNightMode ? 'text-teal-400' : 'text-neutral-900'}>{currentPreset.label}</strong>, te sugerimos un bloque corto. El cerebro rompe mejor la inercia con objetivos mínimos.
                </p>

                <div className={`p-5 rounded-2xl border text-center space-y-4 ${
                  isNightMode ? 'bg-slate-950 border-slate-850' : 'bg-neutral-50 border-neutral-100/90'
                }`}>
                  <div className="flex justify-center items-center gap-4">
                    <button
                      type="button"
                      id="decrement-minutes"
                      onClick={() => setEstimatedMinutes(Math.max(5, estimatedMinutes - 5))}
                      className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer border ${
                        isNightMode ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                      }`}
                    >
                      -
                    </button>
                    <div className="flex flex-col">
                      <span className={`text-3xl font-extrabold font-mono tracking-tight ${isNightMode ? 'text-slate-100' : 'text-neutral-900'}`}>
                        {estimatedMinutes}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider font-bold">
                        MINUTOS
                      </span>
                    </div>
                    <button
                      type="button"
                      id="increment-minutes"
                      onClick={() => setEstimatedMinutes(Math.min(90, estimatedMinutes + 5))}
                      className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer border ${
                        isNightMode ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                      }`}
                    >
                      +
                    </button>
                  </div>

                  <p className="text-[10px] text-neutral-400 font-mono italic">
                    Un bloque breve disminuye la procrastinación inconsciente. ¡Confía en el proceso!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        <div className={`p-5 border-t flex justify-between gap-3 items-center ${
          isNightMode ? 'border-slate-850 bg-slate-950/80' : 'border-neutral-100 bg-neutral-50'
        }`}>
          {step > 1 ? (
            <button
              id="btn-back-step"
              type="button"
              onClick={handleBack}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isNightMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Atrás</span>
            </button>
          ) : (
            <div />
          )}

          <button
            id="btn-next-step"
            type="button"
            onClick={handleNext}
            disabled={step === 1 && !title.trim()}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              step === 1 && !title.trim()
                ? isNightMode 
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed' 
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : isNightMode
                ? 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer active:scale-95 shadow-sm shadow-teal-950/30'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer active:scale-95 shadow-sm'
            }`}
          >
            {step === 5 ? (
              <>
                <span>Añadir a mi mente</span>
                <Check className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
