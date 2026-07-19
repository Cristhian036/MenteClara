import React, { RefObject, useState } from 'react';
import { motion } from 'motion/react';
import { Task } from '../types';
import { STRESS_PRESETS } from '../data';
import { 
  Play, 
  Trash2, 
  FileText, 
  Layers, 
  BookOpen, 
  Eye, 
  Sparkles, 
  Clock, 
  Calendar, 
  ChevronUp, 
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

// Helper to map category names to clean Lucide icons (Heuristic #2: System-real world match)
const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('examen') || cat.includes('parcial') || cat.includes('final') || cat.includes('pc') || cat.includes('práctica') || cat.includes('practica')) {
    return <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />;
  }
  if (cat.includes('proyecto') || cat.includes('trabajo') || cat.includes('informe') || cat.includes('grupo') || cat.includes('final')) {
    return <Layers className="w-3.5 h-3.5 shrink-0 text-slate-400" />;
  }
  return <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />;
};

// Helper to normalize stress score to standard academic difficulty (Heuristic #4 & #2)
const getDifficultyLabel = (score: number) => {
  switch (score) {
    case 1:
      return 'Muy Baja';
    case 2:
      return 'Baja';
    case 3:
      return 'Media';
    case 4:
      return 'Alta';
    case 5:
      return 'Muy Alta';
    default:
      return 'Media';
  }
};

interface TaskCardProps {
  key?: string;
  task: Task;
  onSelect: (task: Task) => void;
  onDelete: (id: string) => void;
  isDraggingActive: boolean;
  setIsDraggingActive: (active: boolean) => void;
  isHoveringVortex?: boolean;
  setIsHoveringVortex?: (hovering: boolean) => void;
  vortexRef: RefObject<HTMLDivElement | null>;
  onDropInVortex: (task: Task) => void;
  onGetAiSuggestions: (id: string) => void;
  simplified?: boolean;
  onToggleSuggestionsCollapse?: (id: string, collapsed: boolean) => void;
  isNightMode?: boolean;
}

export default function TaskCard({
  task,
  onSelect,
  onDelete,
  isDraggingActive,
  setIsDraggingActive,
  isHoveringVortex = false,
  setIsHoveringVortex,
  vortexRef,
  onDropInVortex,
  onGetAiSuggestions,
  simplified = false,
  onToggleSuggestionsCollapse,
  isNightMode = false,
}: TaskCardProps) {
  const preset = STRESS_PRESETS[task.stressScore] || STRESS_PRESETS[3];
  const isSuggestionsCollapsed = task.aiSuggestionsCollapsed !== false;
  const [isOverVortex, setIsOverVortex] = useState(false);
  
  // Tab control inside AI suggestions to avoid text saturation (Heuristic #8: Aesthetic and Minimalist Design)
  const [activeTab, setActiveTab] = useState<'steps' | 'resources' | 'mantra'>('steps');

  const handleDragEnd = (event: any, info: any) => {
    setIsDraggingActive(false);
    setIsOverVortex(false);
    if (setIsHoveringVortex) {
      setIsHoveringVortex(false);
    }
    
    // Check if the drop coordinates overlap with the focus vortex
    if (vortexRef.current) {
      const rect = vortexRef.current.getBoundingClientRect();
      const x = info.point.x;
      const y = info.point.y;
      
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        onDropInVortex(task);
      }
    }
  };

  const handleDrag = (event: any, info: any) => {
    if (vortexRef.current) {
      const rect = vortexRef.current.getBoundingClientRect();
      const x = info.point.x;
      const y = info.point.y;
      
      const isOver = (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      );
      
      if (isOver !== isOverVortex) {
        setIsOverVortex(isOver);
        if (setIsHoveringVortex) {
          setIsHoveringVortex(isOver);
        }
      }
    }
  };

  const getDueDateMessage = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T12:00:00');
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { 
        text: 'Entrega: Hoy, 11:59 PM', 
        color: isNightMode ? 'text-red-350 bg-red-950/20 border-red-900/40' : 'text-red-900 bg-red-50 border-red-200 shadow-3xs' 
      };
    } else if (diffDays === 1) {
      return { 
        text: 'Entrega: Mañana, 11:59 PM', 
        color: isNightMode ? 'text-orange-355 bg-orange-950/20 border-orange-900/40' : 'text-orange-950 bg-orange-50 border-orange-200 shadow-3xs' 
      };
    } else if (diffDays < 0) {
      return { 
        text: `Venció hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`, 
        color: isNightMode ? 'text-slate-400 bg-slate-950/30 border-slate-800' : 'text-neutral-700 bg-neutral-100 border-neutral-300' 
      };
    } else if (diffDays <= 3) {
      return { 
        text: `Entrega: En ${diffDays} días, 11:59 PM`, 
        color: isNightMode ? 'text-yellow-350 bg-yellow-950/20 border-yellow-900/35' : 'text-amber-950 bg-amber-50 border-amber-200 shadow-3xs' 
      };
    } else {
      const formatted = due.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      return { 
        text: `Entrega: ${formatted}, 11:59 PM`, 
        color: isNightMode ? 'text-teal-350 bg-teal-950/20 border-teal-900/30' : 'text-teal-950 bg-teal-50 border-teal-200 shadow-3xs' 
      };
    }
  };

  const getCardStyleClasses = () => {
    if (isOverVortex) {
      return isNightMode
        ? 'border-teal-400 bg-teal-950/35 text-slate-100 shadow-[0_0_15px_rgba(20,184,166,0.25)]'
        : 'border-[#00897B] bg-[#00897B]/5 text-neutral-900 shadow-[0_0_15px_rgba(0,137,123,0.15)]';
    }

    if (isNightMode) {
      switch (task.stressScore) {
        case 5:
          return 'bg-[#1b1212]/95 border-red-950/60 hover:border-red-900/60 text-slate-100 border-l-4 border-l-red-500 hover:bg-[#1f1414]/95';
        case 4:
          return 'bg-[#1b1411]/95 border-orange-950/60 hover:border-orange-900/60 text-slate-100 border-l-4 border-l-orange-500 hover:bg-[#1f1713]/95';
        case 3:
          return 'bg-[#181711]/95 border-amber-950/60 hover:border-amber-900/60 text-slate-100 border-l-4 border-l-amber-500 hover:bg-[#1c1a13]/95';
        case 2:
          return 'bg-[#0f1616]/95 border-teal-950/60 hover:border-teal-900/60 text-slate-100 border-l-4 border-l-teal-500 hover:bg-[#121b1b]/95';
        case 1:
        default:
          return 'bg-[#0e1618]/95 border-cyan-950/60 hover:border-cyan-900/60 text-slate-100 border-l-4 border-l-cyan-500 hover:bg-[#111b1d]/95';
      }
    } else {
      switch (task.stressScore) {
        case 5:
          return 'bg-[#FEF2F2] border-red-200 hover:border-red-300 text-neutral-800 border-l-4 border-l-red-400 hover:bg-[#FFF5F5]';
        case 4:
          return 'bg-[#FFF7ED] border-orange-200 hover:border-orange-300 text-neutral-800 border-l-4 border-l-orange-400 hover:bg-[#FFF9F2]';
        case 3:
          return 'bg-[#FEFCE8] border-amber-200 hover:border-amber-300 text-neutral-800 border-l-4 border-l-amber-400 hover:bg-[#FEFDE8]';
        case 2:
          return 'bg-[#EBFDFB] border-teal-200 hover:border-teal-350 text-neutral-800 border-l-4 border-l-teal-400 hover:bg-[#F2FDFB]';
        case 1:
        default:
          return 'bg-[#EBFDFB] border-cyan-200 hover:border-cyan-350 text-neutral-800 border-l-4 border-l-cyan-400 hover:bg-[#F2FDFD]';
      }
    }
  };

  const containerClasses = getCardStyleClasses();

  const pillClasses = isNightMode
    ? 'bg-slate-850 text-slate-300 border border-slate-800'
    : `${preset.colorClass.pill} border border-transparent`;


  if (simplified) {
    return (
      <motion.div
        id={`task-card-simple-${task.id}`}
        layoutId={task.id}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={1}
        dragTransition={{ bounceStiffness: 550, bounceDamping: 30 }}
        whileDrag={{ 
          scale: isOverVortex ? 1.06 : 1.02, 
          rotate: isOverVortex ? 0 : 1.0,
          boxShadow: isOverVortex 
            ? (isNightMode ? "0 0 20px rgba(20,184,166,0.3)" : "0 0 20px rgba(0,137,123,0.2)")
            : "0 10px 20px rgba(0,0,0,0.1)",
          zIndex: 100
        }}
        onDragStart={() => setIsDraggingActive(true)}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={`relative w-full p-3.5 mb-2 rounded-2xl border-2 ${containerClasses} transition-all duration-300 pointer-events-auto cursor-grab active:cursor-grabbing select-none hover:shadow-2xs`}
      >
        <div className="flex justify-between items-center gap-2 mb-2.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono tracking-wide ${pillClasses}`}>
            {getCategoryIcon(task.category)}
            <span>{task.category}</span>
          </span>
          <span className={`text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 ${isNightMode ? 'text-slate-300' : 'text-neutral-700'}`}>
            <Clock className={`w-3.5 h-3.5 ${isNightMode ? 'text-slate-400' : 'text-neutral-500'}`} /> {task.estimatedMinutes}m
          </span>
        </div>

        <h3 className={`text-xs font-bold tracking-tight leading-snug mb-2 ${isNightMode ? 'text-slate-200' : 'text-neutral-800'}`}>
          {task.title}
        </h3>

        <div className={`flex justify-between items-center pt-2 border-t ${isNightMode ? 'border-slate-800/30' : 'border-black/5'}`}>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`w-1 h-1 rounded-full ${
                  s <= task.stressScore
                    ? task.stressScore >= 4
                      ? 'bg-red-500 shadow-[0_0_2px_rgba(239,68,68,0.4)]'
                      : task.stressScore === 3
                      ? 'bg-amber-500 shadow-[0_0_2px_rgba(245,158,11,0.4)]'
                      : 'bg-teal-500 shadow-[0_0_2px_rgba(20,184,166,0.4)]'
                    : isNightMode ? 'bg-slate-800' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[8px] font-mono text-neutral-400 italic">
            Arrastra arriba para iniciar
          </span>
        </div>
      </motion.div>
    );
  }

  const dueDateAlert = getDueDateMessage(task.dueDate);

  return (
    <motion.div
      id={`task-card-${task.id}`}
      layoutId={task.id}
      className={`relative w-full p-4 mb-3 rounded-2xl border-2 ${containerClasses} transition-all duration-300 pointer-events-auto select-text hover:shadow-3xs`}
    >
      {/* Header Info (Heuristic #4 & #8: Aesthetic and Minimalist Design) */}
      <div className="flex justify-between items-center gap-2 mb-2.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide ${pillClasses}`}>
          {getCategoryIcon(task.category)}
          <span>{task.category}</span>
        </span>
        
        <button
          id={`delete-${task.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            isNightMode ? 'text-slate-500 hover:text-red-400 hover:bg-slate-900/60' : 'text-neutral-400 hover:text-red-500 hover:bg-neutral-100'
          }`}
          title="Eliminar pendiente"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task Title (Heuristic #8: Clear and Readable Typography) */}
      <h3 className={`text-sm font-semibold tracking-tight leading-snug pr-4 mb-2.5 ${isNightMode ? 'text-slate-200' : 'text-neutral-800'}`}>
        {task.title}
      </h3>

      {/* Due Date Indicator (Heuristic #1: Visibility of System Status) */}
      {dueDateAlert && (
        <div className={`w-full px-3 py-1.5 mb-3 rounded-xl border text-[10px] font-semibold flex items-center gap-2 select-text pointer-events-auto transition-colors duration-300 ${dueDateAlert.color}`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{dueDateAlert.text}</span>
        </div>
      )}

      {/* AI Suggestions Advisor block (Heuristic #8 & Heuristic #6 Redesign to avoid Text Saturation) */}
      {task.aiSuggestionsLoading ? (
        <div className={`py-4 px-3 mb-3.5 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 text-xs font-mono animate-pulse pointer-events-none transition-all duration-300 ${
          isNightMode ? 'bg-slate-950/20 border-slate-800 text-slate-400' : 'bg-neutral-50/70 border-neutral-200 text-neutral-500'
        }`}>
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
          <span className="font-semibold text-[10.5px]">Sintonizando consejos...</span>
        </div>
      ) : (task.aiSuggestions && !isSuggestionsCollapsed) ? (
        <div className={`p-3.5 mb-3 rounded-2xl border text-xs space-y-3 pointer-events-auto transition-all duration-300 ${
          isNightMode ? 'bg-[#0f1524] border-slate-800/80 text-slate-300' : 'bg-white/85 border-neutral-200/60 text-neutral-600'
        }`}>
          {/* AI Advisor Tab selector to keep the card compact (Nielsen's Heuristic #8 & Heuristic #7) */}
          <div className="flex border-b border-neutral-300 dark:border-slate-800 pb-1.5 gap-1 select-none">
            <button
              onClick={(e) => { e.stopPropagation(); setActiveTab('steps'); }}
              className={`flex-1 py-1 px-1.5 text-[10px] font-bold font-mono rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'steps'
                  ? isNightMode ? 'bg-slate-900 text-teal-300 border border-slate-800' : 'bg-[#E0F2F1] text-[#005D54] font-bold border border-[#99F6E4]'
                  : isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Pasos
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveTab('resources'); }}
              className={`flex-1 py-1 px-1.5 text-[10px] font-bold font-mono rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'resources'
                  ? isNightMode ? 'bg-slate-900 text-teal-300 border border-slate-800' : 'bg-[#E0F2F1] text-[#005D54] font-bold border border-[#99F6E4]'
                  : isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Recursos
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveTab('mantra'); }}
              className={`flex-1 py-1 px-1.5 text-[10px] font-bold font-mono rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'mantra'
                  ? isNightMode ? 'bg-slate-900 text-teal-300 border border-slate-800' : 'bg-[#E0F2F1] text-[#005D54] font-bold border border-[#99F6E4]'
                  : isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Inspiración
            </button>
          </div>

          {/* Render Active Tab View */}
          <div className="min-h-[70px] flex flex-col justify-center">
            {activeTab === 'steps' && (
              <div className="space-y-2 select-text">
                {task.aiSuggestions.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-[11px] leading-relaxed">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold font-mono shrink-0 ${
                      isNightMode ? 'bg-teal-950/80 text-teal-300 border border-teal-800/60' : 'bg-teal-100 text-[#004D40] border border-[#5EEAD4]/50'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className={isNightMode ? 'text-slate-300' : 'text-neutral-800 font-medium'}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-1.5 select-text">
                {task.aiSuggestions.studyResources && task.aiSuggestions.studyResources.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5">
                    {task.aiSuggestions.studyResources.slice(0, 2).map((resource, i) => {
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
                          onClick={(e) => e.stopPropagation()}
                          className={`group flex flex-col p-2 border rounded-xl text-[10px] transition-all cursor-pointer shadow-3xs ${
                            isNightMode 
                              ? 'bg-[#0a0f1b]/60 hover:bg-slate-900 border-slate-850 hover:border-slate-800 text-slate-300' 
                              : 'bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800'
                          }`}
                        >
                          <div className={`flex items-center justify-between font-bold ${isNightMode ? 'text-slate-200' : 'text-neutral-900'}`}>
                            <span className="truncate max-w-[170px]">{resource.title}</span>
                            <span className={`text-[8px] uppercase tracking-wider px-1 rounded-sm font-mono shrink-0 ml-1 ${
                              isNightMode ? 'bg-slate-900 text-teal-400 border border-slate-800' : 'bg-teal-100 text-[#004D40] border border-[#5EEAD4]/40'
                            }`}>
                              {isYoutube ? 'Video' : 'Guía'}
                            </span>
                          </div>
                          <p className={`text-[9.5px] mt-0.5 leading-snug truncate ${isNightMode ? 'text-slate-450' : 'text-neutral-600'}`}>
                            {resource.whyHelpful}
                          </p>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-2 text-[10.5px] text-neutral-400 italic">
                    No se requieren materiales extra. ¡Solo tu voluntad es suficiente!
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mantra' && (
              <div className="space-y-2.5 text-center select-text py-0.5">
                <p className={`text-[10.5px] italic leading-normal px-1 ${isNightMode ? 'text-slate-400' : 'text-neutral-700'}`}>
                  "{task.aiSuggestions.introduction}"
                </p>
                <div className={`p-2 rounded-xl border border-dashed text-[10.5px] font-mono font-bold ${
                  isNightMode ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-950 shadow-3xs'
                }`}>
                  {task.aiSuggestions.mantra}
                </div>
              </div>
            )}
          </div>

          {/* Inline Action Controls (Heuristic #3: User Control and Freedom) */}
          <div className={`pt-2 border-t flex items-center justify-between text-[10px] text-neutral-400 gap-2 ${
            isNightMode ? 'border-slate-800/40' : 'border-neutral-200/40'
          }`}>
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#E67E22] truncate max-w-[130px]">
              Consejos de calma
            </span>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                id={`refresh-ai-${task.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onGetAiSuggestions(task.id);
                }}
                className={`flex items-center gap-0.5 text-[10px] cursor-pointer font-bold font-mono transition-colors hover:underline ${
                  isNightMode ? 'text-teal-400 hover:text-teal-300' : 'text-[#00897B] hover:text-[#00796B]'
                }`}
                title="Regenerar sugerencias de IA"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Regenerar</span>
              </button>
              <button
                id={`collapse-ai-${task.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSuggestionsCollapse?.(task.id, true);
                }}
                className={`flex items-center gap-0.5 text-[10px] cursor-pointer font-bold font-mono transition-colors hover:underline ${
                  isNightMode ? 'text-slate-400 hover:text-slate-300' : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title="Ocultar comentarios"
              >
                <ChevronUp className="w-3 h-3" />
                <span>Ocultar</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-3.5 pointer-events-auto">
          <button
            id={`btn-ai-suggest-${task.id}`}
            onClick={(e) => {
              e.stopPropagation();
              if (task.aiSuggestions) {
                onToggleSuggestionsCollapse?.(task.id, false);
              } else {
                onGetAiSuggestions(task.id);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-mono font-bold rounded-xl cursor-pointer transition-all border hover:scale-[1.01] active:scale-[0.99] shadow-3xs ${
              isNightMode 
                ? 'bg-transparent hover:bg-slate-850 border-slate-700 text-slate-300' 
                : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-250'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isNightMode ? 'text-teal-400' : 'text-neutral-500'}`} />
            <span>¿Cómo empiezo? (IA)</span>
          </button>
        </div>
      )}

      {/* Footer metadata & start action (Heuristic #1 & Heuristic #6) */}
      <div className="flex justify-between items-center gap-2 mt-auto">
        <div className="flex flex-wrap items-center gap-2">
          {/* Visual Difficulty Meter (Visibility of status / Recognition over recall) */}
          <div className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-mono font-bold border transition-colors ${
            isNightMode
              ? task.stressScore >= 4
                ? 'bg-red-950/30 text-red-350 border-red-900/40'
                : task.stressScore === 3
                ? 'bg-amber-950/30 text-amber-350 border-amber-900/40'
                : 'bg-teal-950/30 text-teal-350 border-teal-900/40'
              : task.stressScore >= 4
                ? 'bg-red-50 text-red-800 border-red-200'
                : task.stressScore === 3
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-teal-50 text-teal-850 border-teal-200'
          }`}>
            <div className="flex gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`w-1 h-1 rounded-full transition-colors ${
                    s <= task.stressScore
                      ? task.stressScore >= 4
                        ? isNightMode ? 'bg-red-400' : 'bg-red-600'
                        : task.stressScore === 3
                        ? isNightMode ? 'bg-amber-400' : 'bg-amber-600'
                        : isNightMode ? 'bg-teal-400' : 'bg-teal-600'
                      : isNightMode ? 'bg-slate-800' : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
            <span className="ml-0.5 shrink-0 font-extrabold uppercase tracking-wide text-[9.5px]">
              {getDifficultyLabel(task.stressScore)}
            </span>
          </div>

          <span className={`text-[10px] font-mono font-bold flex items-center gap-1.5 py-1 px-2.5 rounded-full border transition-colors ${
            isNightMode 
              ? 'bg-slate-900/60 text-slate-100 border-slate-800' 
              : 'bg-white text-neutral-900 border-neutral-300 shadow-3xs'
          }`}>
            <Clock className={`w-3.5 h-3.5 shrink-0 ${isNightMode ? 'text-slate-400' : 'text-neutral-500'}`} />
            <span>{task.estimatedMinutes} min</span>
          </span>
        </div>

        {/* Start button as accelerator (Heuristic #7: Flexibility and Efficiency of use) */}
        <button
          id={`start-${task.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(task);
          }}
          className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-[10.5px] font-bold transition-all shadow-sm cursor-pointer active:scale-95 ${
            isNightMode 
              ? 'bg-teal-500 text-slate-950 hover:bg-teal-400' 
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}
          title="Iniciar"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Iniciar</span>
        </button>
      </div>

      {/* Subtle interaction signifier for desktop click */}
      <div className="absolute right-2 top-2 hover-desktop-hint opacity-0 pointer-events-none transition-opacity text-[10px] text-neutral-400">
        <Eye className="w-3 h-3" /> Pulsa Iniciar para enfocarte
      </div>
    </motion.div>
  );
}
