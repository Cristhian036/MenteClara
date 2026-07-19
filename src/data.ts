import { Task, StressLevel } from './types';

export const DEFAULTS_CATEGORIES = [
  'Trabajo Final / Proyecto',
  'Práctica Calificada (PC)',
  'Examen Parcial / Final',
  'Lectura Académica',
  'Estudio Individual',
  'Laboratorio / Taller'
];

export interface StressPreset {
  score: number;
  label: string;
  level: StressLevel;
  recommendedMinutes: number;
  colorClass: {
    bg: string;
    border: string;
    text: string;
    pill: string;
    description: string;
  };
}

export const STRESS_PRESETS: Record<number, StressPreset> = {
  1: {
    score: 1,
    label: 'Un paseo',
    level: 'low',
    recommendedMinutes: 20,
    colorClass: {
      bg: 'bg-[#EBFDFB]',
      border: 'border-[#99F6E4]',
      text: 'text-[#005D54]',
      pill: 'bg-[#005D54]/10 text-[#005D54]',
      description: 'Carga mental insignificante. Ideal para arrancar sin esfuerzo.'
    }
  },
  2: {
    score: 2,
    label: 'Ligera',
    level: 'low',
    recommendedMinutes: 25,
    colorClass: {
      bg: 'bg-[#EBFDFB]',
      border: 'border-[#5EEAD4]',
      text: 'text-[#004D40]',
      pill: 'bg-[#004D40]/10 text-[#004D40]',
      description: 'Fácil de resolver, apenas requiere esfuerzo de concentración.'
    }
  },
  3: {
    score: 3,
    label: 'Moderada',
    level: 'medium',
    recommendedMinutes: 25,
    colorClass: {
      bg: 'bg-[#FEFCE8]',
      border: 'border-[#FDE047]',
      text: 'text-[#713F12]',
      pill: 'bg-[#713F12]/10 text-[#713F12]',
      description: 'Requiere atención pero es perfectamente manejable paso a paso.'
    }
  },
  4: {
    score: 4,
    label: 'Pesada',
    level: 'high',
    recommendedMinutes: 18,
    colorClass: {
      bg: 'bg-[#FFF7ED]',
      border: 'border-[#FED7AA]',
      text: 'text-[#7C2D12]',
      pill: 'bg-[#7C2D12]/10 text-[#7C2D12]',
      description: 'Se siente agobiante. Bloque ultra corto para romper la inercia.'
    }
  },
  5: {
    score: 5,
    label: 'Pesadilla',
    level: 'high',
    recommendedMinutes: 15,
    colorClass: {
      bg: 'bg-[#FEF2F2]',
      border: 'border-[#FCA5A5]',
      text: 'text-[#7F1D1D]',
      pill: 'bg-[#7F1D1D]/10 text-[#7F1D1D]',
      description: 'Genera parálisis visual. Bloque cortísimo para no asustar a tu cerebro.'
    }
  }
};

export const EMPATHIC_QUOTES = [
  {
    quote: "No tienes que terminar toda la tarea hoy, solo dale un vistazo por 5 minutos. Tu paz mental vale más que cualquier nota perfecta.",
  },
  {
    quote: "La parálisis por análisis es solo tu cerebro intentando protegerte de sentirte abrumado. Abrazamos la imperfección y empecemos con un solo párrafo.",
  },
  {
    quote: "Respira hondo. Estudiar es un proceso, no una carrera de resistencia. Estás haciendo lo mejor que puedes con los recursos que tienes.",
  },
  {
    quote: "Incluso si solo logras sentarte un momento, ya es una victoria sobre la inercia. Un paso pequeño sigue siendo avanzar.",
  },
  {
    quote: "Desconecta el ruido del exterior. En este momento, solo importan este espacio seguro y tú. Vamos despacio, sin prisa.",
  },
  {
    quote: "Equivocarse e intentar de nuevo es parte del aprendizaje real. Si te sientes cansado, aprende a descansar, no a rendirte.",
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Informe final de IHC: Análisis Heurístico Completo',
    category: 'Trabajo Final / Proyecto',
    stressLevel: 'high',
    stressScore: 5,
    stressLabel: 'Pesadilla',
    estimatedMinutes: 15,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0], // En 2 días
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'pending'
  },
  {
    id: 'task-2',
    title: 'Repasar teoría de límites y derivadas dobles para la PC3',
    category: 'Práctica Calificada (PC)',
    stressLevel: 'medium',
    stressScore: 3,
    stressLabel: 'Moderada',
    estimatedMinutes: 25,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0], // En 5 días
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'pending'
  },
  {
    id: 'task-3',
    title: 'Subir avance de Figma y bosquejos del flujo de usuario',
    category: 'Estudio Individual',
    stressLevel: 'low',
    stressScore: 1,
    stressLabel: 'Un paseo',
    estimatedMinutes: 20,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString().split('T')[0], // Mañana
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'pending'
  }
];
