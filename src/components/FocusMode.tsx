import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';
import { STRESS_PRESETS, EMPATHIC_QUOTES } from '../data';
import { Play, Pause, Square, Sparkles, Wind, RotateCcw, CheckCircle2, UserCheck, Heart, Music, Volume2, VolumeX, X, BookOpen } from 'lucide-react';

interface FocusModeProps {
  task: Task;
  onFinish: (minutesSpent: number, completed: boolean) => void;
  onCancel: () => void;
  notificationsEnabled?: boolean;
}

type ModeState = 'focusing' | 'paused' | 'breathing' | 'finished';

const STRETCHES = [
  {
    title: "Rotación Suave del Cuello",
    desc: "Inclina tu cabeza de lado, llevando tu oreja izquierdo al hombro por 5s. Vuelve lento y repite a la derecha. Libera rigidez."
  },
  {
    title: "Estiramiento Flexor de Muñecas",
    desc: "Extiende un brazo con la palma al frente y dedos abajo. Presiona con la mano contraria suavemente. Alivia tendones cansados."
  },
  {
    title: "Palmeado y Calor Ocular (Palming)",
    desc: "Frota tus manos vigorosamente para calentarlas. Ahúcalas sobre tus ojos cerrados. Descansa la vista de la luz azul."
  },
  {
    title: "Círculos Amplios de Hombros",
    desc: "Gira ambos hombros hacia atrás dibujando grandes círculos. Al llegar abajo, déjalos caer totalmente relajados."
  }
];

const playTibetanBowlChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Frecuencias combinadas para simular el metal vibrante del cuenco tibetano
    const tones = [144, 288.5, 434.0, 577.8, 723.2, 1010];
    const amplitudes = [0.5, 0.3, 0.2, 0.12, 0.08, 0.04];
    const decays = [8.0, 6.0, 4.5, 3.5, 2.5, 1.8];
    
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // Detune fluctuante y slow vibrato
      osc.frequency.linearRampToValueAtTime(freq + (idx % 2 === 0 ? 0.3 : -0.3), now + decays[idx]);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(amplitudes[idx], now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + decays[idx]);
    });
  } catch (err) {
    console.error("Zen Bell Sound error:", err);
  }
};

const createBrownNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = ctx.sampleRate * 4; // 4s buffer de ruido único
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.8; // Ganancia segura para el procesamiento
  }
  return buffer;
};

export default function FocusMode({ task, onFinish, onCancel, notificationsEnabled = false }: FocusModeProps) {
  const [mode, setMode] = useState<ModeState>('focusing');
  const [secondsLeft, setSecondsLeft] = useState(task.estimatedMinutes * 60);
  const [totalSeconds, setTotalSeconds] = useState(task.estimatedMinutes * 60);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // States for audio control & active rest
  const [audioTrack, setAudioTrack] = useState<'none' | 'binaural' | 'ocean'>('none');
  const [stretchIndex, setStretchIndex] = useState(0);

  // Breathing state: inhala / exhala helper
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [isAiGuideOpen, setIsAiGuideOpen] = useState(false);

  const preset = STRESS_PRESETS[task.stressScore] || STRESS_PRESETS[3];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const notificationsEnabledRef = useRef(notificationsEnabled);
  const taskTitleRef = useRef(task.title);

  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundSourceRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null);
  const backgroundSourceRightRef = useRef<OscillatorNode | null>(null);
  const backgroundGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  useEffect(() => {
    taskTitleRef.current = task.title;
  }, [task.title]);

  // Audio system helper functions
  const stopAmbientAudio = () => {
    if (backgroundSourceRef.current) {
      try { backgroundSourceRef.current.stop(); } catch(e){}
      backgroundSourceRef.current = null;
    }
    if (backgroundSourceRightRef.current) {
      try { backgroundSourceRightRef.current.stop(); } catch(e){}
      backgroundSourceRightRef.current = null;
    }
    if (backgroundGainRef.current) {
      try { backgroundGainRef.current.disconnect(); } catch(e){}
      backgroundGainRef.current = null;
    }
  };

  const updateAmbientAudio = (track: 'none' | 'binaural' | 'ocean') => {
    stopAmbientAudio();
    if (track === 'none') return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime); // low volume for subtle background focus
      gainNode.connect(ctx.destination);
      backgroundGainRef.current = gainNode;
      
      if (track === 'ocean') {
        const buffer = createBrownNoiseBuffer(ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        // Low frequency oscillator for ocean wave volume modulation
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
        
        const mainVolume = ctx.createGain();
        mainVolume.gain.setValueAtTime(0.03, ctx.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(mainVolume.gain);
        
        source.connect(mainVolume);
        mainVolume.connect(gainNode);
        
        lfo.start();
        source.start();
        backgroundSourceRef.current = source;
      } else if (track === 'binaural') {
        const leftOsc = ctx.createOscillator();
        const rightOsc = ctx.createOscillator();
        
        leftOsc.frequency.setValueAtTime(140, ctx.currentTime);
        rightOsc.frequency.setValueAtTime(180, ctx.currentTime);
        
        const splitter = ctx.createChannelMerger(2);
        
        const leftGain = ctx.createGain();
        const rightGain = ctx.createGain();
        leftGain.gain.setValueAtTime(0.5, ctx.currentTime);
        rightGain.gain.setValueAtTime(0.5, ctx.currentTime);
        
        leftOsc.connect(leftGain);
        rightOsc.connect(rightGain);
        
        leftGain.connect(splitter, 0, 0);
        rightGain.connect(splitter, 0, 1);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(130, ctx.currentTime);
        
        splitter.connect(filter);
        filter.connect(gainNode);
        
        leftOsc.start();
        rightOsc.start();
        
        backgroundSourceRef.current = leftOsc;
        backgroundSourceRightRef.current = rightOsc;
      }
    } catch (err) {
      console.error("Web Audio Soundscapes failed", err);
    }
  };

  useEffect(() => {
    if (mode === 'focusing') {
      updateAmbientAudio(audioTrack);
    } else {
      stopAmbientAudio();
    }
    return () => stopAmbientAudio();
  }, [mode, audioTrack]);

  // Inhale/Exhale phase loop along with active rest stretches cycle
  useEffect(() => {
    if (mode === 'breathing') {
      const breathingInterval = setInterval(() => {
        setBreathingPhase((prev) => {
          const next = prev === 'inhale' ? 'exhale' : 'inhale';
          if (next === 'inhale') {
            setStretchIndex((s) => (s + 1) % STRETCHES.length);
          }
          return next;
        });
      }, 4000); // 4 seconds inhale, 4 seconds exhale
      return () => clearInterval(breathingInterval);
    }
  }, [mode]);

  // Handle countdown
  useEffect(() => {
    if (mode === 'focusing') {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            // Transition to Mindful Pause breathing phase
            setMode('breathing');

            // Play Zen Bell Tibetan bowl chime sound effect
            playTibetanBowlChime();

            // Send native browser notification
            if (notificationsEnabledRef.current && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification("¡Bloque de enfoque terminado!", {
                  body: `Excelente esfuerzo en: "${taskTitleRef.current}". Es hora de tomar una pausa consciente para tu descanso activo.`,
                  icon: "/favicon.ico",
                  tag: "menteclara-focus-complete",
                  requireInteraction: true
                });
              } catch (err) {
                console.error("Error creating end focus notification:", err);
              }
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode]);

  // Quote rotation loop
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % EMPATHIC_QUOTES.length);
    }, 12000); // changes comfort quotes every 12 seconds
    return () => clearInterval(quoteInterval);
  }, []);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseToggle = () => {
    if (mode === 'focusing') {
      setMode('paused');
    } else if (mode === 'paused') {
      setMode('focusing');
    }
  };

  const handleConcludeEarly = () => {
    setMode('finished');
  };

  const handleCloseAndSave = (completeStatus: boolean) => {
    const secondsSpent = totalSeconds - secondsLeft;
    const minutesSpent = Math.max(1, Math.round(secondsSpent / 60));
    onFinish(minutesSpent, completeStatus);
  };

  const currentQuote = EMPATHIC_QUOTES[quoteIndex]?.quote || EMPATHIC_QUOTES[0].quote;

  return (
    <div className="fixed inset-0 z-150 flex flex-col justify-between py-4 px-5 sm:p-6 bg-[#030712] text-white overflow-hidden transition-colors duration-700">
      
      {/* Decorative background nebulae */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-5 w-80 h-80 bg-orange-500/5 rounded-full filter blur-[110px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mt-1 sm:mt-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            Ambiente de Enfoque Adaptativo
          </span>
          <span className="text-xs sm:text-sm font-semibold text-neutral-200">
            MenteClara • {task.category}
          </span>
        </div>
        
        {/* Absolute exit guard */}
        <button
          id="btn-quit-focus"
          onClick={() => {
            if (window.confirm("¿Deseas suspender este bloque de enfoque? Guardaremos el tiempo invertido.")) {
              handleCloseAndSave(false);
            }
          }}
          className="text-[11px] font-mono font-semibold px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          Salir
        </button>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar flex flex-col items-center justify-center py-2 px-1 w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {mode !== 'breathing' && mode !== 'finished' ? (
            /* FOCUS BLOCK TIMER */
            <motion.div
              key="timer-focus"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm flex flex-col items-center text-center space-y-4 sm:space-y-6"
            >
              {/* Task name header */}
              <div className="space-y-1 px-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${preset.colorClass.pill}`}>
                  {preset.label}
                </span>
                <h1 className="text-lg sm:text-xl font-bold font-display tracking-tight text-white leading-snug">
                  {task.title}
                </h1>
                
                {task.aiSuggestions && (
                  <button
                    onClick={() => setIsAiGuideOpen(true)}
                    className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>Guía IA Anti-Fricción</span>
                  </button>
                )}
              </div>

              {/* Huge Timer Screen */}
              <div className="relative flex items-center justify-center w-40 h-40 sm:w-56 sm:h-56 shrink-0">
                {/* SVG circular progress indicator */}
                <svg viewBox="0 0 256 256" className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="112"
                    className="stroke-neutral-800"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="128"
                    cy="128"
                    r="112"
                    className="stroke-white"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 112}
                    animate={{
                      strokeDashoffset: (2 * Math.PI * 112) * (1 - secondsLeft / totalSeconds),
                    }}
                    transition={{ ease: "linear", duration: 1 }}
                  />
                </svg>

                {/* Counter value rendering */}
                <div className="flex flex-col items-center justify-center z-20">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-mono tracking-tighter text-white">
                    {formatTime(secondsLeft)}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-neutral-400 mt-1 uppercase">
                    {mode === 'paused' ? 'PAUSADO' : 'ENFOQUE ACTIVO'}
                  </span>
                </div>
              </div>

              {/* Empathetic quote comfort rail */}
              <div className="min-h-[40px] flex items-center justify-center px-4">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={quoteIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.5 }}
                    className="text-[11px] sm:text-xs font-normal text-neutral-300 italic max-w-xs leading-relaxed"
                  >
                    "{currentQuote}"
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Soundscape Ambient Selector */}
              <div className="flex flex-col items-center gap-1 pt-0.5 select-none">
                <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-slate-500 font-bold uppercase flex items-center gap-1">
                  <Music className="w-2.5 h-2.5 text-teal-400" />
                  <span>Ambiente Sonoro de Enfoque</span>
                </span>
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-0.5 rounded-xl">
                  <button
                    id="snd-track-none"
                    onClick={() => setAudioTrack('none')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                      audioTrack === 'none'
                        ? 'bg-neutral-800 text-white border border-white/10 shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Silencio
                  </button>
                  <button
                    id="snd-track-binaural"
                    onClick={() => setAudioTrack('binaural')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                      audioTrack === 'binaural'
                        ? 'bg-teal-650 text-white border border-teal-500/30 shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Ondas Binaurales Beta-Gamma (40Hz)"
                  >
                    Binaural 40Hz
                  </button>
                  <button
                    id="snd-track-ocean"
                    onClick={() => setAudioTrack('ocean')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                      audioTrack === 'ocean'
                        ? 'bg-emerald-600 text-white border border-emerald-500/30 shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Oleaje oceánico rítmico y calmado"
                  >
                    Océano Cósmico
                  </button>
                </div>
              </div>

              {/* Quick UI controls */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  id="btn-play-pause-timer"
                  onClick={handlePauseToggle}
                  className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
                    mode === 'paused'
                      ? 'bg-white text-neutral-900 hover:scale-105'
                      : 'bg-neutral-800 text-white hover:bg-neutral-700 hover:scale-105'
                  }`}
                >
                  {mode === 'paused' ? <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Pause className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>

                <button
                  id="btn-conclude-early"
                  onClick={handleConcludeEarly}
                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-red-900/40 hover:bg-red-900 border border-red-700/60 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                  title="Finalizar bloque"
                >
                  <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                </button>
              </div>
            </motion.div>
          ) : mode === 'breathing' ? (
            /* MINDFUL PAUSE RESPIRATOR */
            <motion.div
              key="timer-breathing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm flex flex-col items-center text-center space-y-4 sm:space-y-6"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] sm:text-xs border border-emerald-800">
                  <Wind className="w-3 h-3 animate-pulse" />
                  <span>Pausa Mindful Activa</span>
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold font-display tracking-tight text-white mt-1">
                  Pausa Consciente
                </h1>
                <p className="text-[11px] sm:text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  Has completado un gran bloque académico. Es momento de reponer oxígeno. Sincroniza tu respiración con el círculo.
                </p>
              </div>

              {/* Breathing expanding Ring */}
              <div className="relative w-40 h-40 sm:w-56 sm:h-56 flex items-center justify-center shrink-0">
                {/* Outermost expand ring */}
                <motion.div
                  animate={{
                    scale: breathingPhase === 'inhale' ? [1, 1.35, 1.4] : [1.4, 1, 0.95],
                    opacity: breathingPhase === 'inhale' ? [0.15, 0.3, 0.35] : [0.35, 0.15, 0.1],
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="absolute w-26 h-26 sm:w-36 sm:h-36 rounded-full bg-emerald-500/20 filter blur-xs"
                />

                {/* Inner actual ring */}
                <motion.div
                  animate={{
                    scale: breathingPhase === 'inhale' ? 1.25 : 0.9,
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="absolute w-22 h-22 sm:w-30 sm:h-30 rounded-full border-2 border-emerald-400 flex items-center justify-center bg-gradient-to-tr from-emerald-950/40 to-indigo-950/40 shadow-lg"
                >
                  <Wind className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-300 animate-spin" style={{ animationDuration: '15s' }} />
                </motion.div>

                {/* Core label */}
                <div className="absolute z-20 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={breathingPhase}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm sm:text-base font-bold text-white tracking-wide"
                    >
                      {breathingPhase === 'inhale' ? 'INHALA' : 'EXHALA'}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-[#a7f3d0] mt-0.5 font-bold">
                    PASO A PASO
                  </span>
                </div>
              </div>

              {/* Dynamic Physical Rest Stretch Segment */}
              <div className="w-full max-w-xs p-3 bg-emerald-950/25 border border-emerald-500/20 rounded-xl text-left space-y-1 relative overflow-hidden select-none">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Heart className="w-12 h-12 text-emerald-400" />
                </div>
                <div className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1 leading-none">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-450 animate-pulse" />
                  <span>Dosis de Estiramiento Activo</span>
                </div>
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-100 select-text">
                  {STRETCHES[stretchIndex]?.title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[#a7f3d0] leading-relaxed select-text font-medium">
                  {STRETCHES[stretchIndex]?.desc}
                </p>
              </div>

              {/* Empathetic Validation of Effort */}
              <p className="text-[9.5px] sm:text-[10.5px] text-neutral-400 leading-relaxed max-w-xs mx-auto italic font-sans px-2">
                "El descanso corporal no es una pérdida de tiempo; es el mantenimiento preventivo esencial que mantiene tu cerebro ágil y sano."
              </p>

              {/* Actions to conclude or continue */}
              <div className="flex flex-col items-center gap-2 pt-1 w-full">
                <button
                  id="btn-breathing-finish"
                  onClick={() => handleCloseAndSave(true)}
                  className="w-full max-w-xs py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dar por terminado y archivar</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* CONCLUDE EARLY ACTION SELECTION */
            <motion.div
              key="timer-conclude"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex flex-col items-center text-center space-y-4"
            >
              <Heart className="w-10 h-10 text-rose-500 animate-pulse" />
              <div className="space-y-1">
                <h1 className="text-base sm:text-lg font-bold text-white">¿Has terminado el bloque?</h1>
                <p className="text-[11px] sm:text-xs text-neutral-400">
                  Todo esfuerzo suma. Sincérate con tu avance de hoy para llevar un control saludable de tu carga mental:
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <button
                  id="btn-complete-yes"
                  onClick={() => handleCloseAndSave(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Sí, completé mi objetivo</span>
                </button>

                <button
                  id="btn-complete-no"
                  onClick={() => handleCloseAndSave(false)}
                  className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-[11px] sm:text-xs border border-white/5 transition-colors cursor-pointer"
                >
                  No del todo, pero di mi mejor esfuerzo
                </button>
              </div>

              <button
                id="btn-back-focus-timer"
                onClick={() => setMode('focusing')}
                className="text-[11px] sm:text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Volver de vuelta al temporizador</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer support */}
      <div className="relative z-10 text-center text-[10px] text-neutral-500 font-mono py-2">
        MenteClara MVP — Tu bienestar académico es nuestra prioridad
      </div>

      {/* Modal for AI Suggestions */}
      <AnimatePresence>
        {isAiGuideOpen && task.aiSuggestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setIsAiGuideOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0a0f1d] border border-slate-800 p-5 rounded-3xl relative text-left space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsAiGuideOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1 pr-6">
                <div className="text-[10px] font-bold font-mono text-[#E0F2F1] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>GUÍA IA PARA INICIAR SIN FRICCIÓN</span>
                </div>
                <h3 className="font-serif text-base italic text-slate-100 font-bold">
                  Paso a paso personalizado
                </h3>
              </div>

              <div className="space-y-3">
                <ol className="space-y-2 pl-1 select-text">
                  {task.aiSuggestions.steps.map((step, idx) => (
                    <li key={idx} className="text-[12px] text-slate-200 tracking-wide font-medium flex gap-2 items-start leading-relaxed">
                      <span className="text-amber-400 font-bold font-mono text-[10px] bg-white/10 rounded-md px-1.5 py-0.5 mt-0.5">{idx + 1}</span>
                      <span className="flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {task.aiSuggestions.studyResources && task.aiSuggestions.studyResources.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2 select-text">
                  <div className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase">
                    Recursos de Apoyo Explicativos
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {task.aiSuggestions.studyResources.map((resource, i) => {
                      const isYoutube = resource.type.toLowerCase().includes('youtube');
                      const searchUrl = isYoutube 
                        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(resource.urlOrQuery)}`
                        : resource.urlOrQuery.startsWith('http') 
                          ? resource.urlOrQuery 
                          : `https://duckduckgo.com/?q=${encodeURIComponent(resource.urlOrQuery || resource.title)}`;

                      return (
                        <a
                          key={i}
                          href={searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-200">
                            <span className="truncate max-w-[150px]">{resource.title}</span>
                            <span className="text-[8px] uppercase tracking-wider bg-white/10 text-amber-300 px-1 py-0.2 rounded font-mono">
                              {isYoutube ? 'YouTube' : resource.type}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-slate-400 group-hover:text-slate-300 mt-0.5 leading-snug">
                            {resource.whyHelpful}
                          </p>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800">
                <p className="text-[11px] text-amber-500/90 italic text-center font-mono">
                  "{task.aiSuggestions.mantra}"
                </p>
              </div>

              <button
                onClick={() => setIsAiGuideOpen(false)}
                className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Entendido, ¡estoy listo!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
