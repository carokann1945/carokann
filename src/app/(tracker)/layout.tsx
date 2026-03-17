import Providers from '@/features/tracker/model/provider';
import React from 'react';

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
