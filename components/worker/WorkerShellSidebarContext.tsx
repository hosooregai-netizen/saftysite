'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'workerShellSidebarCollapsed';

type WorkerShellSidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
  expandSidebar: () => void;
};

const WorkerShellSidebarContext = createContext<WorkerShellSidebarContextValue | null>(null);

export function WorkerShellSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsedState(localStorage.getItem(STORAGE_KEY) === 'true');
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  }, [collapsed, hydrated]);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((current) => !current);
  }, []);

  const expandSidebar = useCallback(() => {
    setCollapsedState(false);
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
