"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Switch } from "./ui/switch";
import { useTheme } from "@/components/theme-provider";
import { themes, Theme } from "@/lib/theme";
import { Info } from "lucide-react";

type Settings = {
  timetable_start: number;
  timetable_end: number;
  show_time_needle: boolean;
  theme: string;
  telegram_id: string | null; // Add new field
};

type SettingsModalProps = {
  currentSettings: Settings;
  onClose: () => void;
  onSave: (newSettings: Omit<Settings, "theme"> & { theme: string }) => void; // Ensure theme is a string
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  currentSettings,
  onClose,
  onSave,
}) => {
  const [settings, setSettings] = useState(currentSettings);
  // Add state for the new telegram_id field
  const [telegramId, setTelegramId] = useState(
    currentSettings.telegram_id || ""
  );
  const { setTheme } = useTheme();

  useEffect(() => {
    setSettings(currentSettings);
    setTelegramId(currentSettings.telegram_id || "");
  }, [currentSettings]);

  const handleSave = () => {
    onSave({
      ...settings,
      telegram_id: telegramId, // Include the new field on save
    });
    // Update the theme context when saving
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
          className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md border border-border"
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
                      "0"
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
                      "0"
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
              <Select
                id="theme"
                value={settings.theme}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    theme: e.target.value,
                  })
                }
              >
                {Object.values(themes).map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.name}
                  </option>
                ))}
              </Select>
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
