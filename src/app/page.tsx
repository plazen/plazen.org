"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import Timetable from "./components/Timetable";
import RescheduleModal from "./components/RescheduleModal";
import SettingsModal from "./components/SettingsModal";
import { Calendar } from "./components/ui/calendar";
import { Button } from "./components/ui/button";
import { PlusIcon } from "lucide-react";

const PlazenLogo = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white"
  >
    <path
      d="M3 12C5.66667 8 7.33333 8 10 12C12.6667 16 14.3333 16 17 12C19.6667 8 21 8 21 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="10" r="1.5" fill="currentColor" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    <circle cx="18" cy="10" r="1.5" fill="currentColor" />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 text-gray-400"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 text-gray-400"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
type ToggleSwitchProps = { isToggled: boolean; onToggle: () => void };
const ToggleSwitch = ({ isToggled, onToggle }: ToggleSwitchProps) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      isToggled ? "bg-primary" : "bg-gray-600"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        isToggled ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

export default function App() {
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

  const [reschedulingTask, setReschedulingTask] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const router = useRouter();
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
      console.log("Fetching tasks for date:", dateString, selectedDate);
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
        router.push("/login");
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
  }, [router, supabase.auth]);

  useEffect(() => {
    if (date && user) {
      fetchTasks(date);
    }
  }, [date, fetchTasks, user]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const toLocalISOString = (dateToFormat: Date) => {
      const year = dateToFormat.getFullYear();
      const month = (dateToFormat.getMonth() + 1).toString().padStart(2, "0");
      const day = dateToFormat.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const isForToday = date
      ? new Date().toDateString() === date.toDateString()
      : true;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          is_time_sensitive: isTimeSensitive,
          duration_minutes: isTimeSensitive ? null : Number(duration),
          scheduled_time: isTimeSensitive
            ? new Date(scheduledTime).toISOString()
            : null,
          user_current_time: new Date().toISOString(),
          for_date: toLocalISOString(date || new Date()),
          is_for_today: isForToday,
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
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <PlazenLogo />
              <span className="text-xl font-semibold">Plazen</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
              >
                <SettingsIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/account")}
              >
                <UserIcon />
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
          <div className="lg-col-span-1 space-y-8">
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
                  <ToggleSwitch
                    isToggled={isTimeSensitive}
                    onToggle={() => setIsTimeSensitive(!isTimeSensitive)}
                  />
                </div>
                <div>
                  <label htmlFor="timing" className="sr-only">
                    {isTimeSensitive
                      ? "Specific Time"
                      : "Estimated Duration (minutes)"}
                  </label>
                  {isTimeSensitive ? (
                    <input
                      type="datetime-local"
                      id="timing"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-input border-border text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  ) : (
                    <input
                      type="number"
                      id="timing"
                      value={duration}
                      onChange={(e) =>
                        setDuration(parseInt(e.target.value, 10))
                      }
                      className="mt-1 block w-full rounded-md bg-input border-border text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  )}
                </div>
                <Button type="submit" className="w-full">
                  <PlusIcon className="mr-2" />
                  Add to Schedule
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
          </div>

          <div className="lg:col-span-2">
            <Timetable
              tasks={tasks}
              settings={settings}
              date={date || new Date()}
              tasksLoading={tasksLoading}
              onToggleDone={handleToggleDone}
              onDeleteTask={handleDeleteTask}
              onReschedule={handleOpenRescheduleModal}
            />
          </div>
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
