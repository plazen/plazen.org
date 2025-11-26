import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Trash2, Plus, Clock, Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  isProPlan: boolean;
}

const TaskFormFields = ({
  taskData,
  onDataChange,
}: {
  taskData: {
    title: string;
    description?: string;
    duration_minutes: number;
  };
  onDataChange: (field: string, value: string | number) => void;
}) => (
  <>
    <div className="space-y-2">
      <label htmlFor="title" className="text-sm font-medium">
        Title
      </label>
      <input
        id="title"
        type="text"
        value={taskData.title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onDataChange("title", e.target.value)
        }
        placeholder="e.g., Daily workout, Meditation, Reading..."
        className="w-full px-4 py-3 border border-border rounded-xl bg-input focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all outline-none"
        required
      />
    </div>

    <div className="space-y-2">
      <label htmlFor="description" className="text-sm font-medium">
        Description (Optional)
      </label>
      <textarea
        id="description"
        value={taskData.description || ""}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onDataChange("description", e.target.value)
        }
        placeholder="e.g., Focus on cardio, read 2 chapters..."
        className="w-full px-4 py-3 border border-border rounded-xl bg-input focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all outline-none min-h-[100px]"
      />
    </div>

    <div className="space-y-2">
      <label htmlFor="duration" className="text-sm font-medium">
        Duration (minutes)
      </label>
      <input
        id="duration"
        type="text"
        inputMode="numeric"
        value={taskData.duration_minutes === 0 ? "" : taskData.duration_minutes}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const numericVal = e.target.value.replace(/[^0-9]/g, "");
          onDataChange("duration_minutes", parseInt(numericVal) || 0);
        }}
        placeholder="e.g., 30"
        className="w-full px-4 py-3 border border-border rounded-xl bg-input focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all outline-none"
        required
      />
    </div>
  </>
);

function RoutineTasksManager({ isProPlan }: RoutineTasksManagerProps) {
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTaskToEdit, setCurrentTaskToEdit] =
    useState<RoutineTask | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const routineLimitReached = !isProPlan && routineTasks.length >= 1;

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
    setFormError(null);

    if (routineLimitReached) {
      setFormError(
        "Free plan allows one routine task. Upgrade to Pro to add more."
      );
      return;
    }

    if (!newTask.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (newTask.duration_minutes < 5) {
      setFormError("Duration must be at least 5 minutes.");
      return;
    }

    try {
      const response = await fetch("/api/routine-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setFormError(payload.error || "Failed to add task. Please try again.");
        return;
      }

      const createdTask = await response.json();
      setRoutineTasks((prev) => [createdTask, ...prev]);
      setNewTask({ title: "", description: "", duration_minutes: 30 });
      setIsAddDialogOpen(false);
      setFormError(null);
    } catch (error) {
      console.error("Error creating routine task:", error);
      setFormError("Failed to add task. Please try again.");
    }
  };

  const handleOpenEditDialog = (task: RoutineTask) => {
    setCurrentTaskToEdit(task);
    setIsEditDialogOpen(true);
    setFormError(null);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!currentTaskToEdit) return;

    if (!currentTaskToEdit.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (currentTaskToEdit.duration_minutes < 5) {
      setFormError("Duration must be at least 5 minutes.");
      return;
    }

    try {
      const response = await fetch(
        `/api/routine-tasks/${currentTaskToEdit.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: currentTaskToEdit.title,
            description: currentTaskToEdit.description,
            duration_minutes: currentTaskToEdit.duration_minutes,
          }),
        }
      );

      if (response.ok) {
        const updatedTask = await response.json();
        setRoutineTasks(
          routineTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          )
        );
        setIsEditDialogOpen(false);
        setCurrentTaskToEdit(null);
        setFormError(null);
      }
    } catch (error) {
      console.error("Error updating routine task:", error);
      setFormError("Failed to update task. Please try again.");
    }
  };

  const handleToggleTaskActive = async (task: RoutineTask) => {
    const newIsActive = !task.is_active;

    setRoutineTasks(
      routineTasks.map((t) =>
        t.id === task.id ? { ...t, is_active: newIsActive } : t
      )
    );

    try {
      const response = await fetch(`/api/routine-tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: newIsActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }
    } catch (error) {
      console.error("Error toggling routine task:", error);
      setRoutineTasks(
        routineTasks.map((t) =>
          t.id === task.id ? { ...t, is_active: !newIsActive } : t
        )
      );
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

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    setFormError(null);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setFormError(null);
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
              disabled={routineLimitReached}
              title={
                routineLimitReached
                  ? "Free plan allows one routine task. Upgrade to Pro to add more."
                  : undefined
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            {!isProPlan && (
              <Button variant="outline" asChild>
                <Link href="/pricing">Upgrade to Pro</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {routineLimitReached && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Free plan lets you keep one routine task. Upgrade to Pro to unlock
          unlimited routines that auto-schedule with your day.
        </div>
      )}

      <AnimatePresence>
        {isAddDialogOpen && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAddDialog}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Add Routine Task</h3>
                  <p className="text-muted-foreground text-sm">
                    Create a routine task that can be automatically scheduled.
                  </p>
                </div>

                <form onSubmit={handleAddTask} className="space-y-4">
                  <TaskFormFields
                    taskData={newTask}
                    onDataChange={(field, value) =>
                      setNewTask({ ...newTask, [field]: value })
                    }
                  />

                  {formError && (
                    <p className="text-sm text-destructive">{formError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeAddDialog}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="shadow-sm">
                      Add Task
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditDialogOpen && currentTaskToEdit && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEditDialog}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Edit Routine Task</h3>
                  <p className="text-muted-foreground text-sm">
                    Update the details for your routine task.
                  </p>
                </div>

                <form onSubmit={handleUpdateTask} className="space-y-4">
                  <TaskFormFields
                    taskData={currentTaskToEdit}
                    onDataChange={(field, value) =>
                      setCurrentTaskToEdit({
                        ...currentTaskToEdit,
                        [field]: value,
                      } as RoutineTask)
                    }
                  />

                  {formError && (
                    <p className="text-sm text-destructive">{formError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeEditDialog}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="shadow-sm">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {routineTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="border border-dashed border-border rounded-2xl p-12 text-center bg-card/50"
        >
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
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {routineTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  height: 0,
                  padding: 0,
                  margin: 0,
                  transition: { duration: 0.2 },
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`group bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-200 overflow-hidden ${
                  !task.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
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
                      <button
                        onClick={() => handleToggleTaskActive(task)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          task.is_active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                        }`}
                      >
                        {task.is_active ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        {task.is_active ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 -mr-2 -mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditDialog(task)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-40 hover:opacity-100 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-40 hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
export { RoutineTasksManager };
