import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';
import { STRESS_PRESETS } from '../data';
import { ChevronLeft, ChevronRight, Clock, Sparkles, AlertCircle, Play, Trash2 } from 'lucide-react';

interface TaskCalendarProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onGetAiSuggestions: (id: string) => void;
  isNightMode?: boolean;
}

export default function TaskCalendar({
  tasks,
  onSelectTask,
  onDeleteTask,
  onGetAiSuggestions,
  isNightMode = false,
}: TaskCalendarProps) {
  // Use today's initial date
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(() => {
    const baseDate = new Date();
    return baseDate;
  });
  
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => {
    return today.toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth(); // 0-11

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Helper to transition months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, monthIndex + 1, 1));
  };

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const groups: { [dateStr: string]: Task[] } = {};
    tasks.forEach(task => {
      if (task.dueDate) {
        if (!groups[task.dueDate]) {
          groups[task.dueDate] = [];
        }
        groups[task.dueDate].push(task);
      }
    });
    return groups;
  }, [tasks]);

  // Generate calendar cells
  const calendarCells = useMemo(() => {
    // First day of current month (0: Sunday, 1: Monday, etc.)
    const firstDayIndex = new Date(year, monthIndex, 1).getDay();
    // Total days in current month
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    // Total days in previous month
    const prevTotalDays = new Date(year, monthIndex, 0).getDate();

    const cells: Array<{
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      tasks: Task[];
    }> = [];

    // Fill in previous month's trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevTotalDays - i;
      const prevMonthDate = new Date(year, monthIndex - 1, prevDay);
      const dStr = prevMonthDate.toISOString().split('T')[0];
      cells.push({
        day: prevDay,
        dateStr: dStr,
        isCurrentMonth: false,
        tasks: tasksByDate[dStr] || [],
      });
    }

    // Fill in current month days
    for (let i = 1; i <= totalDays; i++) {
      const monthPart = String(monthIndex + 1).padStart(2, '0');
      const dayPart = String(i).padStart(2, '0');
      const dStr = `${year}-${monthPart}-${dayPart}`;
      
      cells.push({
        day: i,
        dateStr: dStr,
        isCurrentMonth: true,
        tasks: tasksByDate[dStr] || [],
      });
    }

    // Fill in next month leading days to complete 6-row grid (42 cells)
    const remainingTo42 = 42 - cells.length;
    for (let i = 1; i <= remainingTo42; i++) {
      const nextMonthDate = new Date(year, monthIndex + 1, i);
      const dStr = nextMonthDate.toISOString().split('T')[0];
      cells.push({
        day: i,
        dateStr: dStr,
        isCurrentMonth: false,
        tasks: tasksByDate[dStr] || [],
      });
    }

    return cells;
  }, [year, monthIndex, tasksByDate]);

  // Get tasks due on the selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDateStr) return [];
    return tasksByDate[selectedDateStr] || [];
  }, [selectedDateStr, tasksByDate]);

  const getPresetForScore = (score: number) => {
    return STRESS_PRESETS[score] || STRESS_PRESETS[3];
  };

  return (
    <div className={`w-full rounded-3xl p-4 border shadow-xs space-y-4 transition-colors duration-500 ${
      isNightMode ? 'bg-[#151c2c]/85 border-slate-800/40 text-slate-100' : 'bg-white/70 backdrop-blur-md border-neutral-200 text-neutral-800'
    }`}>
      
      {/* Calendar Header Control */}
      <div className="flex items-center justify-between select-none">
        <h3 className={`text-sm font-bold font-display tracking-tight flex items-center gap-1.5 ${isNightMode ? 'text-slate-100' : 'text-neutral-800'}`}>
          <span className={`w-2.5 h-2.5 rounded-full inline-block ${isNightMode ? 'bg-teal-400' : 'bg-[#00897B]'}`} />
          <span>{monthNames[monthIndex]} de {year}</span>
        </h3>
        
        <div className="flex items-center gap-1">
          <button
            id="btn-calendar-prev"
            onClick={handlePrevMonth}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isNightMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100' : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="btn-calendar-next"
            onClick={handleNextMonth}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isNightMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100' : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid structure */}
      <div className="space-y-1 select-none">
        {/* Week Days */}
        <div className={`grid grid-cols-7 text-center font-mono text-[10px] uppercase font-bold pb-1.5 border-b ${
          isNightMode ? 'text-slate-500 border-slate-800/30' : 'text-neutral-400 border-neutral-100'
        }`}>
          <span>Dom</span>
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 pt-1">
          {calendarCells.map((cell, idx) => {
            const isToday = cell.dateStr === today.toISOString().split('T')[0];
            const isSelected = cell.dateStr === selectedDateStr;
            const hasBurdens = cell.tasks.length > 0;
            
            return (
              <button
                key={idx}
                id={`calendar-day-${cell.dateStr}`}
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer text-xs font-semibold ${
                  !cell.isCurrentMonth 
                    ? isNightMode ? 'text-slate-600 hover:bg-slate-900/10' : 'text-neutral-300 hover:bg-neutral-100/40' 
                    : isSelected
                    ? isNightMode ? 'bg-teal-600 text-white shadow-xs' : 'bg-neutral-900 text-white shadow-xs'
                    : isToday
                    ? isNightMode ? 'bg-teal-950/40 text-teal-400 border border-teal-900/30' : 'bg-[#E0F2F1] text-[#00897B] border border-[#B2DFDB]'
                    : isNightMode ? 'text-slate-300 hover:bg-slate-800' : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span>{cell.day}</span>

                {/* Task dot counts */}
                {hasBurdens && (
                  <div className="absolute bottom-1 flex gap-0.5 justify-center max-w-full overflow-hidden px-0.5">
                    {cell.tasks.slice(0, 3).map((task, bitIdx) => {
                      const bulletColor = task.stressScore >= 4 
                        ? '#E67E22' 
                        : task.stressScore === 3 
                          ? '#D4AC0D' 
                          : '#00897B';
                      return (
                        <span
                          key={bitIdx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: bulletColor }}
                          title={task.title}
                        />
                      );
                    })}
                    {cell.tasks.length > 3 && (
                      <span className="text-[7px] leading-none mb-0.5 text-neutral-400 font-bold">+</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day list details below */}
      <div className={`pt-2 border-t ${isNightMode ? 'border-slate-800/40' : 'border-neutral-200/60'}`}>
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
            {selectedDateStr === today.toISOString().split('T')[0]
              ? 'Pendientes para Hoy'
              : `Entregas del ${selectedDateStr ? new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : ''}`
            }
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
            isNightMode ? 'bg-slate-900 text-slate-300' : 'bg-neutral-100 text-neutral-600'
          }`}>
            {selectedDateTasks.length} pendientes
          </span>
        </div>

        <div className="space-y-2">
          {selectedDateTasks.length === 0 ? (
            <p className={`text-[11px] italic text-center py-4 rounded-2xl border ${
              isNightMode ? 'text-slate-500 bg-slate-950/25 border-slate-800/60' : 'text-neutral-400 bg-neutral-50 border-neutral-100'
            }`}>
              No hay pendientes programados para este día. ¡Libertad absoluta!
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {selectedDateTasks.map((task) => {
                const preset = getPresetForScore(task.stressScore);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-3 border rounded-2xl flex flex-col gap-2 relative shadow-2xs group transition-all ${
                      isNightMode ? 'bg-[#0f1624] border-slate-800/40 hover:border-slate-700' : 'bg-white border-neutral-200/70 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-md uppercase ${
                          isNightMode ? 'bg-slate-900 text-slate-400' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {task.category}
                        </span>
                        <h4 className={`text-xs font-bold tracking-tight leading-snug truncate ${
                          isNightMode ? 'text-slate-200' : 'text-neutral-800'
                        }`}>
                          {task.title}
                        </h4>
                      </div>
                      
                      <button
                        id={`btn-calendar-task-delete-${task.id}`}
                        onClick={() => onDeleteTask(task.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isNightMode ? 'text-slate-500 hover:text-red-400 hover:bg-slate-900' : 'text-neutral-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                        title="Eliminar pendiente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* AI Advisor inside calendar cell description */}
                    {task.aiSuggestions ? (
                      <div className={`p-2.5 border rounded-xl text-[10px] space-y-1.5 ${
                        isNightMode ? 'bg-teal-950/20 border-teal-900/30' : 'bg-[#E0F2F1]/30 border-[#B2DFDB]/30'
                      }`}>
                        <div className={`flex items-center gap-1 font-bold ${isNightMode ? 'text-teal-300' : 'text-[#00796B]'}`}>
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>MANTRA: {task.aiSuggestions.mantra}</span>
                        </div>
                        <ol className={`list-decimal pl-3 space-y-0.5 font-medium ${isNightMode ? 'text-slate-400' : 'text-neutral-600'}`}>
                          {task.aiSuggestions.steps.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ol>
                      </div>
                    ) : task.aiSuggestionsLoading ? (
                      <div className={`p-2.5 border rounded-xl text-[10px] font-mono animate-pulse flex items-center gap-1.5 ${
                        isNightMode ? 'bg-slate-900/50 border-slate-800/30 text-slate-400' : 'bg-neutral-50 border-neutral-200/30 text-neutral-500'
                      }`}>
                        <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                        <span>Analizando micro-pasos de paz...</span>
                      </div>
                    ) : (
                      <button
                        id={`btn-cal-ai-suggest-${task.id}`}
                        onClick={() => onGetAiSuggestions(task.id)}
                        className={`flex items-center gap-1 px-2 py-1 text-[10px] font-semibold font-mono rounded-lg self-start cursor-pointer border transition-colors ${
                          isNightMode 
                            ? 'bg-teal-950/60 hover:bg-teal-900 text-teal-300 border-teal-850' 
                            : 'bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#00897B] border border-[#B2DFDB]/40'
                        }`}
                      >
                        <Sparkles className={`w-3 h-3 ${isNightMode ? 'text-teal-400' : 'text-[#00796B]'}`} />
                        <span>💡 ¿Cómo empiezo?</span>
                      </button>
                    )}

                    <div className={`flex items-center justify-between pt-1 border-t ${isNightMode ? 'border-slate-800/40' : 'border-neutral-100'}`}>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedMinutes} min sugeridos</span>
                      </div>

                      <button
                        id={`btn-calendar-task-start-${task.id}`}
                        onClick={() => onSelectTask(task)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg shadow-sm transition-all cursor-pointer ${
                          isNightMode ? 'text-white bg-teal-600 hover:bg-teal-500' : 'text-white bg-neutral-900 hover:bg-neutral-800'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Comenzar</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

    </div>
  );
}
