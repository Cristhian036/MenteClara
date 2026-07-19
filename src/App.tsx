import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, FocusSession, StressLevel, QueuedAction } from './types';
import { INITIAL_TASKS, STRESS_PRESETS, DEFAULTS_CATEGORIES } from './data';
import TaskCard from './components/TaskCard';
import FocusVortex from './components/FocusVortex';
import QuickAddModal from './components/QuickAddModal';
import FocusMode from './components/FocusMode';
import TaskCalendar from './components/TaskCalendar';
import FocusStats from './components/FocusStats';
import AuthAndProfileModal from './components/AuthAndProfileModal';
import FullScreenAuth from './components/FullScreenAuth';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { Plus, Coffee, Sparkles, BrainCircuit, BarChart3, CloudSnow, ArrowUpRight, HelpCircle, Activity, Heart, RefreshCcw, Calendar, ListTodo, Moon, Sun, Bell, BellOff, Wifi, WifiOff } from 'lucide-react';
import { auth, loginWithGoogle, onAuthStateChanged, signOut } from './lib/auth.ts';

const getApiBase = (): string => {
  const url = import.meta.env.VITE_API_URL;
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  return '';
};

const API_BASE = getApiBase();

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Offline and synchronization states
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      return navigator.onLine;
    }
    return true;
  });
  const [syncQueue, setSyncQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<FocusSession[]>([]);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [isHoveringVortex, setIsHoveringVortex] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [activeSection, setActiveSection] = useState<'respirar' | 'pendientes' | 'progreso'>('respirar');
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('menteclara_night_mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('menteclara_night_mode', String(isNightMode));
    } catch (e) {
      console.error(e);
    }
  }, [isNightMode]);

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('menteclara_notifications_enabled') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('menteclara_notifications_enabled', String(notificationsEnabled));
    } catch (e) {
      console.error(e);
    }
  }, [notificationsEnabled]);

  const [notificationStatusMsg, setNotificationStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (notificationStatusMsg) {
      const timer = setTimeout(() => {
        setNotificationStatusMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationStatusMsg]);

  const vortexRef = useRef<HTMLDivElement | null>(null);

  // Load from local storage (Fallback/Guest mode)
  const loadLocalState = () => {
    try {
      const storedTasks = localStorage.getItem('menteclara_tasks_v2');
      if (storedTasks) {
        const loadedTasks: Task[] = JSON.parse(storedTasks);
        const cleanTasks = loadedTasks.map(t => ({
          ...t,
          aiSuggestionsLoading: false,
          aiSuggestionsCollapsed: true
        }));
        setTasks(cleanTasks);
      } else {
        const cleanInitial = INITIAL_TASKS.map(t => ({
          ...t,
          aiSuggestionsLoading: false,
          aiSuggestionsCollapsed: true
        }));
        setTasks(cleanInitial);
        localStorage.setItem('menteclara_tasks_v2', JSON.stringify(cleanInitial));
      }

      const storedHistory = localStorage.getItem('menteclara_history_v2');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      } else {
        const initialMockHistory = [
          {
            taskId: 'task-mock-1',
            taskTitle: 'Repasar teoría de límites y derivadas dobles para la PC3',
            stressLevel: 'medium' as StressLevel,
            minutesFocused: 35,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // Yesterday
            statusFinished: 'completed' as const
          },
          {
            taskId: 'task-mock-2',
            taskTitle: 'Subir avance de Figma y bosquejos del flujo de usuario',
            stressLevel: 'low' as StressLevel,
            minutesFocused: 25,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            statusFinished: 'completed' as const
          },
          {
            taskId: 'task-mock-3',
            taskTitle: 'Informe final de IHC: Análisis Heurístico Completo',
            stressLevel: 'high' as StressLevel,
            minutesFocused: 40,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
            statusFinished: 'completed' as const
          },
          {
            taskId: 'task-mock-4',
            taskTitle: 'Investigar bibliografía de IHC',
            stressLevel: 'low' as StressLevel,
            minutesFocused: 20,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
            statusFinished: 'completed' as const
          },
          {
            taskId: 'task-mock-5',
            taskTitle: 'Figma diagramación de flujos iniciales',
            stressLevel: 'medium' as StressLevel,
            minutesFocused: 30,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
            statusFinished: 'completed' as const
          }
        ];
        setHistory(initialMockHistory);
        localStorage.setItem('menteclara_history_v2', JSON.stringify(initialMockHistory));
      }
    } catch (e) {
      console.error("Error restoring from localStorage", e);
      setTasks(INITIAL_TASKS);
    }
  };

  // Load sync queue from local storage
  const loadSyncQueue = (uid: string) => {
    try {
      const stored = localStorage.getItem(`menteclara_sync_queue_${uid}`);
      if (stored) {
        setSyncQueue(JSON.parse(stored));
      } else {
        setSyncQueue([]);
      }
    } catch (e) {
      console.error('Error loading sync queue', e);
      setSyncQueue([]);
    }
  };

  // Save sync queue to local storage
  const saveSyncQueue = (uid: string, queue: QueuedAction[]) => {
    setSyncQueue(queue);
    try {
      localStorage.setItem(`menteclara_sync_queue_${uid}`, JSON.stringify(queue));
    } catch (e) {
      console.error('Error saving sync queue', e);
    }
  };

  // Sync offline queue to Render database
  const syncOfflineQueue = async (customToken?: string) => {
    const token = customToken || userToken || (await auth.currentUser?.getIdToken());
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (!token || !uid) return;

    // Load queue fresh to prevent stale values
    let currentQueue: QueuedAction[] = [];
    try {
      const stored = localStorage.getItem(`menteclara_sync_queue_${uid}`);
      if (stored) currentQueue = JSON.parse(stored);
    } catch (e) {}

    if (currentQueue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccessMsg(null);

    const queueToProcess = [...currentQueue];
    let succeededCount = 0;
    let failedNetwork = false;

    for (let i = 0; i < queueToProcess.length; i++) {
      const action = queueToProcess[i];
      try {
        if (action.type === 'CREATE_TASK') {
          const res = await fetch(`${API_BASE}/api/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(action.payload)
          });
          if (!res.ok && res.status >= 500) {
            throw new Error(`Server error: ${res.status}`);
          }
        } else if (action.type === 'DELETE_TASK') {
          const res = await fetch(`${API_BASE}/api/tasks/${action.payload.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok && res.status >= 500) {
            throw new Error(`Server error: ${res.status}`);
          }
        } else if (action.type === 'CREATE_SESSION') {
          const res = await fetch(`${API_BASE}/api/sessions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(action.payload)
          });
          if (!res.ok && res.status >= 500) {
            throw new Error(`Server error: ${res.status}`);
          }
        }
        
        succeededCount++;
      } catch (err: any) {
        console.error(`Error synchronizing action ${action.id}:`, err);
        failedNetwork = true;
        break;
      }
    }

    const remainingQueue = queueToProcess.slice(succeededCount);
    saveSyncQueue(uid, remainingQueue);
    setIsSyncing(false);

    if (failedNetwork) {
      setSyncError("Conexión inestable con el servidor. Se reintentará la sincronización más tarde.");
    } else if (succeededCount > 0 && remainingQueue.length === 0) {
      setSyncSuccessMsg(`¡Sincronización completada! ${succeededCount} acciones sincronizadas.`);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
      // Fetch latest states from database to guarantee local view matches server database
      await fetchTasksAndSessionsFromDb(token, uid);
    }
  };

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNotificationStatusMsg("¡Conexión recuperada! Sincronizando datos...");
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNotificationStatusMsg("Modo sin conexión activado. Tus acciones se guardarán localmente.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor online and token changes to auto-trigger queue sync
  useEffect(() => {
    if (isOnline && userToken && currentUser && syncQueue.length > 0 && !isSyncing) {
      syncOfflineQueue();
    }
  }, [isOnline, userToken, currentUser, syncQueue.length]);

  // Sync tasks and focus sessions with the Cloud SQL database
  const fetchTasksAndSessionsFromDb = async (token: string, userUid?: string) => {
    const uid = userUid || currentUser?.uid || auth.currentUser?.uid;
    setDbLoading(true);
    try {
      // Register or verify database profile on login
      const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!registerRes.ok) {
        const rawText = await registerRes.text().catch(() => '');
        console.error('Fetch registration failed with status:', registerRes.status, 'Body:', rawText);
        let serverError = 'Error desconocido';
        try {
          const errorData = JSON.parse(rawText);
          serverError = errorData.error || errorData.message || 'Error desconocido';
        } catch (_) {}
        throw new Error(`No se pudo verificar el usuario en la base de datos: ${serverError}`);
      }

      // Fetch Tasks
      const tasksRes = await fetch(`${API_BASE}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (tasksRes.ok) {
        const dbTasks = await tasksRes.json();
        const cleanTasks = dbTasks.map((t: any) => ({
          ...t,
          aiSuggestionsLoading: false,
          aiSuggestionsCollapsed: true
        }));
        setTasks(cleanTasks);
        if (uid) {
          try {
            localStorage.setItem(`menteclara_tasks_user_${uid}`, JSON.stringify(cleanTasks));
          } catch (e) {}
        }
      }

      // Fetch Sessions
      const sessionsRes = await fetch(`${API_BASE}/api/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (sessionsRes.ok) {
        const dbSessions = await sessionsRes.json();
        setHistory(dbSessions);
        if (uid) {
          try {
            localStorage.setItem(`menteclara_sessions_user_${uid}`, JSON.stringify(dbSessions));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error syncing with database, loading local cache:', err);
      // Fallback to local user cache
      if (uid) {
        try {
          const cachedTasks = localStorage.getItem(`menteclara_tasks_user_${uid}`);
          if (cachedTasks) {
            setTasks(JSON.parse(cachedTasks));
          }
          const cachedSessions = localStorage.getItem(`menteclara_sessions_user_${uid}`);
          if (cachedSessions) {
            setHistory(JSON.parse(cachedSessions));
          }
        } catch (e) {
          console.error('Error loading offline user cache', e);
        }
      }
    } finally {
      setDbLoading(false);
    }
  };

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          const token = await user.getIdToken();
          setUserToken(token);
          loadSyncQueue(user.uid);
          await fetchTasksAndSessionsFromDb(token, user.uid);
        } else {
          setCurrentUser(null);
          setUserToken(null);
          setSyncQueue([]);
          loadLocalState();
        }
      } catch (err) {
        console.error("Error inside onAuthStateChanged:", err);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleProfileRefresh = () => {
    if (auth.currentUser) {
      setCurrentUser({
        ...auth.currentUser,
        displayName: auth.currentUser.displayName,
        photoURL: auth.currentUser.photoURL,
        email: auth.currentUser.email
      });
    }
  };

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      setDbLoading(true);
      await signOut();
      setNotificationStatusMsg("Sesión cerrada correctamente. Volviendo al modo demostración.");
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setDbLoading(false);
    }
  };

  // Standard save tasks fallback helper for guest mode
  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    try {
      localStorage.setItem('menteclara_tasks_v2', JSON.stringify(updatedTasks));
    } catch (e) {
      console.error(e);
    }
  };



  // Al cambiar de pestaña/sección, ocultar (colapsar) los detalles de los pendientes sin borrarlos
  useEffect(() => {
    setTasks(prevTasks => {
      const hasSomeExpanded = prevTasks.some(t => t.aiSuggestions && t.aiSuggestionsCollapsed !== true);
      if (!hasSomeExpanded) return prevTasks;
      
      const updated = prevTasks.map(t => t.aiSuggestions ? {
        ...t,
        aiSuggestionsCollapsed: true
      } : t);
      
      try {
        localStorage.setItem('menteclara_tasks_v2', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, [activeSection]);

  const handleToggleSuggestionsCollapse = (taskId: string, collapsed: boolean) => {
    setTasks(prevTasks => {
      const updated = prevTasks.map(t => t.id === taskId ? {
        ...t,
        aiSuggestionsCollapsed: collapsed
      } : t);
      try {
        localStorage.setItem('menteclara_tasks_v2', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // Optimistic UI update
    setTasks(prev => [newTask, ...prev]);

    if (currentUser && userToken) {
      // Save locally to offline user cache
      try {
        const cached = localStorage.getItem(`menteclara_tasks_user_${currentUser.uid}`);
        const currentCached = cached ? JSON.parse(cached) : [];
        localStorage.setItem(`menteclara_tasks_user_${currentUser.uid}`, JSON.stringify([newTask, ...currentCached]));
      } catch (e) {}

      if (isOnline) {
        try {
          const response = await fetch(`${API_BASE}/api/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(newTask)
          });
          if (!response.ok) throw new Error('No se pudo guardar la tarea en el servidor.');
          const savedTask = await response.json();
          
          // Replace with real backend-saved task
          setTasks(prev => prev.map(t => t.id === newTask.id ? { ...savedTask, aiSuggestionsLoading: false, aiSuggestionsCollapsed: true } : t));
          
          try {
            const cached = localStorage.getItem(`menteclara_tasks_user_${currentUser.uid}`);
            if (cached) {
              const currentCached: Task[] = JSON.parse(cached);
              const updatedCached = currentCached.map(t => t.id === newTask.id ? savedTask : t);
              localStorage.setItem(`menteclara_tasks_user_${currentUser.uid}`, JSON.stringify(updatedCached));
            }
          } catch (e) {}
        } catch (err) {
          console.error("Error creating task, queueing action:", err);
          const action: QueuedAction = {
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'CREATE_TASK',
            payload: newTask,
            timestamp: new Date().toISOString(),
            userUid: currentUser.uid
          };
          saveSyncQueue(currentUser.uid, [...syncQueue, action]);
        }
      } else {
        console.log("Offline: queuing task creation.");
        const action: QueuedAction = {
          id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'CREATE_TASK',
          payload: newTask,
          timestamp: new Date().toISOString(),
          userUid: currentUser.uid
        };
        saveSyncQueue(currentUser.uid, [...syncQueue, action]);
      }
    } else {
      const updated = [newTask, ...tasks];
      saveTasks(updated);
    }
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setTaskToDelete(task);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    const id = taskToDelete.id;

    // Optimistically remove from state
    setTasks(prev => prev.filter(t => t.id !== id));

    if (currentUser && userToken) {
      // Remove from offline user cache
      try {
        const cached = localStorage.getItem(`menteclara_tasks_user_${currentUser.uid}`);
        if (cached) {
          const currentCached: Task[] = JSON.parse(cached);
          const updatedCached = currentCached.filter(t => t.id !== id);
          localStorage.setItem(`menteclara_tasks_user_${currentUser.uid}`, JSON.stringify(updatedCached));
        }
      } catch (e) {}

      // Optimize queue: if there is a CREATE_TASK action in the queue for this task ID, just remove it!
      const hasCreateActionInQueue = syncQueue.some(action => action.type === 'CREATE_TASK' && action.payload.id === id);
      if (hasCreateActionInQueue) {
        console.log("Optimizing queue: removing offline-created task from queue instead of sending to backend.");
        const filteredQueue = syncQueue.filter(action => !(action.type === 'CREATE_TASK' && action.payload.id === id));
        saveSyncQueue(currentUser.uid, filteredQueue);
        setTaskToDelete(null);
        return;
      }

      if (isOnline) {
        try {
          const response = await fetch(`${API_BASE}/api/tasks/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${userToken}`
            }
          });
          if (!response.ok) throw new Error('No se pudo eliminar la tarea en el servidor.');
        } catch (err) {
          console.error("Error deleting task directly, queuing offline action:", err);
          const action: QueuedAction = {
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'DELETE_TASK',
            payload: { id },
            timestamp: new Date().toISOString(),
            userUid: currentUser.uid
          };
          saveSyncQueue(currentUser.uid, [...syncQueue, action]);
        }
      } else {
        console.log("Device offline, queuing task deletion.");
        const action: QueuedAction = {
          id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'DELETE_TASK',
          payload: { id },
          timestamp: new Date().toISOString(),
          userUid: currentUser.uid
        };
        saveSyncQueue(currentUser.uid, [...syncQueue, action]);
      }
    } else {
      const updated = tasks.filter(t => t.id !== id);
      saveTasks(updated);
    }
    setTaskToDelete(null);
  };

  const handleFetchAiSuggestions = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const loadingTasks = tasks.map(t => t.id === taskId ? { ...t, aiSuggestionsLoading: true } : t);
    setTasks(loadingTasks);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("AI suggestions request timed out after 30 seconds. Aborting and using fallback.");
      controller.abort();
    }, 30000);

    try {
      const response = await fetch(`${API_BASE}/api/suggest-start`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {})
        },
        body: JSON.stringify({
          title: task.title,
          category: task.category,
          stressLevel: task.stressLevel,
          stressLabel: task.stressLabel,
          taskId: task.id
        })
      });

      clearTimeout(timeoutId);

      let suggestions;
      if (!response.ok) {
        try {
          const errData = await response.json();
          if (errData && errData.introduction && errData.steps && errData.mantra) {
            suggestions = errData;
            console.warn("Se obtuvieron sugerencias de respaldo debido a un error en el servidor:", errData.details || errData.error);
          } else {
            throw new Error(errData?.error || 'No se pudo obtener sugerencias');
          }
        } catch (e) {
          throw new Error('No se pudo obtener sugerencias');
        }
      } else {
        suggestions = await response.json();
      }

      setTasks(prevTasks => {
        const updated = prevTasks.map(t => t.id === taskId ? {
          ...t,
          aiSuggestions: suggestions,
          aiSuggestionsLoading: false,
          aiSuggestionsCollapsed: false
        } : t);
        if (!userToken) {
          try {
            localStorage.setItem('menteclara_tasks_v2', JSON.stringify(updated));
          } catch (e) {
            console.error(e);
          }
        }
        return updated;
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error fetching suggestions:', error);
      setTasks(prevTasks => {
        const updated = prevTasks.map(t => t.id === taskId ? {
          ...t,
          aiSuggestionsLoading: false,
          aiSuggestions: {
            introduction: 'No pudimos conectar con el consejero IA, pero el mejor consejo sigue en pie:',
            steps: [
              "Abre tu espacio de estudio y descansa tu celular boca abajo por 2 minutos.",
              "Haz una acción pírrica como escribir el título o buscar el material necesario.",
              "Felicítate solo por intentar sentarte hoy."
            ],
            mantra: "La acción genera claridad."
          },
          aiSuggestionsCollapsed: false
        } : t);
        if (!userToken) {
          try {
            localStorage.setItem('menteclara_tasks_v2', JSON.stringify(updated));
          } catch (e) {
            console.error(e);
          }
        }
        return updated;
      });
    }
  };

  const handleSelectTaskForFocus = (task: Task) => {
    setActiveFocusTask(task);
  };

  const handleDropInVortex = (task: Task) => {
    setActiveFocusTask(task);
  };

  // On finished focus block
  const handleFinishFocus = async (minutesSpent: number, completed: boolean) => {
    if (!activeFocusTask) return;

    // Create session record
    const session: FocusSession = {
      taskId: activeFocusTask.id,
      taskTitle: activeFocusTask.title,
      stressLevel: activeFocusTask.stressLevel,
      minutesFocused: minutesSpent,
      timestamp: new Date().toISOString(),
      statusFinished: completed ? 'completed' : 'interrupted'
    };

    // Optimistically update history and completed tasks in UI
    const newHistory = [session, ...history];
    setHistory(newHistory);

    if (completed) {
      setTasks(prev => prev.filter(t => t.id !== activeFocusTask.id));
    }

    if (currentUser && userToken) {
      // Save to user caches
      try {
        localStorage.setItem(`menteclara_sessions_user_${currentUser.uid}`, JSON.stringify(newHistory));
        if (completed) {
          const cachedTasks = localStorage.getItem(`menteclara_tasks_user_${currentUser.uid}`);
          if (cachedTasks) {
            const currentCached: Task[] = JSON.parse(cachedTasks);
            const updatedCached = currentCached.filter(t => t.id !== activeFocusTask.id);
            localStorage.setItem(`menteclara_tasks_user_${currentUser.uid}`, JSON.stringify(updatedCached));
          }
        }
      } catch (e) {}

      // Queue optimization for completed tasks
      let createActionRemoved = false;
      if (completed) {
        const hasCreateActionInQueue = syncQueue.some(action => action.type === 'CREATE_TASK' && action.payload.id === activeFocusTask.id);
        if (hasCreateActionInQueue) {
          console.log("Optimizing queue: completed task was created offline. Removing CREATE_TASK action.");
          const filteredQueue = syncQueue.filter(action => !(action.type === 'CREATE_TASK' && action.payload.id === activeFocusTask.id));
          saveSyncQueue(currentUser.uid, filteredQueue);
          createActionRemoved = true;
        }
      }

      if (isOnline) {
        try {
          // 1. Save session
          const sessionRes = await fetch(`${API_BASE}/api/sessions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(session)
          });
          if (!sessionRes.ok) throw new Error('Error al guardar sesión.');

          // 2. If completed and task wasn't created offline (so it exists on backend), delete task on server
          if (completed && !createActionRemoved) {
            await fetch(`${API_BASE}/api/tasks/${activeFocusTask.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${userToken}`
              }
            });
          }

          // Fetch fresh sessions
          const sessionsRes = await fetch(`${API_BASE}/api/sessions`, {
            headers: {
              'Authorization': `Bearer ${userToken}`
            }
          });
          if (sessionsRes.ok) {
            const dbSessions = await sessionsRes.json();
            setHistory(dbSessions);
            try {
              localStorage.setItem(`menteclara_sessions_user_${currentUser.uid}`, JSON.stringify(dbSessions));
            } catch (e) {}
          }
        } catch (err) {
          console.error("Failed to save focus session directly, queuing offline action:", err);
          
          const sessionAction: QueuedAction = {
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'CREATE_SESSION',
            payload: session,
            timestamp: new Date().toISOString(),
            userUid: currentUser.uid
          };

          let finalQueue = [...syncQueue, sessionAction];
          if (completed && !createActionRemoved) {
            const deleteAction: QueuedAction = {
              id: `action-${Date.now()}-del-${Math.random().toString(36).substr(2, 9)}`,
              type: 'DELETE_TASK',
              payload: { id: activeFocusTask.id },
              timestamp: new Date().toISOString(),
              userUid: currentUser.uid
            };
            finalQueue.push(deleteAction);
          }
          saveSyncQueue(currentUser.uid, finalQueue);
        }
      } else {
        console.log("Device offline, queuing session and potential task deletion.");
        const sessionAction: QueuedAction = {
          id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'CREATE_SESSION',
          payload: session,
          timestamp: new Date().toISOString(),
          userUid: currentUser.uid
        };

        let finalQueue = [...syncQueue, sessionAction];
        if (completed && !createActionRemoved) {
          const deleteAction: QueuedAction = {
            id: `action-${Date.now()}-del-${Math.random().toString(36).substr(2, 9)}`,
            type: 'DELETE_TASK',
            payload: { id: activeFocusTask.id },
            timestamp: new Date().toISOString(),
            userUid: currentUser.uid
          };
          finalQueue.push(deleteAction);
        }
        saveSyncQueue(currentUser.uid, finalQueue);
      }
    } else {
      // Guest mode
      if (completed) {
        const updated = tasks.filter(t => t.id !== activeFocusTask.id);
        saveTasks(updated);
      } else {
        try {
          localStorage.setItem('menteclara_history_v2', JSON.stringify(newHistory));
        } catch (e) {}
      }
    }

    setActiveFocusTask(null);
  };

  // Reset demo
  const handleResetDemo = () => {
    if (window.confirm("¿Seguro que deseas reiniciar los datos al estado de demostración?")) {
      saveTasks(INITIAL_TASKS);
      setHistory([]);
      try {
        localStorage.removeItem('menteclara_history_v2');
      } catch(e){}
    }
  };

  const handleToggleNotifications = async () => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      setNotificationStatusMsg("⚠️ Los avisos nativos no están soportados en este navegador.");
      return;
    }

    if (!notificationsEnabled) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          setNotificationStatusMsg("Avisos nativos activados. Recibirás alertas al completar enfoques.");
          try {
            new Notification("¡MenteClara habilitada!", {
              body: "Te avisaremos cuando termine tu bloque de enfoque para facilitar tu desconexión activa.",
              icon: "/favicon.ico"
            });
          } catch (e) {
            console.error("Error creating test notification:", e);
          }
        } else if (permission === 'denied') {
          setNotificationStatusMsg("Permiso de avisos denegado. Actívalos en el navegador.");
          setNotificationsEnabled(false);
        } else {
          setNotificationStatusMsg("Permiso no otorgado. Intenta nuevamente.");
          setNotificationsEnabled(false);
        }
      } catch (err) {
        console.error("Error asking for permission:", err);
        setNotificationStatusMsg("Error al solicitar permisos de notificación.");
      }
    } else {
      setNotificationsEnabled(false);
      setNotificationStatusMsg("Avisos nativos desactivados.");
    }
  };

  // Calculate dynamic statistics
  const stressStats = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => {
      counts[t.stressLevel] = (counts[t.stressLevel] || 0) + 1;
    });

    const totalCalculatedLoad = (counts.high * 5) + (counts.medium * 3) + (counts.low * 1);
    const maxPossibility = tasks.length * 5 || 1;
    const loadFactorPercent = Math.min(100, Math.round((totalCalculatedLoad / maxPossibility) * 100)) || 0;

    let levelLabel = 'Libre y en paz';
    let levelAdvice = 'No tienes pendientes urgentes acumulados. Disfruta tu tiempo libre o lee con calma.';

    if (loadFactorPercent > 75) {
      levelLabel = 'Sobrecarga de Ansiedad';
      levelAdvice = 'Tu cerebro experimenta parálisis por análisis. Prioricemos un solo bloque breve para disolver esta fricción.';
    } else if (loadFactorPercent > 40) {
      levelLabel = 'Carga Moderada';
      levelAdvice = 'Hay desafíos en fila, pero tienes el control. Distribuye tus fuerzas.';
    } else if (loadFactorPercent > 0) {
      levelLabel = 'Carga Ligera y Manejable';
      levelAdvice = 'Excelente nivel. La barrera de entrada es muy pequeña.';
    }

    return {
      counts,
      loadFactorPercent,
      levelLabel,
      levelAdvice
    };
  }, [tasks]);

  const totalFocusedMinutes = useMemo(() => {
    return history.reduce((acc, curr) => acc + curr.minutesFocused, 0);
  }, [history]);

  const filteredTasks = useMemo(() => {
    if (filterCategory === 'all') return tasks;
    return tasks.filter(t => t.category === filterCategory);
  }, [tasks, filterCategory]);

  if (authLoading) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center transition-colors duration-500 font-sans ${
        isNightMode ? 'bg-[#0f141c] text-slate-100' : 'bg-[#F8F5F1] text-neutral-800'
      }`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex items-center justify-center">
            <div className={`w-14 h-14 rounded-full border-4 animate-spin ${
              isNightMode ? 'border-teal-400/20 border-t-teal-400' : 'border-[#00897B]/20 border-t-[#00897B]'
            }`} />
            <BrainCircuit className={`w-6 h-6 absolute ${isNightMode ? 'text-teal-400' : 'text-[#00897B]'}`} />
          </div>
          <div className="space-y-1">
            <p className="font-serif italic text-lg font-bold">MenteClara</p>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold">Cargando tu espacio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <FullScreenAuth
        isNightMode={isNightMode}
        onToggleTheme={() => {
          const next = !isNightMode;
          setIsNightMode(next);
          try {
            localStorage.setItem('menteclara_night_mode', String(next));
          } catch(e){}
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between overflow-x-hidden relative transition-colors duration-500 font-sans ${
      isNightMode ? 'bg-gradient-to-br from-[#0B0F19] via-[#0D1527] to-[#050811] text-slate-100' : 'bg-[#F8F5F1] text-neutral-800'
    }`}>
      
      {/* Main Container tailored for mobile-tablet full view */}
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between relative px-2 sm:px-4 py-4 md:py-6">
          
          {/* TOP ERGONOMIC PHONE TOP BAR */}
          <div className={`px-6 pt-6 pb-2 flex justify-between items-center text-[10px] font-mono font-semibold tracking-wide border-b transition-colors duration-500 ${
            isNightMode ? 'bg-slate-950/40 text-slate-400 border-slate-800/30' : 'bg-neutral-900/5 text-neutral-400 border-neutral-200/40'
          }`}>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full animate-ping ${isNightMode ? 'bg-teal-400' : 'bg-[#00897B]'}`} />
              <span className={`font-bold font-sans ${isNightMode ? 'text-teal-400' : 'text-[#00897B]'}`}>MENTECLARA APP</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Compact sync & network status indicator */}
              {!isOnline ? (
                <div className="flex items-center gap-1 text-amber-500" title="Modo sin conexión">
                  <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                  {syncQueue.length > 0 && <span className="text-[8px] font-mono font-bold">({syncQueue.length})</span>}
                </div>
              ) : isSyncing ? (
                <div className="flex items-center gap-1 text-teal-500" title={`Sincronizando cambios (${syncQueue.length})...`}>
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                </div>
              ) : syncError ? (
                <button 
                  onClick={() => syncOfflineQueue()} 
                  className="flex items-center gap-1 text-rose-500 hover:text-rose-400 transition-colors cursor-pointer" 
                  title={`${syncError}. Clic para reintentar.`}
                >
                  <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                  <span className="text-[8px] font-mono font-bold">[!]</span>
                </button>
              ) : syncSuccessMsg ? (
                <div className="flex items-center gap-1 text-emerald-500 animate-bounce" title={syncSuccessMsg}>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                </div>
              ) : dbLoading ? (
                <div className="flex items-center gap-1 text-teal-500/85" title="Actualizando...">
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-emerald-500" title="Conexión en línea y sincronizada con la base de datos de Render">
                  <div className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </div>
                  <Wifi className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* MAIN INTERNAL USER EXPERIENCE */}
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-start pb-6">
            
            {/* COMPLETED DESIGN HEADER PROFILE WITH AUTH AND CLOUD SYNC */}
            <div className="px-6 pt-5 pb-3 flex justify-between items-start">
              <div>
                <h1 className={`font-serif text-2xl italic transition-colors duration-500 ${isNightMode ? 'text-slate-100' : 'text-[#2D3436]'}`}>
                  Hola, {currentUser ? currentUser.displayName || currentUser.email?.split('@')[0] : 'Cristhian'}
                </h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Help Button */}
                <button
                  id="btn-help-panel"
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer ${
                    isNightMode ? 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300' : 'bg-neutral-200/50 hover:bg-neutral-300/50 text-neutral-600'
                  }`}
                  title="Principios de Diseño / Tutor"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>

                {/* Profile Avatar Button */}
                <button
                  id="btn-profile-panel"
                  onClick={() => setIsAuthModalOpen(true)}
                  className={`w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    isNightMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-800/60 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 border-white text-slate-600'
                  }`}
                  title={currentUser ? "Configurar Perfil" : "Iniciar Sesión / Registrarse"}
                >
                  {currentUser && currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    currentUser ? (currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'US') : 'CH'
                  )}
                </button>
              </div>
            </div>

            {/* Explanatory accordion inside */}
            <AnimatePresence>
              {showInfoPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`mx-6 mb-4 overflow-hidden p-4 rounded-2xl text-[11px] space-y-2.5 leading-relaxed shadow-xs border transition-colors duration-500 ${
                    isNightMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800 text-slate-300' : 'bg-white/70 backdrop-blur-xs border-neutral-200 text-neutral-600'
                  }`}
                >
                  <p className={`font-bold flex items-center gap-1 ${isNightMode ? 'text-slate-100' : 'text-neutral-800'}`}>
                    <BrainCircuit className="w-3.5 h-3.5 text-[#00897B]" />
                    Principios de Diseño Emocional & IHC:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li><strong>Sin Colores Punitivos:</strong> Paleta natural pastel relajante de MenteClara.</li>
                    <li><strong>Focus Vortex:</strong> Arrastra la tarea al contenedor central para enfocarte.</li>
                    <li><strong>Divulgación Progresiva:</strong> Formulario simplificado paso a paso.</li>
                    <li><strong>Temporizador Adaptativo:</strong> Bloques sugeridos según el agobio real.</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MINIMALIST MAIN NAVIGATION */}
            <div className="px-6 pb-4">
              <div className={`flex p-1 rounded-2xl shadow-3xs border transition-colors duration-500 ${isNightMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-neutral-200/40 border-neutral-200/20'}`}>
                <button
                  id="tab-section-respirar"
                  onClick={() => setActiveSection('respirar')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-[11px] font-sans font-bold rounded-xl transition-all cursor-pointer ${
                    activeSection === 'respirar'
                      ? isNightMode 
                        ? 'bg-gradient-to-r from-teal-500/10 to-teal-500/20 text-teal-300 border border-teal-500/30 shadow-[0_0_12px_rgba(20,184,166,0.15)]' 
                        : 'bg-white text-neutral-800 shadow-xs'
                      : isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Respira</span>
                </button>
                <button
                  id="tab-section-pendientes"
                  onClick={() => setActiveSection('pendientes')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-[11px] font-sans font-bold rounded-xl transition-all cursor-pointer ${
                    activeSection === 'pendientes'
                      ? isNightMode 
                        ? 'bg-gradient-to-r from-teal-500/10 to-teal-500/20 text-teal-300 border border-teal-500/30 shadow-[0_0_12px_rgba(20,184,166,0.15)]' 
                        : 'bg-white text-neutral-800 shadow-xs'
                      : isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  <span>Pendientes</span>
                </button>
                <button
                  id="tab-section-progreso"
                  onClick={() => setActiveSection('progreso')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-[11px] font-sans font-bold rounded-xl transition-all cursor-pointer ${
                    activeSection === 'progreso'
                      ? isNightMode 
                        ? 'bg-gradient-to-r from-teal-500/10 to-teal-500/20 text-teal-300 border border-teal-500/30 shadow-[0_0_12px_rgba(20,184,166,0.15)]' 
                        : 'bg-white text-neutral-800 shadow-xs'
                      : isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Progreso</span>
                </button>
              </div>
            </div>

            {/* RENDERING SECTIONS */}
            {activeSection === 'pendientes' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* ACTION ADD TRIGGER */}
                <div className="px-6">
                  <button
                    id="btn-trigger-add-task"
                    onClick={() => setIsAddModalOpen(true)}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer ${
                      isNightMode
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-450 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.25)]'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Desahogar un nuevo pendiente (Añadir)</span>
                  </button>
                </div>

                {/* TABS SELECTOR (LIST VS CALENDAR) */}
                <div className="px-6 mb-2">
                  <div className={`flex p-1 rounded-2xl border shadow-3xs transition-colors duration-500 ${
                    isNightMode ? 'bg-slate-950/40 border-slate-800/40' : 'bg-neutral-200/30 border-neutral-200/10'
                  }`}>
                    <button
                      id="tab-view-list"
                      onClick={() => setActiveTab('list')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-mono font-bold rounded-xl transition-all cursor-pointer ${
                        activeTab === 'list'
                          ? isNightMode ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700/50' : 'bg-white text-neutral-800 shadow-xs'
                          : isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      <ListTodo className="w-3.5 h-3.5" />
                      <span>Lista ({tasks.length})</span>
                    </button>
                    <button
                      id="tab-view-calendar"
                      onClick={() => setActiveTab('calendar')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-mono font-bold rounded-xl transition-all cursor-pointer ${
                        activeTab === 'calendar'
                          ? isNightMode ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700/50' : 'bg-white text-neutral-800 shadow-xs'
                          : isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Calendario</span>
                    </button>
                  </div>
                </div>

                {/* ACTIVE BURDENS OR CALENDAR VIEW */}
                {activeTab === 'calendar' ? (
                  <div className="px-6">
                    <TaskCalendar
                      tasks={tasks}
                      onSelectTask={handleSelectTaskForFocus}
                      onDeleteTask={handleDeleteTask}
                      onGetAiSuggestions={handleFetchAiSuggestions}
                      isNightMode={isNightMode}
                    />
                  </div>
                ) : (
                  <div className="px-6 space-y-3.5">
                    <div className="flex justify-between items-center gap-4">
                      <h2 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                        Pendientes Activos ({filteredTasks.length})
                      </h2>

                      <select
                        id="select-filter-category"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className={`text-xs bg-transparent outline-none border-b cursor-pointer font-medium py-0.5 transition-colors ${
                          isNightMode 
                            ? 'text-teal-400 border-slate-800 hover:text-teal-300 focus:border-teal-500 bg-slate-900' 
                            : 'text-slate-500 hover:text-slate-800 border-slate-300 focus:border-neutral-800'
                        }`}
                      >
                        <option value="all" className={isNightMode ? 'bg-slate-900 text-slate-200' : 'bg-white text-neutral-800'}>Todas las áreas</option>
                        {DEFAULTS_CATEGORIES.map(categoryItem => (
                          <option key={categoryItem} value={categoryItem} className={isNightMode ? 'bg-slate-900 text-slate-200' : 'bg-white text-neutral-800'}>{categoryItem}</option>
                        ))}
                      </select>
                    </div>

                    {filteredTasks.length === 0 ? (
                      <div className={`text-center py-8 px-4 rounded-3xl border border-dashed space-y-2 transition-colors duration-500 ${
                        isNightMode ? 'border-slate-800 bg-slate-950/20' : 'border-neutral-300 bg-white/40'
                      }`}>
                        <Coffee className={`w-8 h-8 mx-auto animate-pulse ${isNightMode ? 'text-teal-500/60' : 'text-neutral-400'}`} />
                        <p className={`text-xs font-semibold ${isNightMode ? 'text-slate-200' : 'text-neutral-600'}`}>
                          ¡Mente completamente despejada!
                        </p>
                        <p className={`text-[10px] max-w-xs mx-auto leading-normal ${isNightMode ? 'text-slate-400' : 'text-neutral-400'}`}>
                          No tienes cargas agregadas. Disfruta tu espacio libre o pulsa el botón superior para desahogar un pendiente.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col relative">
                        <AnimatePresence initial={false}>
                          {filteredTasks.map((taskItem) => (
                            <TaskCard
                              key={taskItem.id}
                              task={taskItem}
                              onSelect={handleSelectTaskForFocus}
                              onDelete={handleDeleteTask}
                              isDraggingActive={isDraggingActive}
                              setIsDraggingActive={setIsDraggingActive}
                              isHoveringVortex={isHoveringVortex}
                              setIsHoveringVortex={setIsHoveringVortex}
                              vortexRef={vortexRef}
                              onDropInVortex={handleDropInVortex}
                              onGetAiSuggestions={handleFetchAiSuggestions}
                              onToggleSuggestionsCollapse={handleToggleSuggestionsCollapse}
                              isNightMode={isNightMode}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'progreso' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* METRICS & OVERLOAD METER */}
                <div className={`mx-6 p-4 rounded-3xl border shadow-3xs space-y-3 transition-colors duration-500 ${
                  isNightMode ? 'bg-[#161f30] border-slate-805/30 text-slate-100' : 'bg-white/60 backdrop-blur-xs border-neutral-200/80 text-neutral-800'
                }`}>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                        Carga Mental Estimada
                      </span>
                      <span className={`text-xs font-bold ${isNightMode ? 'text-slate-100' : 'text-neutral-800'}`}>
                        {stressStats.levelLabel}
                      </span>
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                      isNightMode ? 'text-slate-200 bg-slate-800 border-slate-700' : 'text-neutral-700 bg-neutral-100/80 border-neutral-100'
                    }`}>
                      <Activity className={`w-3.5 h-3.5 ${isNightMode ? 'text-teal-400' : 'text-[#00897B]'}`} />
                      {stressStats.loadFactorPercent}%
                    </span>
                  </div>

                  {/* Overload indicator bar */}
                  <div className={`h-2 w-full rounded-full overflow-hidden ${isNightMode ? 'bg-slate-950/40' : 'bg-neutral-200/60'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stressStats.loadFactorPercent}%` }}
                      transition={{ type: "spring", stiffness: 120 }}
                      className={`h-full rounded-full ${
                        stressStats.loadFactorPercent > 75
                          ? 'bg-[#E67E22]'
                          : stressStats.loadFactorPercent > 40
                          ? 'bg-[#D4AC0D]'
                          : 'bg-[#00897B]'
                      }`}
                    />
                  </div>

                  <p className={`text-[11px] leading-relaxed italic ${isNightMode ? 'text-slate-400' : 'text-neutral-500'}`}>
                    {stressStats.levelAdvice}
                  </p>

                  {totalFocusedMinutes > 0 && (
                    <div className={`pt-2 border-t flex justify-between items-center text-[10px] font-mono font-bold ${
                      isNightMode ? 'border-slate-800 text-teal-400' : 'border-neutral-100 text-[#00897B]'
                    }`}>
                      <span>Enfoque total acumulado:</span>
                      <span>{totalFocusedMinutes} min</span>
                    </div>
                  )}
                </div>

                <FocusStats history={history} isNightMode={isNightMode} />
              </div>
            )}

            {activeSection === 'respirar' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* FOCUS VORTEX INTERACTIVE AREA */}
                <div className="py-2 animate-in fade-in duration-300">
                  <FocusVortex
                    isDraggingActive={isDraggingActive}
                    isHoveringVortex={isHoveringVortex}
                    vortexRef={vortexRef}
                    onManualTrigger={() => setIsAddModalOpen(true)}
                    hasTasks={tasks.length > 0}
                    isNightMode={isNightMode}
                  />
                </div>

                {/* LIST OF PENDIENTES TO DRAG & DROP */}
                <div className="px-6 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                      Arrastra un pendiente al círculo de arriba para enfocarte ({tasks.length})
                    </h3>
                  </div>

                  {tasks.length === 0 ? (
                    <div className={`text-center py-6 px-4 rounded-3xl border border-dashed space-y-2 transition-colors duration-300 ${isNightMode ? 'border-slate-800 bg-slate-950/40' : 'border-neutral-300 bg-white/40'}`}>
                      <Coffee className="w-8 h-8 mx-auto text-neutral-400 animate-pulse" />
                      <p className={`text-xs font-semibold ${isNightMode ? 'text-slate-200' : 'text-neutral-600'}`}>¡Mente totalmente despejada!</p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className={`text-[10.5px] font-bold underline cursor-pointer transition-colors ${isNightMode ? 'text-teal-400 hover:text-teal-300' : 'text-[#00897B] hover:text-[#00796B]'}`}
                      >
                        Crear nuevo pendiente
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col relative space-y-2">
                      <AnimatePresence initial={false}>
                        {tasks.map((taskItem) => (
                          <TaskCard
                            key={taskItem.id}
                            task={taskItem}
                            onSelect={handleSelectTaskForFocus}
                            onDelete={handleDeleteTask}
                            isDraggingActive={isDraggingActive}
                            setIsDraggingActive={setIsDraggingActive}
                            isHoveringVortex={isHoveringVortex}
                            setIsHoveringVortex={setIsHoveringVortex}
                            vortexRef={vortexRef}
                            onDropInVortex={handleDropInVortex}
                            onGetAiSuggestions={handleFetchAiSuggestions}
                            simplified={true}
                            onToggleSuggestionsCollapse={handleToggleSuggestionsCollapse}
                            isNightMode={isNightMode}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* EMBIENT PAUSE TIP CARD */}
                <div className={`mx-6 p-4 rounded-2xl text-center shadow-3xs border transition-colors duration-500 ${
                  isNightMode ? 'bg-[#161f30]/60 border-slate-800 text-slate-300' : 'bg-white/50 border-neutral-200 text-neutral-600'
                }`}>
                  <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block mb-1">Dosis Diaria de Paz</span>
                  <p className={`text-[11px] italic transition-colors duration-500 ${isNightMode ? 'text-slate-400' : 'text-neutral-600'}`}>
                    "Es seguro soltar la carga mental por unos minutos. La acción más pequeña siempre disuelve el miedo."
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ERGONOMIC MINIMAL FOOTER RAIL */}
          <div className={`p-4 border-t flex justify-between items-center animate-in fade-in duration-300 transition-colors duration-500 ${
            isNightMode ? 'bg-[#080d1a] border-slate-805/30' : 'bg-slate-900/5 border-neutral-200/60'
          }`}>
            <div className="flex items-center gap-1 text-slate-400">
              <Activity className={`w-3.5 h-3.5 ${isNightMode ? 'text-teal-400' : 'text-[#00897B]'}`} />
              <span className={`text-[10px] font-sans font-semibold transition-colors ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>MenteClara • Tu espacio seguro</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-toggle-night"
                onClick={() => setIsNightMode(!isNightMode)}
                className={`text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  isNightMode 
                    ? 'text-teal-400 hover:text-teal-300' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={isNightMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Nocturno"}
              >
                {isNightMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3 h-3" />}
                <span>{isNightMode ? "Modo Claro" : "Modo Nocturno"}</span>
              </button>

              <span className={`text-[10px] transition-colors ${isNightMode ? 'text-slate-800' : 'text-neutral-350'}`}>|</span>

              <button
                id="btn-toggle-notifications"
                onClick={handleToggleNotifications}
                className={`text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  notificationsEnabled 
                    ? 'text-teal-400 hover:text-teal-300' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Habilitar avisos nativos del navegador"
              >
                {notificationsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                <span>{notificationsEnabled ? "Avisos: Sí" : "Avisos: No"}</span>
              </button>

              <span className={`text-[10px] transition-colors ${isNightMode ? 'text-slate-800' : 'text-neutral-350'}`}>|</span>

              <button
                id="btn-reset-demo"
                onClick={handleResetDemo}
                className="text-[10px] font-mono font-bold text-[#ea580c] hover:text-[#c2410c] flex items-center gap-1 cursor-pointer transition-colors"
                title="Reiniciar datos iniciales"
              >
                <RefreshCcw className="w-3 h-3" />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {notificationStatusMsg && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={`absolute bottom-16 left-4 right-4 p-3 rounded-2xl text-[10.5px] font-mono leading-relaxed z-50 text-center shadow-xl border select-none ${
                  isNightMode 
                    ? 'bg-[#151c2c] border-teal-500/30 text-teal-300' 
                    : 'bg-white border-[#00897B]/20 text-[#00897B]'
                }`}
              >
                {notificationStatusMsg}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* DIALOGS AND ACTIVE FOCUS MODE WORKFLOWS */}
        <AnimatePresence>
          {isAddModalOpen && (
            <QuickAddModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onAdd={handleAddTask}
              isNightMode={isNightMode}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeFocusTask && (
            <FocusMode
              task={activeFocusTask}
              onFinish={handleFinishFocus}
              onCancel={() => setActiveFocusTask(null)}
              notificationsEnabled={notificationsEnabled}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAuthModalOpen && (
            <AuthAndProfileModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              currentUser={currentUser}
              isNightMode={isNightMode}
              onProfileUpdated={handleProfileRefresh}
            />
          )}
        </AnimatePresence>

        <DeleteConfirmModal
          isOpen={!!taskToDelete}
          taskTitle={taskToDelete?.title || ''}
          onConfirm={handleConfirmDelete}
          onCancel={() => setTaskToDelete(null)}
          isNightMode={isNightMode}
        />

    </div>
  );
}
