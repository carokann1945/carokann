/* eslint-disable @next/next/no-img-element */

import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TaskList from './TaskList';

const { tabStoreMock, taskStoreMock } = vi.hoisted(() => ({
  tabStoreMock: {
    state: {
      version: 1 as const,
      tabs: [] as Array<{ id: string; name: string; position: number }>,
      activeTabId: null as string | null,
    },
  },
  taskStoreMock: {
    state: {
      version: 1 as const,
      tasks: [] as Array<unknown>,
    },
    reorderTasks: vi.fn(),
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: Array<string | false | null | undefined>) => inputs.filter(Boolean).join(' '),
  uid: () => 'mock-id',
  stopPropagation: (event: { stopPropagation: () => void }) => event.stopPropagation(),
  getBrowserTimezone: () => 'Asia/Seoul',
  formatTwoDigit: (value: number) => value.toString().padStart(2, '0'),
}));

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('./TaskItem', () => ({
  default: () => <li>TaskItem</li>,
}));

vi.mock('../../model/tabStore', () => ({
  selectActiveTab: (store: typeof tabStoreMock) =>
    store.state.tabs.find((tab) => tab.id === store.state.activeTabId) ?? null,
  useTabStore: (selector: (store: typeof tabStoreMock) => unknown) => selector(tabStoreMock),
}));

vi.mock('../../model/taskStore', () => ({
  useTaskStore: (selector: (store: typeof taskStoreMock) => unknown) => selector(taskStoreMock),
}));

function resetStores() {
  tabStoreMock.state = { version: 1, tabs: [], activeTabId: null };
  taskStoreMock.state = { version: 1, tasks: [] };
  taskStoreMock.reorderTasks.mockReset();
}

afterEach(() => {
  resetStores();
});

describe('TaskList', () => {
  it('activeTabId가 null이면 탭 선택 empty state를 보여준다', () => {
    resetStores();

    const markup = renderToStaticMarkup(<TaskList />);

    expect(markup).toContain('탭을 선택하거나 새 탭을 만들어 작업을 시작하세요.');
    expect(markup).not.toContain('상단 +추가 버튼으로 첫 작업을 추가해보세요.');
  });

  it('activeTabId가 stale id여도 빈 작업 상태가 아니라 탭 선택 empty state를 보여준다', () => {
    resetStores();
    tabStoreMock.state = {
      version: 1,
      tabs: [{ id: 'tab-1', name: '운동', position: 0 }],
      activeTabId: 'missing-tab',
    };

    const markup = renderToStaticMarkup(<TaskList />);

    expect(markup).toContain('탭을 선택하거나 새 탭을 만들어 작업을 시작하세요.');
    expect(markup).not.toContain('상단 +추가 버튼으로 첫 작업을 추가해보세요.');
  });
});
