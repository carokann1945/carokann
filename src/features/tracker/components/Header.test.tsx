import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';

const { sidebarStoreMock, tabStoreMock, taskStoreMock } = vi.hoisted(() => ({
  sidebarStoreMock: {
    isOpen: false,
    setIsOpen: vi.fn(),
  },
  tabStoreMock: {
    state: {
      version: 1 as const,
      tabs: [] as Array<{ id: string; name: string; position: number }>,
      activeTabId: null as string | null,
    },
  },
  taskStoreMock: {
    addTask: vi.fn(),
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: Array<string | false | null | undefined>) => inputs.filter(Boolean).join(' '),
  uid: () => 'mock-id',
  stopPropagation: (event: { stopPropagation: () => void }) => event.stopPropagation(),
  getBrowserTimezone: () => 'Asia/Seoul',
  formatTwoDigit: (value: number) => value.toString().padStart(2, '0'),
}));

vi.mock('./task/TaskDialog', () => ({
  default: () => null,
}));

vi.mock('../model/sidebarStore', () => ({
  useSidebarStore: (selector: (store: typeof sidebarStoreMock) => unknown) => selector(sidebarStoreMock),
}));

vi.mock('../model/tabStore', () => ({
  selectActiveTab: (store: typeof tabStoreMock) =>
    store.state.tabs.find((tab) => tab.id === store.state.activeTabId) ?? null,
  useTabStore: (selector: (store: typeof tabStoreMock) => unknown) => selector(tabStoreMock),
}));

vi.mock('../model/taskStore', () => ({
  useTaskStore: (selector: (store: typeof taskStoreMock) => unknown) => selector(taskStoreMock),
}));

function resetStores() {
  sidebarStoreMock.isOpen = false;
  sidebarStoreMock.setIsOpen.mockReset();
  tabStoreMock.state = { version: 1, tabs: [], activeTabId: null };
  taskStoreMock.addTask.mockReset();
}

afterEach(() => {
  resetStores();
});

describe('Header', () => {
  it('active tab이 없으면 선택된 탭 없음과 비활성 +추가 버튼을 보여준다', () => {
    resetStores();

    const markup = renderToStaticMarkup(<Header />);

    expect(markup).toContain('선택된 탭 없음');
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>\+ 추가<\/button>/);
  });

  it('active tab이 있으면 탭 이름을 보여주고 +추가 버튼을 활성화한다', () => {
    resetStores();
    tabStoreMock.state = {
      version: 1,
      tabs: [{ id: 'tab-1', name: '운동', position: 0 }],
      activeTabId: 'tab-1',
    };

    const markup = renderToStaticMarkup(<Header />);

    expect(markup).toContain('운동');
    expect(markup).not.toMatch(/<button[^>]*disabled=""[^>]*>\+ 추가<\/button>/);
  });
});
