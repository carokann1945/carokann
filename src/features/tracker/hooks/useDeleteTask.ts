import { toast } from 'sonner';
import { useTaskStore } from '../model/taskStore';
import type { Task } from '../model/types';

export function useDeleteTask() {
  const deleteTask = useTaskStore((store) => store.deleteTask);
  const restoreTask = useTaskStore((store) => store.restoreTask);

  const handleDelete = (task: Task) => {
    const displayTitle = task.title.length > 15 ? `${task.title.slice(0, 15)}...` : task.title;
    deleteTask(task.id);

    toast(`${displayTitle} - 삭제됨`, {
      duration: 5000,
      action: {
        label: '복구',
        onClick: () => restoreTask(task),
      },
    });
  };

  return { handleDelete };
}
