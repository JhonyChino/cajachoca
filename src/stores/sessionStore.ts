import { createSignal } from 'solid-js';
import { sessionApi, type Session, type SessionSummary } from '@/lib/api';

// Global store for session state
const [activeSession, setActiveSession] = createSignal<Session | null>(null);
const [sessionSummary, setSessionSummary] = createSignal<SessionSummary | null>(null);
const [isLoading, setIsLoading] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);

// Load active session on mount
export const loadActiveSession = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await sessionApi.getActiveSession();
    
    if (response.success && response.data) {
      setActiveSession(response.data);
      // Also load summary
      await loadSessionSummary(response.data.id);
    } else {
      setActiveSession(null);
    }
  } catch (err) {
    setError('Error al cargar la sesión activa');
    setActiveSession(null);
  } finally {
    setIsLoading(false);
  }
};

// Load session summary
export const loadSessionSummary = async (sessionId: number) => {
  try {
    const response = await sessionApi.getSessionSummary(sessionId);
    
    if (response.success && response.data) {
      setSessionSummary(response.data);
    }
  } catch (err) {
    console.error('Error loading session summary:', err);
  }
};

// Create new session
export const createNewSession = async (operatorName: string, openingAmount: number) => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await sessionApi.createSession(operatorName, openingAmount);
    
    if (response.success && response.data) {
      setActiveSession(response.data);
      await loadSessionSummary(response.data.id);
      return { success: true, error: null };
    } else {
      setError(response.error || 'Error al crear la sesión');
      return { success: false, error: response.error };
    }
  } catch (err: any) {
    const errorMsg = err.toString();
    setError(errorMsg);
    return { success: false, error: errorMsg };
  } finally {
    setIsLoading(false);
  }
};

// Close current session
export const closeCurrentSession = async (closingAmount: number) => {
  const session = activeSession();
  if (!session) {
    return { success: false, error: 'No hay sesión activa' };
  }
  
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await sessionApi.closeSession(session.id, closingAmount);
    
    if (response.success && response.data) {
      setActiveSession(null);
      setSessionSummary(null);
      return { success: true, error: null };
    } else {
      setError(response.error || 'Error al cerrar la sesión');
      return { success: false, error: response.error };
    }
  } catch (err: any) {
    const errorMsg = err.toString();
    setError(errorMsg);
    return { success: false, error: errorMsg };
  } finally {
    setIsLoading(false);
  }
};

// Refresh session data
export const refreshSessionData = async () => {
  const session = activeSession();
  if (session) {
    await loadSessionSummary(session.id);
  }
};

// Export signals
export { activeSession, sessionSummary, isLoading, error };