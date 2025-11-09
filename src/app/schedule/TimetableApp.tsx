"use client";

import React, { useState, useEffect, useCallback } from "react";
import Timetable from "@/app/components/Timetable";
import RescheduleModal from "@/app/components/RescheduleModal";
import SettingsModal from "@/app/components/SettingsModal";
import AddTaskModal from "@/app/components/AddTaskModal";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import TimetableSkeleton from "@/app/components/TimetableSkeleton";
import { RoutineTasksManager } from "@/app/components/RoutineTasksManager";
import { Calendar } from "@/app/components/ui/calendar";
import { Button } from "@/app/components/ui/button";
import { PlusIcon, Settings, User2Icon, RefreshCw } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { Theme } from "@/lib/theme";
import { PlazenLogo } from "@/components/plazen-logo";

export default function TimetableApp() {
  const [user, setUser] = useState<User | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const { setTheme } = useTheme();
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
    telegram_id: string | null;
    show_time_needle: boolean;
    theme: string;
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [reschedulingTask, setReschedulingTask] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRoutineTasksOpen, setIsRoutineTasksOpen] = useState(false);

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
      const timezoneOffset = new Date().getTimezoneOffset();

      const response = await fetch(
        `/api/tasks?date=${dateString}&timezoneOffset=${timezoneOffset}`
      );
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

        // Sync theme with the settings
        if (fetchedSettings.theme) {
          setTheme(fetchedSettings.theme as Theme);
        }
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

  const handleAddTask = async (taskData: {
    title: string;
    isTimeSensitive: boolean;
    duration: number;
    scheduledTime: string;
  }) => {
    if (isAddingTask) return;
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
    if (taskData.isTimeSensitive && taskData.scheduledTime && date) {
      const [hours, minutes] = taskData.scheduledTime.split(":").map(Number);
      const combinedDate = new Date(date);
      combinedDate.setHours(hours, minutes, 0, 0);
      const year = combinedDate.getFullYear();
      const month = (combinedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = combinedDate.getDate().toString().padStart(2, "0");
      const hour = combinedDate.getHours().toString().padStart(2, "0");
      const minute = combinedDate.getMinutes().toString().padStart(2, "0");
      const second = combinedDate.getSeconds().toString().padStart(2, "0");
      finalScheduledTime = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskData.title,
          is_time_sensitive: taskData.isTimeSensitive,
          duration_minutes: Number(taskData.duration),
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
      setIsAddTaskModalOpen(false);
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

  const handleUpdateTaskTime = async (
    taskId: string,
    newTime: string,
    newTitle?: string
  ) => {
    try {
      const requestBody: {
        id: string;
        scheduled_time: string;
        title?: string;
      } = {
        id: taskId,
        scheduled_time: newTime,
      };

      if (newTitle) {
        requestBody.title = newTitle;
      }

      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) throw new Error("Failed to reschedule task");

      // Refetch tasks to ensure the timetable reflects the current date correctly
      // This handles cases where tasks are moved to different dates
      if (date) {
        await fetchTasks(date);
      }

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
      <header className="border-b border-border backdrop-blur-sm bg-background/95 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <PlazenLogo theme={settings?.theme} />
              <span className="text-xl font-semibold hidden sm:block">
                Plazen
              </span>
              <span className="text-sm text-muted-foreground">
                {date?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRoutineTasksOpen(true)}
                className="h-9 w-9"
                title="Routine Tasks"
              >
                <span>
                  <RefreshCw />
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="h-9 w-9"
              >
                <span>
                  <Settings />
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (window.location.href = "/account")}
                className="h-9 w-9"
              >
                <span>
                  <User2Icon />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/20 border border-destructive text-destructive-foreground rounded-lg p-4 mb-6"
          >
            {error}
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Calendar Sidebar */}
          <motion.div
            className="lg:w-80 flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-4 w-full"
              />
            </div>
          </motion.div>

          {/* Main Timetable */}
          <motion.div
            className="flex-1 min-w-0"
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

        {/* Floating Action Button */}
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.5 }}
        >
          <Button
            onClick={() => setIsAddTaskModalOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
          >
            <PlusIcon className="h-6 w-6" />
          </Button>
        </motion.div>
      </main>

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSubmit={handleAddTask}
        isLoading={isAddingTask}
      />

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

      {isRoutineTasksOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-background rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Routine Tasks</h2>
                <Button
                  variant="ghost"
                  onClick={() => setIsRoutineTasksOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </Button>
              </div>
              <RoutineTasksManager
                onClose={() => {
                  setIsRoutineTasksOpen(false);
                  // Refresh tasks when routine tasks are generated
                  if (date) {
                    fetchTasks(date);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
