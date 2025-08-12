"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Settings = {
  timetable_start: number;
  timetable_end: number;
  show_time_needle: boolean;
};

type SettingsModalProps = {
  currentSettings: Settings;
  onClose: () => void;
  onSave: (newSettings: Settings) => void;
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  currentSettings,
  onClose,
  onSave,
}) => {
  const [settings, setSettings] = useState(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = () => {
    onSave(settings);
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium leading-6 text-white mb-4">
            Settings
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start-time"
                  className="block text-sm font-medium text-gray-300"
                >
                  Start Time
                </label>
                <select
                  id="start-time"
                  value={settings.timetable_start}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      timetable_start: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{`${String(i).padStart(
                      2,
                      "0"
                    )}:00`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="end-time"
                  className="block text-sm font-medium text-gray-300"
                >
                  End Time
                </label>
                <select
                  id="end-time"
                  value={settings.timetable_end}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      timetable_end: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{`${String(i).padStart(
                      2,
                      "0"
                    )}:00`}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-gray-300">
                Show current time indicator
              </span>
              <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.show_time_needle ? "bg-blue-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.show_time_needle
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsModal;
