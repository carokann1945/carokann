'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { useTabStore } from '../../model/tabStore';
import TabItem from './TabItem';

export default function TabList() {
  // tab 상태 꺼내오기
  const state = useTabStore((store) => store.state);
  const reorderTabs = useTabStore((store) => store.reorderTabs);

  const tabs = state.tabs;
  const tabIds = tabs.map((tab) => tab.id);

  const tabHydrated = useTabStore((store) => store.hydrated);

  // dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = tabIds.findIndex((tabId) => tabId === active.id);
    const newIndex = tabIds.findIndex((tabId) => tabId === over.id);

    reorderTabs(arrayMove(tabIds, oldIndex, newIndex));
  };

  if (!tabHydrated) {
    return <TabListSkeleton />;
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tabIds} strategy={verticalListSortingStrategy}>
          <ul className={cn('w-full', 'flex flex-col gap-[3px]')}>
            {tabs.map((tab) => (
              <TabItem key={tab.id} tab={tab} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function TabListSkeleton() {
  return (
    <ul className={cn('w-full', 'flex flex-col gap-[3px]')}>
      {Array.from({ length: 1 }).map((_, index) => (
        <li key={index} className={cn('w-full max-w-[275px]', 'px-[10px] py-[8px]', 'rounded-md bg-[#f1eee6]')}>
          <div className="h-[18px] w-[70%] animate-pulse rounded bg-[#e0dbcf]" />
        </li>
      ))}
    </ul>
  );
}
