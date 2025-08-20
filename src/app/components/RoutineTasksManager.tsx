"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Trash2, Plus, Clock } from "lucide-react";

interface RoutineTask {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RoutineTasksManagerProps {
  onClose?: () => void;
}
// eslint-disable-next-line
function RoutineTasksManager({ onClose }: RoutineTasksManagerProps) {
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state for adding new routine task
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    duration_minutes: 30,
  });

  useEffect(() => {
    fetchRoutineTasks();
  }, []);

  const fetchRoutineTasks = async () => {
    try {
      const response = await fetch("/api/routine-tasks");
      if (response.ok) {
        const tasks = await response.json();
        setRoutineTasks(tasks);
      }
    } catch (error) {
      console.error("Error fetching routine tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch("/api/routine-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (response.ok) {
        const createdTask = await response.json();
        setRoutineTasks([createdTask, ...routineTasks]);
        setNewTask({ title: "", description: "", duration_minutes: 30 });
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating routine task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/routine-tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRoutineTasks(routineTasks.filter((task) => task.id !== taskId));
      }
    } catch (error) {
      console.error("Error deleting routine task:", error);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div
            className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-primary/40 rounded-full animate-spin"
            style={{ animationDelay: "150ms" }}
          ></div>
        </div>
        <p className="text-muted-foreground text-sm">
          Loading routine tasks...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground">
              Manage your daily routine tasks that can be automatically
              scheduled into your day
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Add Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Add Routine Task</h3>
                <p className="text-muted-foreground text-sm">
                  Create a routine task that can be automatically scheduled.
                </p>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newTask.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    placeholder="e.g., Daily workout, Meditation, Reading..."
                    className="w-full px-4 py-3 border border-border rounded-xl bg-input focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="duration" className="text-sm font-medium">
                    Duration (minutes)
                  </label>
                  <input
                    id="duration"
                    type="number"
                    min="5"
                    max="480"
                    step="5"
                    value={newTask.duration_minutes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewTask({
                        ...newTask,
                        duration_minutes: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-full px-4 py-3 border border-border rounded-xl bg-input focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all outline-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="shadow-sm">
                    Add Task
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {routineTasks.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-card/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No routine tasks yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Create routine tasks that can be automatically scheduled into your
            day for better productivity.
          </p>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Task
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {routineTasks.map((task) => (
            <div
              key={task.id}
              className="group bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-ring/20 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-sm text-secondary-foreground font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(task.duration_minutes)}
                    </span>
                    {task.is_active && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export { RoutineTasksManager };
