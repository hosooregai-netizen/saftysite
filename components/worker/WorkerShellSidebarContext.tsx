'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'workerShellSidebarCollapsed';
const STORAGE_EVENT_NAME = 'worker-shell-sidebar-change';

type WorkerShellSidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
  expandSidebar: () => void;
};

const WorkerShellSidebarContext = createContext<WorkerShellSidebarContextValue | null>(null);

function readCollapsedSnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function subscribeToCollapsedState(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStoreChange = () => {
    onStoreChange();
  };

  window.addEventListener('storage', handleStoreChange);
  window.addEventListener(STORAGE_EVENT_NAME, handleStoreChange);

  return () => {
    window.removeEventListener('storage', handleStoreChange);
    window.removeEventListener(STORAGE_EVENT_NAME, handleStoreChange);
  };
}

function writeCollapsedSnapshot(value: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    return;
  }

  window.dispatchEvent(new Event(STORAGE_EVENT_NAME));
}

export function WorkerShellSidebarProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribeToCollapsedState,
    readCollapsedSnapshot,
    () => false,
  );

  const setCollapsed = useCallback((value: boolean) => {
    writeCollapsedSnapshot(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    writeCollapsedSnapshot(!readCollapsedSnapshot());
  }, []);

  const expandSidebar = useCallback(() => {
    writeCollapsedSnapshot(false);
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      expandSidebar,
    }),
    [collapsed, setCollapsed, toggleCollapsed, expandSidebar]
  );

  return (
    <WorkerShellSidebarContext.Provider value={value}>{children}</WorkerShellSidebarContext.Provider>
  );
}

export function useWorkerShellSidebar(): WorkerShellSidebarContextValue {
  const context = useContext(WorkerShellSidebarContext);
  if (!context) {
    throw new Error('useWorkerShellSidebar must be used within WorkerShellSidebarProvider');
  }
  return context;
}

export function useWorkerShellSidebarOptional(): WorkerShellSidebarContextValue | null {
  return useContext(WorkerShellSidebarContext);
}

