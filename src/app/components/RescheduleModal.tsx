"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";

type Task = {
  id: string;
  title: string;
  scheduled_time: string | null;
};

type RescheduleModalProps = {
  task: Task;
  onClose: () => void;
  onSave: (taskId: string, newTime: string, newTitle?: string) => void;
};

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  task,
  onClose,
  onSave,
}) => {
  // Parse ISO string to Date and time
  const parseDateTime = (iso: string | null) => {
    if (!iso) return { date: undefined, hour: 12, minute: 0 };

    // Parse the "fake ISO" string manually to avoid timezone conversion
    const clean = iso.replace(/Z$/, "");
    const noMs = clean.replace(/\.\d{3}$/, "");
    const [datePart, timePart] = noMs.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    return {
      date: new Date(year, month - 1, day), // Create local date without timezone conversion
      hour: hour,
      minute: minute,
    };
  };

  const initial = parseDateTime(task.scheduled_time);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initial.date
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarBtnRef = useRef<HTMLButtonElement>(null);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!calendarOpen) return;
    function handle(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key === "Escape")
        setCalendarOpen(false);
      if (
        e instanceof MouseEvent &&
        calendarDropdownRef.current &&
        !calendarDropdownRef.current.contains(e.target as Node) &&
        calendarBtnRef.current &&
        !calendarBtnRef.current.contains(e.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [calendarOpen]);
  const [selectedHour, setSelectedHour] = useState<number>(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initial.minute);
  const [newTitle, setNewTitle] = useState(task.title);

  // Combine date, hour, minute to ISO string for saving
  const getCombinedISO = () => {
    if (!selectedDate) return "";
    const d = new Date(selectedDate);
    d.setHours(selectedHour, selectedMinute, 0, 0);

    // Format as "fake ISO" to prevent timezone conversion
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hour = String(d.getHours()).padStart(2, "0");
    const minute = String(d.getMinutes()).padStart(2, "0");
    const second = String(d.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  };

  const handleSave = () => {
    const iso = getCombinedISO();
    if (iso && newTitle.trim()) {
      onSave(task.id, iso, newTitle.trim());
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                <path d="m15 5 4 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-card-foreground">
                Edit Task
              </h3>
              <p className="text-sm text-muted-foreground">
                Update your task details and schedule
              </p>
            </div>
          </div>
          {/* Task name input */}
          <div className="space-y-2 mb-6">
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-card-foreground"
            >
              Task name
            </label>
            <input
              id="task-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring/20 px-4 py-3 text-base transition-all duration-200 outline-none"
              placeholder="Enter task name"
              maxLength={100}
              autoFocus
            />
          </div>

          {/* Date and time section */}
          <div className="space-y-4 mb-8">
            <label className="block text-sm font-medium text-card-foreground">
              Scheduled time
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date picker */}
              <div className="relative">
                <button
                  ref={calendarBtnRef}
                  type="button"
                  onClick={() => setCalendarOpen((v) => !v)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-input border border-border text-card-foreground hover:bg-accent hover:border-ring transition-all duration-200 shadow-sm"
                  aria-haspopup="dialog"
                  aria-expanded={calendarOpen}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                    className="text-muted-foreground"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="4" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span className="flex-1 text-left">
                    {selectedDate
                      ? selectedDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      : "Select date"}
                  </span>
                </button>
                {calendarOpen && (
                  <div
                    ref={calendarDropdownRef}
                    className="absolute left-0 mt-2 z-50 bg-popover border border-border rounded-xl shadow-2xl p-4"
                    style={{ minWidth: 280 }}
                  >
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setCalendarOpen(false);
                      }}
                      className="bg-transparent"
                      classNames={{
                        root: "w-fit",
                        month: "bg-transparent",
                        day: "",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Time picker */}
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                    className="w-full rounded-xl bg-input border border-border text-card-foreground px-3 py-3 focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200 outline-none"
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>
                        {h.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-muted-foreground font-medium text-lg">
                  :
                </div>
                <div className="flex-1">
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(Number(e.target.value))}
                    className="w-full rounded-xl bg-input border border-border text-card-foreground px-3 py-3 focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all duration-200 outline-none"
                  >
                    {Array.from({ length: 60 }, (_, m) => m)
                      .filter((m) => m % 5 === 0)
                      .map((m) => (
                        <option key={m} value={m}>
                          {m.toString().padStart(2, "0")}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={onClose} className="px-6 py-2.5">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="px-6 py-2.5 shadow-sm"
              disabled={!selectedDate || !newTitle.trim()}
            >
              Save Changes
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RescheduleModal;
