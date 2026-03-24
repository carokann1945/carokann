'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { bootstrapTracker, saveTrackerSnapshot } from '@/actions/tracker.actions';
import { createClient } from '@/lib/supabase/client';
import { EMPTY_TAB_STATE, EMPTY_TASK_STATE, type TrackerSnapshotPayload } from './persistence';
import { loadState, saveState } from './tabStorage';
import { useTabStore } from './tabStore';
import { loadTaskState, saveTaskState } from './taskStorage';
import { useTaskStore } from './taskStore';

type StorageMode = 'local' | 'db';

function readLocalSnapshot(): TrackerSnapshotPayload {
  return {
    tabState: loadState() ?? EMPTY_TAB_STATE,
    taskState: loadTaskState() ?? EMPTY_TASK_STATE,
  };
}

export default function TrackerPersistenceProvider({ children }: { children: React.ReactNode }) {
  const tabState = useTabStore((store) => store.state);
  const taskState = useTaskStore((store) => store.state);
  const hydrateTabs = useTabStore((store) => store.hydrate);
  const hydrateTasks = useTaskStore((store) => store.hydrate);
  const resetTabs = useTabStore((store) => store.resetState);
  const resetTasks = useTaskStore((store) => store.resetState);

  // 앱 상태 준비 완료 플래그
  const [bootstrapped, setBootstrapped] = useState(false);
  const [mode, setMode] = useState<StorageMode>('local');
  const [authVersion, setAuthVersion] = useState(0);

  const sourceKeyRef = useRef<string | null>(null);
  const modeRef = useRef<StorageMode>('local');
  const latestSnapshotRef = useRef<TrackerSnapshotPayload | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingFlushRef = useRef(false);

  modeRef.current = mode;

  async function flushNow() {
    if (modeRef.current !== 'db') return;
    const snapshot = latestSnapshotRef.current;
    if (!snapshot) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (isSavingRef.current) {
      pendingFlushRef.current = true;
      return;
    }

    isSavingRef.current = true;

    try {
      await saveTrackerSnapshot(snapshot);
    } finally {
      isSavingRef.current = false;

      if (pendingFlushRef.current) {
        pendingFlushRef.current = false;
        void flushNow();
      }
    }
  }

  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void flushNow();
    }, 800);
  }

  // 저장 관련 내부 상태 전부 초기화
  function clearPendingSaveState() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    latestSnapshotRef.current = null;
    isSavingRef.current = false;
    pendingFlushRef.current = false;
  }

  // 로컬 스냅샷을 상태에 적용
  const applyLocalSnapshot = useCallback(
    (snapshot: TrackerSnapshotPayload) => {
      resetTabs();
      resetTasks();
      setMode('local');
      sourceKeyRef.current = 'local:guest';
      latestSnapshotRef.current = snapshot;
      hydrateTabs(snapshot.tabState);
      hydrateTasks(snapshot.taskState);
      setBootstrapped(true);
    },
    [resetTabs, resetTasks, hydrateTabs, hydrateTasks],
  );

  // auth 상태 변화 감지
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') {
        clearPendingSaveState();
        applyLocalSnapshot(readLocalSnapshot());
        setAuthVersion((v) => v + 1);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        sourceKeyRef.current = null;
        setBootstrapped(false);
        setAuthVersion((v) => v + 1);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [applyLocalSnapshot, hydrateTabs, hydrateTasks, resetTabs, resetTasks]);

  // authVersion이 바뀔 때마다 bootstrap 재실행
  useEffect(() => {
    let cancelled = false;

    async function runBootstrap() {
      const localSnapshot = readLocalSnapshot();

      try {
        const result = await bootstrapTracker(localSnapshot);
        if (cancelled) return;

        sourceKeyRef.current = result.sourceKey;
        setMode(result.mode);
        latestSnapshotRef.current = result.snapshot;
        hydrateTabs(result.snapshot.tabState);
        hydrateTasks(result.snapshot.taskState);
        setBootstrapped(true);
      } catch {
        if (cancelled) return;

        sourceKeyRef.current = 'local:fallback';
        setMode('local');
        latestSnapshotRef.current = localSnapshot;
        hydrateTabs(localSnapshot.tabState);
        hydrateTasks(localSnapshot.taskState);
        setBootstrapped(true);
      }
    }

    void runBootstrap();

    return () => {
      cancelled = true;
    };
  }, [authVersion, hydrateTabs, hydrateTasks]);

  useEffect(() => {
    let cancelled = false;

    async function runBootstrap() {
      const localSnapshot = readLocalSnapshot();

      try {
        const result = await bootstrapTracker(localSnapshot);
        if (cancelled) return;

        // if (sourceKeyRef.current === result.sourceKey && bootstrapped) return;

        sourceKeyRef.current = result.sourceKey;
        setMode(result.mode);
        hydrateTabs(result.snapshot.tabState);
        hydrateTasks(result.snapshot.taskState);
        setBootstrapped(true);
      } catch {
        if (cancelled) return;

        sourceKeyRef.current = 'local:fallback';
        setMode('local');
        hydrateTabs(localSnapshot.tabState);
        hydrateTasks(localSnapshot.taskState);
        setBootstrapped(true);
      }
    }

    void runBootstrap();

    return () => {
      cancelled = true;
    };
  }, [bootstrapped, hydrateTabs, hydrateTasks]);

  useEffect(() => {
    if (!bootstrapped) return;

    const snapshot = { tabState, taskState };
    latestSnapshotRef.current = snapshot;

    if (mode === 'local') {
      saveState(tabState);
      saveTaskState(taskState);
      return;
    }

    scheduleSave();
  }, [bootstrapped, mode, tabState, taskState]);

  useEffect(() => {
    if (!bootstrapped) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flushNow();
      }
    };

    const handlePageHide = () => {
      void flushNow();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [bootstrapped]);

  // 4) repeat task 동기화
  useEffect(() => {
    if (!bootstrapped) return;

    const syncTasks = () => {
      useTaskStore.getState().syncTasks();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncTasks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    const intervalId = setInterval(() => {
      syncTasks();
    }, 10_000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
    };
  }, [bootstrapped]);

  if (!bootstrapped) return null;

  return <>{children}</>;
}
