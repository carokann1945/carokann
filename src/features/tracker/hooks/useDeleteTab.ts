import { toast } from 'sonner';
import { useTabStore } from '../model/tabStore';
import { useTaskStore } from '../model/taskStore';
import type { Tab } from '../model/types';

export function useDeleteTab() {
  const deleteTab = useTabStore((store) => store.deleteTab);
  const restoreTab = useTabStore((store) => store.restoreTab);
  const restoreTasksByTab = useTaskStore((store) => store.restoreTasksByTab);

  const handleDelete = (tab: Tab) => {
    const displayName = tab.name.length > 15 ? `${tab.name.slice(0, 15)}...` : tab.name;
    const deletedTasks = useTaskStore.getState().state.tasks.filter((t) => t.tabId === tab.id);
    deleteTab(tab.id);

    toast(`${displayName} - 삭제됨`, {
      duration: 5000,
      action: {
        label: '복구',
        onClick: () => {
          restoreTab(tab);
          restoreTasksByTab(deletedTasks);
        },
      },
    });
  };

  return { handleDelete };
}
