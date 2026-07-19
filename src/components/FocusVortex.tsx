import React, { RefObject } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Orbit, Infinity as InfinityIcon } from 'lucide-react';

interface FocusVortexProps {
  isDraggingActive: boolean;
  isHoveringVortex?: boolean;
  vortexRef: RefObject<HTMLDivElement | null>;
  onManualTrigger: () => void;
  hasTasks: boolean;
  isNightMode?: boolean;
}

export default function FocusVortex({
  isDraggingActive,
  isHoveringVortex = false,
  vortexRef,
  onManualTrigger,
  hasTasks,
  isNightMode = false,
}: FocusVortexProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-6 px-4">
      {/* Interactive Concentric Rings */}
      <div
        ref={vortexRef}
        id="focus-vortex-container"
        className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full flex items-center justify-center transition-all duration-300 ${
          isHoveringVortex
            ? isNightMode
              ? 'bg-teal-500/10 border-2 border-solid border-teal-400 scale-108 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
              : 'bg-[#00897B]/10 border-2 border-solid border-[#00897B] scale-108 shadow-[0_0_20px_rgba(0,137,123,0.2)]'
            : isDraggingActive
              ? isNightMode 
                ? 'bg-slate-950/20 border-2 border-dashed border-teal-500 scale-105 shadow-inner' 
                : 'bg-neutral-900/5 border-2 border-dashed border-neutral-400 scale-105 shadow-inner'
              : isNightMode
                ? 'border-2 border-dashed border-slate-800'
                : 'border-2 border-dashed border-neutral-200/90'
        }`}
      >
        {/* Background Swirling Dotted Orbits */}
        <div 
          className={`absolute inset-1 rounded-full border border-dotted animate-spin transition-colors duration-500 ${
            isHoveringVortex 
              ? isNightMode ? 'border-teal-400' : 'border-[#00897B]'
              : isNightMode ? 'border-slate-800' : 'border-neutral-300'
          }`} 
          style={{ 
            animationDuration: isHoveringVortex ? '12s' : isDraggingActive ? '20s' : '40s' 
          }} 
        />
        <div 
          className={`absolute inset-4 rounded-full border border-dotted animate-spin transition-colors duration-500 ${
            isHoveringVortex
              ? isNightMode ? 'border-teal-400/80' : 'border-[#00897B]/80'
              : isNightMode ? 'border-slate-800/60' : 'border-neutral-200'
          }`} 
          style={{ 
            animationDuration: isHoveringVortex ? '8s' : isDraggingActive ? '12s' : '25s', 
            animationDirection: 'reverse' 
          }} 
        />
        <div 
          className={`absolute inset-8 rounded-full border border-dotted animate-spin transition-colors duration-500 ${
            isHoveringVortex
              ? isNightMode ? 'border-teal-400/60' : 'border-[#00897B]/60'
              : isNightMode ? 'border-slate-800' : 'border-neutral-300'
          }`} 
          style={{ 
            animationDuration: isHoveringVortex ? '5s' : isDraggingActive ? '8s' : '15s' 
          }} 
        />

        {/* Outer Halo */}
        {(isDraggingActive || isHoveringVortex) && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: isHoveringVortex ? [1.02, 1.25, 1.02] : [1, 1.15, 1], 
              opacity: isHoveringVortex ? [0.4, 0.8, 0.4] : [0.3, 0.6, 0.3] 
            }}
            transition={{ repeat: Infinity, duration: isHoveringVortex ? 1.2 : 2, ease: "easeInOut" }}
            className={`absolute inset-0 rounded-full filter blur-xs ${
              isNightMode ? 'bg-[#00897B]/20' : 'bg-neutral-900/10'
            }`}
          />
        )}

        {/* Inner Content Core */}
        <motion.div
          animate={isHoveringVortex ? { scale: 1.15 } : isDraggingActive ? { scale: 1.08 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className={`w-32 h-32 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center text-center p-4 transition-all duration-300 shadow-md ${
            isHoveringVortex
              ? isNightMode 
                ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-slate-950 shadow-[0_0_25px_rgba(20,184,166,0.5)] font-bold' 
                : 'bg-gradient-to-br from-[#00897B] to-[#00796B] text-white shadow-[0_0_25px_rgba(0,137,123,0.4)] font-bold'
              : isDraggingActive
                ? isNightMode ? 'bg-teal-600 text-white' : 'bg-neutral-900 text-white'
                : isNightMode
                  ? 'bg-[#151c2c] text-slate-200 border border-slate-800'
                  : 'bg-white text-neutral-600 border border-neutral-100'
          }`}
        >
          {isHoveringVortex ? (
            <div className="flex flex-col items-center gap-1 animate-in zoom-in-95 duration-150">
              <Sparkles className="w-6 h-6 animate-pulse text-amber-200" />
              <p className="text-xs font-black px-1 uppercase tracking-wider leading-tight">¡SUELTA AHORA! ✨</p>
              <p className="text-[9px] font-medium leading-none opacity-90 mt-0.5">Inicia con calma</p>
            </div>
          ) : isDraggingActive ? (
            <div className="flex flex-col items-center gap-1">
              <Sparkles className="w-6 h-6 animate-bounce text-amber-200" />
              <p className="text-xs font-semibold px-2">Suelta la carga aquí</p>
              <p className="text-[9px] text-slate-200">para disolver el agobio</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 cursor-pointer" onClick={() => !hasTasks && onManualTrigger()}>
              <Orbit className={`w-7 h-7 animate-soft-pulse ${isNightMode ? 'text-teal-400' : 'text-[#00897B]'}`} />
              <p className={`text-[11px] font-medium leading-tight ${isNightMode ? 'text-slate-200' : 'text-neutral-700'}`}>Vórtice de Enfoque</p>
              <p className="text-[9px] text-neutral-400 max-w-[90px] mx-auto leading-normal">
                {hasTasks 
                  ? 'Arrastra un pendiente aquí' 
                  : 'Pulsa el botón superior para crear una tarea'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Subtle orbit nodes */}
        <div className={`absolute top-4 left-6 w-1.5 h-1.5 rounded-full animate-ping ${isNightMode ? 'bg-teal-600/60' : 'bg-neutral-300/80'}`} />
        <div className={`absolute bottom-6 right-8 w-2 h-2 rounded-full ${isNightMode ? 'bg-slate-800' : 'bg-neutral-200'}`} />
      </div>

      {/* Auxiliary labels below the Vortex */}
      <p className={`text-[11px] font-mono font-medium text-center mt-3 leading-relaxed transition-colors duration-300 ${isNightMode ? 'text-slate-450' : 'text-neutral-400'}`}>
        {isHoveringVortex ? (
          <span className={`font-bold animate-pulse ${isNightMode ? 'text-teal-300' : 'text-neutral-900'}`}>¡Perfecto! Suelta la tarea para iniciar</span>
        ) : isDraggingActive ? (
          <span className={`font-semibold animate-pulse ${isNightMode ? 'text-teal-400' : 'text-neutral-950'}`}>¡Casi listo! Deja caer la tarjeta en el círculo</span>
        ) : (
          <span>Arrastra un pendiente aquí para iniciar con calma</span>
        )}
      </p>
    </div>
  );
}
