import TabProvider from '@/features/tracker/model/TabProvider';
import React from 'react';

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <TabProvider>{children}</TabProvider>;
}
