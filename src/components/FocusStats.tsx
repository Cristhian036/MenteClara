import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { FocusSession } from '../types';
import { BarChart3, HelpCircle, Flame, CheckCircle2 } from 'lucide-react';

interface FocusStatsProps {
  history: FocusSession[];
  isNightMode?: boolean;
}

export default function FocusStats({ history, isNightMode = false }: FocusStatsProps) {
  const [dailyTarget, setDailyTarget] = useState<number>(30);
  const [showTooltipInfo, setShowTooltipInfo] = useState(false);

  // Generate data for the last 7 days
  const chartData = useMemo(() => {
    const daysData = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

      // Calculate minutes for this date
      const daysSessions = history.filter(session => {
        if (!session.timestamp) return false;
        try {
          const sDate = new Date(session.timestamp).toISOString().split('T')[0];
          return sDate === dateStr;
        } catch {
          return false;
        }
      });

      const totalMinutes = daysSessions.reduce((acc, curr) => acc + (curr.minutesFocused || 0), 0);
      
      daysData.push({
        dateStr,
        dayLabel: label,
        'Minutos enfocados': totalMinutes,
        'Meta recomendada': dailyTarget,
      });
    }

    return daysData;
  }, [history, dailyTarget]);

  // Find the maximum value in the data to scale the YAxis nicely
  const maxMinutesInHistory = useMemo(() => {
    const vals = chartData.map(d => d['Minutos enfocados'] as number);
    return Math.max(...vals, dailyTarget, 15);
  }, [chartData, dailyTarget]);

  const maxDomain = Math.ceil((maxMinutesInHistory + 5) / 5) * 5;

  // Aggregate metrics
  const statsSummary = useMemo(() => {
    const totalMinutes = history.reduce((acc, curr) => acc + (curr.minutesFocused || 0), 0);
    const sessionsCompleted = history.filter(s => s.statusFinished === 'completed' || s.statusFinished === 'timeout').length;
    
    // Calculate streak
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const uniqueDaysWithFocus = new Set(
      history.map(s => {
        try {
          return new Date(s.timestamp).toISOString().split('T')[0];
        } catch {
          return '';
        }
      }).filter(Boolean)
    );

    // Count backwards from today
    let checkDate = new Date();
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (uniqueDaysWithFocus.has(checkStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If it was yesterday and today hasn't been focused yet, we can keep the streak alive
        if (checkStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = checkDate.toISOString().split('T')[0];
          if (uniqueDaysWithFocus.has(yesterdayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    return {
      totalMinutes,
      sessionsCompleted,
      streak
    };
  }, [history]);

  // Custom tooltips for recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const target = payload[1]?.value || dailyTarget;
      const difference = value - target;

      return (
        <div className={`border p-3 rounded-2xl shadow-lg text-[10px] font-mono leading-relaxed space-y-1 select-none transition-colors duration-300 ${
          isNightMode 
            ? 'bg-slate-950 border-slate-800 text-slate-200' 
            : 'bg-neutral-900 border-neutral-800 text-white'
        }`}>
          <p className={`font-bold border-b pb-1 ${isNightMode ? 'border-slate-850 text-slate-400' : 'border-neutral-800 text-neutral-300'}`}>
            {payload[0].payload.dayLabel}
          </p>
          <p className={`${isNightMode ? 'text-teal-400' : 'text-[#00897B]'} font-bold`}>
            ⏱️ Enfoque: {value} min
          </p>
          <p className="text-neutral-450">
            🎯 Meta: {target} min
          </p>
          {value >= target ? (
            <p className={`font-bold flex items-center gap-1 pt-0.5 border-t ${isNightMode ? 'border-slate-850 text-amber-400' : 'border-neutral-850 text-amber-500'}`}>
              <CheckCircle2 className={`w-3 h-3 ${isNightMode ? 'text-teal-400' : 'text-[#00897B]'}`} /> ¡Meta lograda!
            </p>
          ) : value > 0 ? (
            <p className={`italic pt-0.5 border-t ${isNightMode ? 'border-slate-850 text-slate-500' : 'border-neutral-850 text-neutral-500'}`}>
              Faltaron {Math.abs(difference)} min. ¡Cada segundo cuenta!
            </p>
          ) : (
            <p className={`italic pt-0.5 border-t ${isNightMode ? 'border-slate-850 text-slate-500' : 'border-neutral-850 text-neutral-550'}`}>
              ¡Buen día para descansar tu mente!
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`mx-6 mb-4 p-4 rounded-3xl border shadow-xs space-y-3 transition-colors duration-500 ${
      isNightMode ? 'bg-[#151c2c]/85 border-slate-805/40 text-slate-100' : 'bg-white/70 backdrop-blur-md border-neutral-200/80'
    }`}>
      <div className="flex justify-between items-center select-none">
        <h3 className={`text-sm font-bold font-display tracking-tight flex items-center gap-1.5 ${isNightMode ? 'text-slate-100' : 'text-neutral-800'}`}>
          <BarChart3 className={`w-4 h-4 ${isNightMode ? 'text-teal-400' : 'text-[#00897B]'}`} />
          <span>Rendimiento y Dosis de Paz</span>
        </h3>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[9px] text-neutral-400 font-mono">
            <span>Meta:</span>
            <select
              id="select-daily-target"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Number(e.target.value))}
              className={`px-1 py-0.5 rounded font-bold cursor-pointer outline-none transition-colors ${
                isNightMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:border-neutral-305'
              }`}
            >
              <option value="15">15m</option>
              <option value="25">25m</option>
              <option value="30">30m</option>
              <option value="45">45m</option>
              <option value="60">60m</option>
            </select>
          </div>
          
          <button
            id="btn-stats-info-tooltip"
            onClick={() => setShowTooltipInfo(!showTooltipInfo)}
            className={`p-0.5 rounded transition-colors cursor-pointer ${isNightMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-neutral-100 text-neutral-400 hover:text-slate-705'}`}
            title="Saber más sobre metas de paz"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showTooltipInfo && (
        <div className={`p-2.5 border rounded-xl text-[10px] leading-relaxed italic animate-in fade-in duration-150 ${
          isNightMode ? 'bg-teal-950/20 border-teal-900/30 text-slate-350' : 'bg-[#E0F2F1]/40 border-[#B2DFDB]/30 text-neutral-605'
        }`}>
          💡 <strong>Filosofía de MenteClara:</strong> Creemos en el progreso constante sin castigo. Las metas están ahí para motivarte, no para culparte. Si un día marcas 0, celebrated como un día de merecido descanso mental.
        </div>
      )}

      {/* Grid Quick Indicators */}
      <div className="grid grid-cols-3 gap-2 py-1 select-none">
        <div className={`p-2 rounded-2xl border flex flex-col justify-center items-center text-center transition-colors ${
          isNightMode ? 'bg-slate-900/40 border-slate-805/30' : 'bg-white/60 border-neutral-100'
        }`}>
          <span className="text-[8px] font-mono text-neutral-450 uppercase tracking-wider">Total Enfoque</span>
          <span className={`text-xs font-bold font-mono ${isNightMode ? 'text-slate-200' : 'text-neutral-800'}`}>{statsSummary.totalMinutes} min</span>
        </div>
        <div className={`p-2 rounded-2xl border flex flex-col justify-center items-center text-center transition-colors ${
          isNightMode ? 'bg-slate-900/40 border-slate-805/30' : 'bg-white/60 border-neutral-100'
        }`}>
          <span className="text-[8px] font-mono text-neutral-455 uppercase tracking-wider">Sesiones OK</span>
          <span className={`text-xs font-bold font-mono ${isNightMode ? 'text-slate-205' : 'text-neutral-805'}`}>{statsSummary.sessionsCompleted}</span>
        </div>
        <div className={`p-2 rounded-2xl border flex flex-col justify-center items-center text-center transition-colors ${
          isNightMode ? 'bg-orange-950/20 border-orange-900/30' : 'bg-[#FFE0B2]/30 border-[#FFE0B2]/30'
        }`}>
          <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-0.5">Racha <Flame className="w-2.5 h-2.5 text-[#D35400] fill-[#D35400]" /></span>
          <span className={`text-xs font-bold font-mono ${isNightMode ? 'text-orange-355' : 'text-neutral-850'}`}>{statsSummary.streak} {statsSummary.streak === 1 ? 'día' : 'días'}</span>
        </div>
      </div>

      {/* Chart container */}
      <div className="w-full h-[150px] relative mt-1 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isNightMode ? '#1e293b' : '#E5E5E5'} />
            
            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 8, fontFamily: 'monospace', fill: isNightMode ? '#4b5563' : '#888' }}
            />
            
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 8, fontFamily: 'monospace', fill: isNightMode ? '#4b5563' : '#888' }}
              domain={[0, maxDomain]}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine
              y={dailyTarget}
              stroke={isNightMode ? '#1e293b' : '#B2DFDB'}
              strokeDasharray="4 4"
              label={{
                value: `Meta: ${dailyTarget}m`,
                position: 'top',
                fontSize: 7,
                fontFamily: 'monospace',
                fill: isNightMode ? '#5f708a' : '#00897B'
              }}
            />

            <Line
              type="monotone"
              dataKey="Minutos enfocados"
              stroke={isNightMode ? '#2dd4bf' : '#00897B'}
              strokeWidth={3}
              dot={{ stroke: isNightMode ? '#2dd4bf' : '#00897B', strokeWidth: 1.5, r: 3.5, fill: isNightMode ? '#0f172a' : '#fff' }}
              activeDot={{ r: 5, strokeWidth: 0, fill: isNightMode ? '#2dd4bf' : '#00897B' }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
    </div>
  );
}
