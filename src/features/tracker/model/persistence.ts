import type { TabState, TaskState } from './types';

export type TrackerSnapshotPayload = {
  tabState: TabState;
  taskState: TaskState;
};

export const EMPTY_TAB_STATE: TabState = {
  version: 1,
  tabs: [],
  activeTabId: null,
};

export const EMPTY_TASK_STATE: TaskState = {
  version: 1,
  tasks: [],
};

export function createEmptySnapshot(): TrackerSnapshotPayload {
  return {
    tabState: EMPTY_TAB_STATE,
    taskState: EMPTY_TASK_STATE,
  };
}

export function isEmptySnapshot(snapshot: TrackerSnapshotPayload) {
  return snapshot.tabState.tabs.length === 0;
}
