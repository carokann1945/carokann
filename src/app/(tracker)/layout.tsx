import React from 'react';
import TabProvider from '@/features/tracker/model/TabProvider';
import TaskProvider from '@/features/tracker/model/TaskProvider';

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <TabProvider>
      <TaskProvider>{children}</TaskProvider>
    </TabProvider>
  );
}
