'use client';

import { useEffect } from 'react';
import { useTabStore } from './tabStore';
import { saveState } from './tabStorage';

export default function TabProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useTabStore((store) => store.hydrate);
  const hydrated = useTabStore((store) => store.hydrated);
  const state = useTabStore((store) => store.state);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  return <>{children}</>;
}
