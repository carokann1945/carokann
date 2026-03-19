'use client';

import { useEffect } from 'react';
import { saveTaskState } from './taskStorage';
import { useTaskStore } from './taskStore';

export default function TaskProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useTaskStore((store) => store.hydrate);
  const hydrated = useTaskStore((store) => store.hydrated);
  const state = useTaskStore((store) => store.state);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    saveTaskState(state);
  }, [state, hydrated]);

  // 30초마다 sync, 브라우저의 다른 탭에 갔다오면 sync
  useEffect(() => {
    if (!hydrated) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        useTaskStore.getState().syncTasks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    const id = setInterval(() => useTaskStore.getState().syncTasks(), 30_000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(id);
    };
  }, [hydrated]);

  return <>{children}</>;
}
