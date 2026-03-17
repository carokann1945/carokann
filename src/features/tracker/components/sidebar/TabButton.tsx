'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTabStore } from '../../model/tabStore';
import TabDialog from './TabDialog';

export default function TabButton() {
  const { addTab } = useTabStore();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'w-[35px] h-[35px]',
          'rounded-md',
          'cursor-pointer',
          'hover:bg-gray-200',
          'transition-color duration-100',
        )}>
        +
      </button>
      <TabDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={addTab}
        title="새 탭 만들기"
        description="추가할 탭 이름을 입력하세요."
        submitLabel="추가"
      />
    </>
  );
}
