"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Trash2, Plus, Clock, RefreshCw } from "lucide-react";

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

export function RoutineTasksManager({ onClose }: RoutineTasksManagerProps) {
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [generatingTasks, setGeneratingTasks] = useState(false);

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

  const handleGenerateRoutineTasks = async () => {
    if (selectedTasks.length === 0) return;

    setGeneratingTasks(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const dateString = today.toISOString().split("T")[0];

      const response = await fetch("/api/routine-tasks/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: dateString,
          selectedRoutineTaskIds: selectedTasks,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Successfully created ${result.tasks.length} routine tasks for today!`
        );
        setIsGenerateDialogOpen(false);
        setSelectedTasks([]);
        if (onClose) onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error generating routine tasks:", error);
      alert("Error generating routine tasks");
    } finally {
      setGeneratingTasks(false);
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

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Manage your daily routine tasks that can be randomized into your
            schedule
          </p>
        </div>
        <div className="flex gap-2">
          {isGenerateDialogOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-2">
                  Generate Routine Tasks for Today
                </h3>
                <p className="text-muted-foreground mb-4">
                  Select which routine tasks you want to add to today&apos;s
                  schedule. They will be randomly placed in available time
                  slots.
                </p>
                <div className="space-y-4">
                  {routineTasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={task.id}
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="rounded"
                      />
                      <label
                        htmlFor={task.id}
                        className="flex-1 cursor-pointer text-sm font-medium leading-none"
                      >
                        {task.title}
                        <span className="ml-2 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                          {formatDuration(task.duration_minutes)}
                        </span>
                      </label>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsGenerateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerateRoutineTasks}
                      disabled={selectedTasks.length === 0 || generatingTasks}
                    >
                      {generatingTasks ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        `Generate ${selectedTasks.length} Task${
                          selectedTasks.length !== 1 ? "s" : ""
                        }`
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Add Dialog */}
          {isAddDialogOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-2">
                  Add New Routine Task
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create a routine task that can be randomly scheduled into your
                  day.
                </p>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium mb-1"
                    >
                      Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={newTask.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      placeholder="e.g., Daily workout, Meditation, Read..."
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="duration"
                      className="block text-sm font-medium mb-1"
                    >
                      Duration (minutes)
                    </label>
                    <input
                      id="duration"
                      type="number"
                      min="1"
                      max="480"
                      value={newTask.duration_minutes}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewTask({
                          ...newTask,
                          duration_minutes: parseInt(e.target.value) || 30,
                        })
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Task</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Routine Task
          </Button>
        </div>
      </div>

      {routineTasks.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
          <h3 className="text-lg font-medium mb-2">No routine tasks yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create routine tasks that can be automatically scheduled into your
            day
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Routine Task
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {routineTasks.map((task) => (
            <div
              key={task.id}
              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  {task.description && (
                    <p className="text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                  <Clock className="w-3 h-3 mr-1 inline" />
                  {formatDuration(task.duration_minutes)}
                </span>
                {task.is_active && (
                  <span className="px-2 py-1 bg-green-500 text-white rounded text-sm">
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
