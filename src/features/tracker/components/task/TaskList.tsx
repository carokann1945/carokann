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
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTabStore, selectActiveTab } from '../../model/tabStore';
import { useTaskStore } from '../../model/taskStore';
import TaskItem from './TaskItem';

export default function TaskList() {
  const activeTab = useTabStore(selectActiveTab);
  const taskState = useTaskStore((store) => store.state);
  const reorderTasks = useTaskStore((store) => store.reorderTasks);
  const tabHydrated = useTabStore((store) => store.hydrated);
  const taskHydrated = useTaskStore((store) => store.hydrated);
  const isReady = tabHydrated && taskHydrated;

  const tasks = activeTab
    ? taskState.tasks.filter((task) => task.tabId === activeTab.id).sort((a, b) => a.position - b.position)
    : [];
  const taskIds = tasks.map((task) => task.id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!activeTab || !over || active.id === over.id) return;

    const oldIndex = taskIds.findIndex((taskId) => taskId === active.id);
    const newIndex = taskIds.findIndex((taskId) => taskId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderTasks(activeTab.id, arrayMove(taskIds, oldIndex, newIndex));
  };

  if (!isReady) {
    return <TaskListSkeleton />;
  }

  if (!activeTab) {
    return (
      <div
        className={cn(
          'max-w-[1110px]',
          'flex flex-col gap-[12px] items-center md:gap-[24px]',
          'rounded-xl shadow-xl bg-white px-[20px] py-[32px] border border-gray-300',
          'text-center',
          'mx-auto',
        )}>
        <figure className={cn('relative w-[180px] h-[290px] md:w-[230px] md:h-[370px]')}>
          <Image
            src="/images/herb.png"
            alt="have no tasks image"
            sizes="400px"
            fill
            className="object-cover"
            priority
          />
        </figure>
        <p className={cn('typo-first text-[26px] md:text-[32px] text-custom-black')}>선택된 탭이 없습니다.</p>
        <p className={cn('typo-common text-[14px] md:text-[16px] mt-[6px] text-custom-black-light')}>
          탭을 선택하거나 새 탭을 만들어 작업을 시작하세요.
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div
        className={cn(
          'max-w-[1110px]',
          'flex flex-col gap-[12px] items-center md:gap-[24px]',
          'rounded-xl shadow-xl bg-white px-[20px] py-[32px] border border-gray-300',
          'text-center',
          'mx-auto',
        )}>
        <figure className={cn('relative w-[180px] h-[290px] md:w-[230px] md:h-[370px]')}>
          <Image
            src="/images/herb.png"
            alt="have no tasks image"
            sizes="400px"
            fill
            className="object-cover"
            priority
          />
        </figure>
        <p className={cn('typo-first text-[26px] md:text-[32px] text-custom-black')}>아직 작업이 없습니다.</p>
        <p className={cn('typo-common text-[14px] md:text-[16px] mt-[6px] text-custom-black-light')}>
          상단 +추가 버튼으로 첫 작업을 추가해보세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <ul
            className={cn(
              'max-w-[1110px]',
              'flex flex-col gap-[12px]',
              'rounded-xl shadow-xl bg-white px-[16px] md:px-[32px] py-[16px] md:py-[32px] border border-gray-300',
              'mx-auto',
            )}>
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function TaskListSkeleton() {
  return (
    <div
      className={cn(
        'max-w-[1110px]',
        'flex flex-col gap-[12px]',
        'rounded-xl shadow-xl bg-white px-[16px] md:px-[32px] py-[16px] md:py-[32px] border border-gray-300',
        'mx-auto',
      )}>
      {Array.from({ length: 1 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-[#ebe4d8]">
          <div className="h-[36px] animate-pulse bg-[#f6f2ea]" />
          <div className="flex flex-col gap-[10px] px-[12px] py-[12px] sm:px-[16px] sm:py-[16px]">
            <div className="h-[22px] w-[120px] animate-pulse rounded bg-[#ece7db]" />
            <div className="h-[18px] w-[60%] animate-pulse rounded bg-[#ece7db]" />
            <div className="h-[16px] w-[40%] animate-pulse rounded bg-[#f1eee6]" />
          </div>
        </div>
      ))}
    </div>
  );
}
