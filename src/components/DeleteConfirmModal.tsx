import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isNightMode?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  taskTitle,
  onConfirm,
  onCancel,
  isNightMode = false,
}: DeleteConfirmModalProps) {
  // Escuchar la tecla Escape para cerrar el diálogo (Heurística #7: Flexibilidad y eficiencia de uso)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4">
          {/* Fondo traslúcido / Backdrop (Cerrar al hacer clic fuera es útil para flexibilidad de uso) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Tarjeta de Diálogo (Heurística #8: Diseño estético y minimalista) */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 z-10 transition-colors duration-300 overflow-hidden ${
              isNightMode
                ? 'bg-[#0f1424] border-slate-800 text-slate-100'
                : 'bg-white border-neutral-200 text-neutral-800'
            }`}
          >
            {/* Esquina decorativa con patrón sutil de advertencia */}
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 blur-xl ${
              isNightMode ? 'bg-red-500' : 'bg-red-600'
            }`} />

            {/* Botón de cierre superior derecho */}
            <button
              onClick={onCancel}
              className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
                isNightMode
                  ? 'hover:bg-slate-850 text-slate-400 hover:text-slate-200'
                  : 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700'
              }`}
              title="Cerrar diálogo"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ícono llamativo de advertencia */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${
                isNightMode
                  ? 'bg-red-950/40 border border-red-900/40 text-red-400'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className={`text-base font-bold tracking-tight ${
                  isNightMode ? 'text-slate-100' : 'text-neutral-900'
                }`}>
                  ¿Eliminar pendiente?
                </h3>
                <p className="text-[10px] font-mono text-neutral-400 font-medium">
                  Confirmación requerida
                </p>
              </div>
            </div>

            {/* Contenido / Cuerpo del modal */}
            <div className="space-y-3 mb-6 select-text text-left">
              <p className={`text-xs leading-relaxed ${
                isNightMode ? 'text-slate-300' : 'text-neutral-600'
              }`}>
                ¿Estás seguro de que deseas eliminar este pendiente? Esta acción es irreversible y borrará todo su historial.
              </p>
              
              <div className={`p-3 rounded-xl border border-dashed text-xs leading-snug font-medium break-all select-all ${
                isNightMode
                  ? 'bg-red-500/5 border-red-900/30 text-red-300'
                  : 'bg-red-50/50 border-red-200 text-red-900'
              }`}>
                {taskTitle}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-3 justify-end font-sans">
              <button
                onClick={onCancel}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-98 ${
                  isNightMode
                    ? 'bg-[#0a0f1b]/60 border-slate-850 hover:bg-slate-900 text-slate-300'
                    : 'bg-white border-neutral-300 hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer bg-red-600 text-white hover:bg-red-700 active:scale-98 shadow-red-600/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, eliminar</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
