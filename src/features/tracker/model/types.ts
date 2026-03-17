export type Tab = {
  id: string;
  name: string;
  position: number;
};

export type AppState = {
  version: 1;
  tabs: Tab[];
  activeTabId: string | null;
};
