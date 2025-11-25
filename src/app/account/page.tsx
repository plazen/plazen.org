"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/app/components/ui/button";
import { motion } from "framer-motion";
import { PlazenLogo } from "@/components/plazen-logo";
import Link from "next/link";
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
  CreditCard,
  Crown,
  Loader2,
} from "lucide-react";
import Image from "next/image";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    weeklyStreak: 0,
    avgTaskDuration: 0,
  });

  // Subscription State
  const [subscription, setSubscription] = useState<{
    isPro: boolean;
    endsAt?: string;
    provider?: string;
  } | null>(null);

  // Profile Editing State
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [tempDisplayName, setTempDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Settings State
  const [notifications, setNotifications] = useState({
    notifications: true,
  });

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const loadAccountData = async () => {
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
        setAvatarUrl(session.user.user_metadata?.avatar_url || null);

        // Parallel data fetching
        await Promise.all([fetchSettings(), fetchStats(), fetchSubscription()]);
      } else {
        router.push("/login");
      }
      setLoading(false);
    };

    loadAccountData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase.auth]);

  // --- Fetchers ---

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setNotifications({ notifications: data.notifications ?? true });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const tasks = await response.json();
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

  const calculateWeeklyStreak = (
    tasks: { is_completed: boolean; scheduled_time: string | null }[]
  ) => {
    if (!tasks.length) return 0;
    const today = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      day.setHours(0, 0, 0, 0);
      last7Days.push(day);
    }

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
      } else if (i < last7Days.length - 1) {
        // Break if missing day (except today)
        break;
      }
    }
    return streak;
  };

  // --- Actions ---

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

  const handleUpdateNotifications = async (
    key: "email_updates" | "notifications",
    value: boolean
  ) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!response.ok) throw new Error("Failed to update settings");
    } catch (error) {
      console.error("Failed to save settings:", error);
      setNotifications((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const tasks = await response.json();
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "plazen-export.json";
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    if (confirm("Are you sure? This action cannot be undone.")) {
      try {
        // Note: Client-side deletion is restricted in Supabase by default.
        // You usually need a server action or function for this.
        // For now, we use the client method but it might fail if RLS prevents it.
        // Ideally: fetch('/api/account/delete', { method: 'DELETE' })

        const { error } = await supabase.rpc("delete_user"); // Custom RPC or API route preferred
        if (error) throw error;

        await supabase.auth.signOut();
        router.push("/login");
      } catch (error) {
        console.error("Deletion failed:", error);
        alert("Account deletion failed. Please contact support.");
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const completionRate =
    stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-lexend">
      <header className="border-b border-border backdrop-blur-sm bg-background/95 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            Back to Schedule
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* 1. User Profile Card */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-8 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 h-8">
                    {editingDisplayName ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="text-xl font-bold bg-input border border-border rounded px-2 py-1 h-8 w-48"
                          value={tempDisplayName}
                          onChange={(e) => setTempDisplayName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleUpdateDisplayName()
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleUpdateDisplayName}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingDisplayName(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold">{displayName}</h1>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingDisplayName(true)}
                          className="h-8 w-8 p-0 opacity-50 hover:opacity-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" /> {user.email}
                  </p>
                </div>
              </div>

              <div className="text-left md:text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Member Since
                </p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Subscription Status Card (NEW) */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6 relative overflow-hidden">
            {subscription?.isPro && (
              <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] pointer-events-none">
                <Crown className="w-48 h-48" />
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Subscription Plan
                </h3>
                <p className="text-muted-foreground mt-1">
                  {subscription?.isPro
                    ? "You are currently on the Pro plan. Thank you for supporting Plazen!"
                    : "You are currently on the Free plan."}
                </p>
                {subscription?.endsAt && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires on{" "}
                    {new Date(subscription.endsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button
                variant={subscription?.isPro ? "outline" : "default"}
                className={
                  subscription?.isPro
                    ? "border-primary/20 text-primary hover:bg-primary/5"
                    : ""
                }
                asChild
              >
                <Link href="/pricing">
                  {subscription?.isPro
                    ? "Manage Subscription"
                    : "Upgrade to Pro"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Tasks"
              value={stats.totalTasks}
              icon={Target}
              color="text-blue-500"
            />
            <StatCard
              label="Completed"
              value={stats.completedTasks}
              icon={Check}
              color="text-green-500"
            />
            <StatCard
              label="Day Streak"
              value={stats.weeklyStreak}
              icon={BarChart3}
              color="text-orange-500"
            />
            <StatCard
              label="Avg Duration"
              value={`${stats.avgTaskDuration}m`}
              icon={Clock}
              color="text-purple-500"
            />
          </div>

          {/* 4. Completion Rate */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Task Completion Rate
              </h3>
              <span className="text-xl font-bold">
                {completionRate.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                className="bg-gradient-to-r from-blue-500 to-primary h-full rounded-full"
              />
            </div>
          </div>

          {/* 5. Settings & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notifications */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notifications
              </h3>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Task Reminders</label>
                <Switch
                  checked={notifications.notifications}
                  onCheckedChange={(val) =>
                    handleUpdateNotifications("notifications", val)
                  }
                />
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" /> Export My Data
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* 6. Danger Zone */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your account and all data.
                </p>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col items-center text-center sm:items-start sm:text-left">
      <div
        className={`p-2 rounded-full bg-background border border-border mb-3 ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
        {label}
      </span>
    </div>
  );
}

function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (c: boolean) => void;
}) {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`${
          checked ? "translate-x-6" : "translate-x-1"
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  );
}
