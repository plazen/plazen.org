"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { useTheme } from "@/components/theme-provider";
import { themes, Theme } from "@/lib/theme";
import { Info, Plus, Trash, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "./ui/select";

type CalendarSource = {
  id: string;
  name: string;
  url: string;
  username: string | null;
  color: string;
};

type Settings = {
  timetable_start: number;
  timetable_end: number;
  show_time_needle: boolean;
  theme: string;
  telegram_id: string | null;
};

type SettingsModalProps = {
  currentSettings: Settings;
  onClose: () => void;
  onSave: (newSettings: Omit<Settings, "theme"> & { theme: string }) => void;
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  currentSettings,
  onClose,
  onSave,
}) => {
  const [settings, setSettings] = useState(currentSettings);
  const [telegramId, setTelegramId] = useState(
    currentSettings.telegram_id || "",
  );
  const { setTheme } = useTheme();

  // Calendar State
  const [calendars, setCalendars] = useState<CalendarSource[]>([]);
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [newCalendar, setNewCalendar] = useState({
    name: "",
    url: "",
    username: "",
    password: "",
    color: "#3b82f6",
  });

  useEffect(() => {
    setSettings(currentSettings);
    setTelegramId(currentSettings.telegram_id || "");
    fetchCalendars();
  }, [currentSettings]);

  const fetchCalendars = async () => {
    const res = await fetch("/api/calendars");
    if (res.ok) setCalendars(await res.json());
  };

  const handleAddCalendar = async () => {
    const res = await fetch("/api/calendars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCalendar),
    });
    if (res.ok) {
      fetchCalendars();
      setIsAddingCalendar(false);
      setNewCalendar({
        name: "",
        url: "",
        username: "",
        password: "",
        color: "#3b82f6",
      });
    }
  };

  const handleDeleteCalendar = async (id: string) => {
    await fetch(`/api/calendars/${id}`, { method: "DELETE" });
    fetchCalendars();
  };

  const handleSave = () => {
    onSave({
      ...settings,
      telegram_id: telegramId,
    });
    setTheme(settings.theme as Theme);
  };

  const handleToggle = () => {
    setSettings((prev) => ({
      ...prev,
      show_time_needle: !prev.show_time_needle,
    }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md border border-border max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium leading-6 text-foreground mb-4">
            Settings
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="start-time"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Start Time
                </label>
                <Select
                  id="start-time"
                  value={settings.timetable_start}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      timetable_start: parseInt(e.target.value),
                    })
                  }
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{`${String(i).padStart(
                      2,
                      "0",
                    )}:00`}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="end-time"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  End Time
                </label>
                <Select
                  id="end-time"
                  value={settings.timetable_end}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      timetable_end: parseInt(e.target.value),
                    })
                  }
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{`${String(i).padStart(
                      2,
                      "0",
                    )}:00`}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-muted-foreground">
                Show current time indicator
              </span>
              <Switch
                checked={settings.show_time_needle}
                onClick={handleToggle}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="theme"
                className="block text-sm font-medium text-muted-foreground"
              >
                Theme
              </label>
              <div
                className="inline-flex items-center gap-1 rounded-md border border-input bg-background p-1 w-full"
                role="radiogroup"
                aria-label="Select theme"
              >
                {[
                  { value: "light", icon: Sun, label: "Light" },
                  { value: "dark", icon: Moon, label: "Dark" },
                  { value: "system", icon: Monitor, label: "System" },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={settings.theme === option.value}
                      aria-label={option.label}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          theme: option.value,
                        })
                      }
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm transition-all",
                        settings.theme === option.value
                          ? "bg-muted text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="telegram-id"
                className="block text-sm font-medium text-muted-foreground"
              >
                Telegram Chat ID
              </label>
              <Input
                id="telegram-id"
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Talk to the bot to get your ID"
              />
              <div className="mt-2 flex items-start space-x-2 text-xs text-muted-foreground p-2 bg-input/50 rounded-lg">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  To get this, find your Plazen bot on Telegram and send the
                  `/start` command.
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Integrations</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingCalendar(!isAddingCalendar)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Calendar
                </Button>
              </div>

              {isAddingCalendar && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <Input
                    placeholder="Name (e.g. Work)"
                    value={newCalendar.name}
                    onChange={(e) =>
                      setNewCalendar({ ...newCalendar, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="CalDAV URL"
                    value={newCalendar.url}
                    onChange={(e) =>
                      setNewCalendar({ ...newCalendar, url: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Username"
                      value={newCalendar.username}
                      onChange={(e) =>
                        setNewCalendar({
                          ...newCalendar,
                          username: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={newCalendar.password}
                      onChange={(e) =>
                        setNewCalendar({
                          ...newCalendar,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingCalendar(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddCalendar}>
                      Add
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {calendars.map((cal) => (
                  <div
                    key={cal.id}
                    className="flex items-center justify-between p-3 bg-card border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cal.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">{cal.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {cal.url}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCalendar(cal.id)}
                    >
                      <Trash className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsModal;
