export type StressLevel = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  category: string;
  stressLevel: StressLevel;
  stressScore: number; // 1-5
  stressLabel: string; // "Un paseo", "Fácil", "Moderado", "Pesado", "Pesadilla"
  estimatedMinutes: number;
  dueDate?: string; // Format 'YYYY-MM-DD'
  createdAt: string;
  status: 'pending' | 'completed';
  aiSuggestions?: {
    introduction: string;
    steps: string[];
    mantra: string;
    studyResources?: Array<{
      type: string;
      title: string;
      urlOrQuery: string;
      whyHelpful: string;
    }>;
  };
  aiSuggestionsLoading?: boolean;
  aiSuggestionsCollapsed?: boolean;
}

export interface FocusSession {
  taskId: string;
  taskTitle: string;
  stressLevel: StressLevel;
  minutesFocused: number;
  timestamp: string;
  statusFinished: 'completed' | 'timeout' | 'interrupted';
}

export interface EmpathyQuote {
  quote: string;
  author?: string;
}

export interface QueuedAction {
  id: string;
  type: 'CREATE_TASK' | 'DELETE_TASK' | 'CREATE_SESSION';
  payload: any;
  timestamp: string;
  userUid: string;
}

