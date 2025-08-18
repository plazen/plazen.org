"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { PlazenLogo } from "@/components/plazen-logo";
import {
  User as UserIcon,
  Settings,
  Calendar,
  BarChart3,
  Clock,
  Target,
  LogOut,
  Mail,
  Shield,
  Bell,
  Download,
  Trash2,
  Edit,
  Check,
  X,
} from "lucide-react";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    weeklyStreak: 0,
    avgTaskDuration: 0,
  });
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [tempDisplayName, setTempDisplayName] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    taskReminders: true,
  });

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setDisplayName(
          session.user.user_metadata?.display_name ||
            session.user.email?.split("@")[0] ||
            ""
        );
        setTempDisplayName(
          session.user.user_metadata?.display_name ||
            session.user.email?.split("@")[0] ||
            ""
        );
        await fetchStats();
      } else {
        router.push("/login");
      }
      setLoading(false);
    };
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase.auth]);

  const calculateWeeklyStreak = (
    tasks: { is_completed: boolean; scheduled_time: string | null }[]
  ) => {
    if (!tasks.length) return 0;

    // Get the last 7 days
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      day.setHours(0, 0, 0, 0);
      last7Days.push(day);
    }

    // Check each day for completed tasks
    let streak = 0;
    for (let i = last7Days.length - 1; i >= 0; i--) {
      const day = last7Days[i];
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const hasCompletedTask = tasks.some((task) => {
        if (!task.is_completed || !task.scheduled_time) return false;
        const taskDate = new Date(task.scheduled_time);
        return taskDate >= day && taskDate < nextDay;
      });

      if (hasCompletedTask) {
        streak++;
      } else {
        // If it's not today and no completed task, break the streak
        if (i < last7Days.length - 1) {
          break;
        }
      }
    }

    return streak;
  };

  const fetchStats = async () => {
    try {
      // Fetch task statistics
      const tasksResponse = await fetch("/api/tasks");
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        const completed = tasks.filter(
          (t: { is_completed: boolean }) => t.is_completed
        ).length;
        const avgDuration =
          tasks.length > 0
            ? Math.round(
                tasks.reduce(
                  (acc: number, t: { duration_minutes?: number }) =>
                    acc + (t.duration_minutes || 60),
                  0
                ) / tasks.length
              )
            : 60;

        setStats({
          totalTasks: tasks.length,
          completedTasks: completed,
          weeklyStreak: calculateWeeklyStreak(tasks),
          avgTaskDuration: avgDuration,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleUpdateDisplayName = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: tempDisplayName },
      });
      if (!error) {
        setDisplayName(tempDisplayName);
        setEditingDisplayName(false);
      }
    } catch (error) {
      console.error("Failed to update display name:", error);
    }
  };

  const handleUpdateNotifications = async (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    // In a real app, you'd save this to your database
  };

  const handleExportData = async () => {
    try {
      const tasksResponse = await fetch("/api/tasks");
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "plazen-tasks-export.json";
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      // In a real app, you'd implement account deletion
      alert("Account deletion would be implemented here.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const completionRate =
    stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="mb-4">Please log in to access your account.</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border backdrop-blur-sm bg-background/95 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => router.push("/schedule")}
            >
              <PlazenLogo />
              <span className="text-xl font-semibold">Plazen</span>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/schedule")}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Back to Schedule
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Profile Header */}
          <div className="bg-card rounded-xl shadow-lg border border-border p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {editingDisplayName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempDisplayName}
                          onChange={(e) => setTempDisplayName(e.target.value)}
                          className="text-xl font-bold bg-input border border-border rounded px-2 py-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateDisplayName();
                            if (e.key === "Escape") {
                              setEditingDisplayName(false);
                              setTempDisplayName(displayName);
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleUpdateDisplayName}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingDisplayName(false);
                            setTempDisplayName(displayName);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{displayName}</h1>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingDisplayName(true)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-lg border border-border p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-lg border border-border p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedTasks}
                  </p>
                </div>
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-lg border border-border p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Streak</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.weeklyStreak}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-lg border border-border p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">{stats.avgTaskDuration}m</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </motion.div>
          </div>

          {/* Completion Rate Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border p-6 mb-8"
          >
            <h3 className="text-lg font-semibold mb-4">Task Completion Rate</h3>
            <div className="w-full bg-muted rounded-full h-4 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ delay: 0.7, duration: 1 }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {completionRate.toFixed(1)}% of tasks completed
            </p>
          </motion.div>

          {/* Settings Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Notification Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </h3>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      {key === "email" ? "Email Updates" : "Task Reminders"}
                    </label>
                    <button
                      onClick={() => handleUpdateNotifications(key, !value)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        value ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          value ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Account Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Actions
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export My Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/schedule")}
                  className="w-full justify-start"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Schedule
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-card rounded-xl border border-destructive/20 p-6 mt-8"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              These actions are irreversible. Please proceed with caution.
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
