"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Trash2, Edit, Plus, X, Eye, EyeOff } from "lucide-react";

type Notification = {
  id: string;
  message: string | null;
  show: boolean;
  created_at: Date;
  updated_at: Date | null;
};

export function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/notifications");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        } else {
          setError("Failed to fetch notifications");
        }
      } catch (error) {
        setError("Failed to fetch notifications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const clearForm = () => {
    setMessage("");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    const url = editingId
      ? `/api/admin/notifications/${editingId}`
      : "/api/admin/notifications";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, show: true }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save notification");
      }

      const updatedNotification = await res.json();

      if (editingId) {
        setNotifications(
          notifications.map((n) =>
            n.id === editingId ? updatedNotification : n
          )
        );
      } else {
        setNotifications([updatedNotification, ...notifications]);
      }
      clearForm();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to save notification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingId(notification.id);
    setMessage(notification.message || "");
  };

  const handleToggleShow = async (notification: Notification) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show: !notification.show }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to toggle notification");
      }
      const updatedNotification = await res.json();
      setNotifications(
        notifications.map((n) =>
          n.id === notification.id ? updatedNotification : n
        )
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle notification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete notification");
      }
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete notification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin: App Notifications</h1>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-card p-6 rounded-xl border border-border mb-8 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Notification" : "Create New Notification"}
        </h2>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <textarea
          placeholder="Notification message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="flex justify-end gap-3">
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Edit
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            <Plus className="w-4 h-4 mr-2" />
            {editingId ? "Update Notification" : "Create Notification"}
          </Button>
        </div>
      </form>

      {/* List of Notifications */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-card p-4 rounded-xl border border-border flex justify-between items-start ${
              !notification.show ? "opacity-50" : ""
            }`}
          >
            <div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  notification.show
                    ? "bg-green-500/10 text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {notification.show ? "Visible" : "Hidden"}
              </span>
              <p className="text-sm mt-2 whitespace-pre-wrap">
                {notification.message}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleToggleShow(notification)}
                disabled={isLoading}
                title={notification.show ? "Hide" : "Show"}
              >
                {notification.show ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEdit(notification)}
                disabled={isLoading}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(notification.id)}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
