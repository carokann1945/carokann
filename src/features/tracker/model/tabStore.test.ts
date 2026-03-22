import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Tab, TabState } from './types';

const { uidMock, loadStateMock } = vi.hoisted(() => ({
  uidMock: vi.fn(),
  loadStateMock: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  uid: uidMock,
}));

vi.mock('./tabStorage', () => ({
  loadState: loadStateMock,
}));

type TabStoreHook = typeof import('./tabStore')['useTabStore'];

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: 'tab-1',
    name: '기본 탭',
    position: 0,
    ...overrides,
  };
}

async function setupStore(savedState: TabState | null = null) {
  vi.resetModules();
  uidMock.mockReset();
  loadStateMock.mockReset();

  let nextId = 1;
  uidMock.mockImplementation(() => `tab-${nextId++}`);
  loadStateMock.mockReturnValue(savedState);

  const { useTabStore } = await import('./tabStore');

  return {
    useTabStore,
    loadStateMock,
  };
}

function seedState(useTabStore: TabStoreHook, tabs: Tab[], activeTabId: string | null) {
  useTabStore.setState({
    state: { version: 1, tabs, activeTabId },
    hydrated: true,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  uidMock.mockReset();
  loadStateMock.mockReset();
});

describe('tabStore', () => {
  describe('hydrate', () => {
    it('activeTabId가 null이면 첫 탭으로 fallback하지 않고 그대로 유지한다', async () => {
      const savedState: TabState = {
        version: 1,
        tabs: [makeTab({ id: 'tab-2', position: 1 }), makeTab({ id: 'tab-1', position: 0 })],
        activeTabId: null,
      };
      const { useTabStore } = await setupStore(savedState);

      useTabStore.getState().hydrate();

      expect(useTabStore.getState().state.tabs.map((tab) => tab.id)).toEqual(['tab-1', 'tab-2']);
      expect(useTabStore.getState().state.activeTabId).toBeNull();
    });

    it('존재하지 않는 activeTabId는 null로 정리한다', async () => {
      const savedState: TabState = {
        version: 1,
        tabs: [makeTab({ id: 'tab-1' }), makeTab({ id: 'tab-2', position: 1 })],
        activeTabId: 'missing-tab',
      };
      const { useTabStore } = await setupStore(savedState);

      useTabStore.getState().hydrate();

      expect(useTabStore.getState().state.activeTabId).toBeNull();
    });
  });

  describe('deleteTab', () => {
    it('비활성 탭을 삭제하면 activeTabId를 유지한다', async () => {
      const { useTabStore } = await setupStore();

      seedState(
        useTabStore,
        [makeTab({ id: 'tab-1', position: 0 }), makeTab({ id: 'tab-2', position: 1 }), makeTab({ id: 'tab-3', position: 2 })],
        'tab-2',
      );

      useTabStore.getState().deleteTab('tab-1');

      expect(useTabStore.getState().state.activeTabId).toBe('tab-2');
      expect(useTabStore.getState().state.tabs).toMatchObject([
        { id: 'tab-2', position: 0 },
        { id: 'tab-3', position: 1 },
      ]);
    });

    it('활성 탭을 삭제하면 activeTabId를 null로 만든다', async () => {
      const { useTabStore } = await setupStore();

      seedState(
        useTabStore,
        [makeTab({ id: 'tab-1', position: 0 }), makeTab({ id: 'tab-2', position: 1 }), makeTab({ id: 'tab-3', position: 2 })],
        'tab-2',
      );

      useTabStore.getState().deleteTab('tab-2');

      expect(useTabStore.getState().state.activeTabId).toBeNull();
      expect(useTabStore.getState().state.tabs).toMatchObject([
        { id: 'tab-1', position: 0 },
        { id: 'tab-3', position: 1 },
      ]);
    });
  });
});
