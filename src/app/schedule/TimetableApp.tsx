"use client";

import React, { useState, useEffect, useCallback } from "react";
import Timetable from "@/app/components/Timetable";
import RescheduleModal from "@/app/components/RescheduleModal";
import SettingsModal from "@/app/components/SettingsModal";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import TimetableSkeleton from "@/app/components/TimetableSkeleton";
import { Calendar } from "@/app/components/ui/calendar";
import { Button } from "@/app/components/ui/button";
import { Slider } from "@/app/components/ui/slider";
import { PlusIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";

const durationSteps = [
  15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360,
];

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = minutes / 60;
  return `${hours} hour${hours > 1 ? "s" : ""}`;
};

export default function TimetableApp() {
  const [user, setUser] = useState<User | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  type Task = {
    id: string;
    title: string;
    is_time_sensitive: boolean;
    duration_minutes: number | null;
    scheduled_time: string | null;
    is_completed: boolean;
  };
  type Settings = {
    timetable_start: number;
    timetable_end: number;
    show_time_needle: boolean;
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isTimeSensitive, setIsTimeSensitive] = useState(false);
  const [duration, setDuration] = useState(30);
  const [scheduledTime, setScheduledTime] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [reschedulingTask, setReschedulingTask] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchTasks = useCallback(async (selectedDate: Date) => {
    setTasksLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      const response = await fetch(`/api/tasks?date=${dateString}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const fetchedTasks = await response.json();
      setTasks(fetchedTasks);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkUserAndFetch = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      setUser(session.user);

      try {
        const settingsResponse = await fetch("/api/settings");
        if (!settingsResponse.ok) {
          throw new Error("Failed to fetch settings");
        }
        const fetchedSettings = await settingsResponse.json();
        setSettings(fetchedSettings);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
      setLoading(false);
    };
    checkUserAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (date && user) {
      fetchTasks(date);
    }
  }, [date, fetchTasks, user]);

  const toLocalISOString = (dateToFormat: Date) => {
    const year = dateToFormat.getFullYear();
    const month = (dateToFormat.getMonth() + 1).toString().padStart(2, "0");
    const day = dateToFormat.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isAddingTask) return;
    setIsAddingTask(true);

    const isForToday = date
      ? new Date().toDateString() === date.toDateString()
      : true;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const localTimeString = `${now.getFullYear()}-${pad(
      now.getMonth() + 1
    )}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(
      now.getMinutes()
    )}:${pad(now.getSeconds())}`;
    let finalScheduledTime = null;
    if (isTimeSensitive && scheduledTime && date) {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      const combinedDate = new Date(date);
      combinedDate.setHours(hours, minutes, 0, 0);
      finalScheduledTime = combinedDate.toISOString();
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          is_time_sensitive: isTimeSensitive,
          duration_minutes: Number(duration),
          scheduled_time: finalScheduledTime,
          user_current_time: localTimeString,
          for_date: toLocalISOString(date || new Date()),
          is_for_today: isForToday,
          timezone_offset: new Date().getTimezoneOffset(),
        }),
      });
      if (!response.ok) throw new Error("Failed to add task");
      const addedTask = await response.json();
      setTasks((prev) => [...prev, addedTask]);
      setNewTaskTitle("");
      setIsTimeSensitive(false);
      setDuration(30);
      setScheduledTime("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleDone = async (taskId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, is_completed: !currentStatus }),
      });
      if (!response.ok) throw new Error("Failed to update task status");
      const updatedTask = await response.json();
      setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
      if (!response.ok) throw new Error("Failed to delete task");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  const handleOpenRescheduleModal = (task: Task) => setReschedulingTask(task);
  const handleCloseRescheduleModal = () => setReschedulingTask(null);

  const handleUpdateTaskTime = async (taskId: string, newTime: string) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, scheduled_time: newTime }),
      });
      if (!response.ok) throw new Error("Failed to reschedule task");
      const updatedTask = await response.json();
      setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)));
      handleCloseRescheduleModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setIsSettingsOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <LoadingSpinner
          size="lg"
          text="Loading your workspace..."
          variant="dots"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl font-semibold">Plazen</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
              >
                <span>⚙️</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (window.location.href = "/account")}
              >
                <span>👤</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-destructive/20 border border-destructive text-destructive-foreground rounded-md p-4 mb-6">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            className="lg-col-span-1 space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
              <h2 className="text-lg font-medium mb-4">Add a New Task</h2>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label htmlFor="task-title" className="sr-only">
                    Task Title
                  </label>
                  <input
                    type="text"
                    id="task-title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-input border-border text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="e.g., Water the plants"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Time Sensitive?
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTimeSensitive(!isTimeSensitive)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isTimeSensitive ? "bg-primary" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isTimeSensitive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {isTimeSensitive && (
                  <div>
                    <label
                      htmlFor="scheduled-time"
                      className="block text-sm font-medium text-muted-foreground mb-1"
                    >
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="scheduled-time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-input border-border text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="duration"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Duration
                    </label>
                    <span className="text-sm font-semibold text-foreground">
                      {formatDuration(duration)}
                    </span>
                  </div>
                  <Slider
                    id="duration"
                    min={0}
                    max={durationSteps.length - 1}
                    step={1}
                    value={[durationSteps.indexOf(duration)]}
                    onValueChange={(value) =>
                      setDuration(durationSteps[value[0]])
                    }
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isAddingTask || !newTaskTitle.trim()}
                >
                  <AnimatePresence mode="wait">
                    {isAddingTask ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        Adding task...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add to Schedule
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </form>
            </div>
            <div className="bg-card rounded-lg shadow-lg border border-border">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-4 w-full"
              />
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            {tasksLoading ? (
              <TimetableSkeleton
                startHour={settings.timetable_start}
                endHour={settings.timetable_end}
              />
            ) : (
              <Timetable
                tasks={tasks}
                settings={settings}
                date={date || new Date()}
                onToggleDone={handleToggleDone}
                onDeleteTask={handleDeleteTask}
                onReschedule={handleOpenRescheduleModal}
              />
            )}
          </motion.div>
        </div>
      </main>

      {reschedulingTask && (
        <RescheduleModal
          task={reschedulingTask}
          onClose={handleCloseRescheduleModal}
          onSave={handleUpdateTaskTime}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal
          currentSettings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
