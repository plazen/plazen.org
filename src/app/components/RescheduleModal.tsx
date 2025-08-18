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
    const d = new Date(iso);
    return {
      date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      hour: d.getHours(),
      minute: d.getMinutes(),
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
      console.log(
        `Task ${
          task.id
        } renamed to '${newTitle.trim()}' and rescheduled to ${iso}`
      );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/80 backdrop-blur-[6px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="relative rounded-2xl shadow-2xl p-8 w-full max-w-md border border-border backdrop-blur-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(30,32,40,0.92) 60%, rgba(40,44,60,0.88) 100%)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
            border: "1.5px solid rgba(80,80,100,0.25)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold shadow-sm">
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="4" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold leading-7 text-foreground">
              Reschedule Task
            </h3>
          </div>
          {/* Rename input */}
          <div className="mb-5">
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-foreground mb-1 px-1"
            >
              Task name
            </label>
            <input
              id="task-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-zinc-900/80 dark:bg-zinc-800/80 border border-zinc-700 text-foreground placeholder:text-zinc-500 shadow-inner focus:border-primary focus:ring-2 focus:ring-primary/30 px-3 py-2 text-base transition-all duration-150"
              placeholder="Enter new task name"
              maxLength={100}
              autoFocus
            />
          </div>
          {/* Date/time input with 'Now' button */}
          <div className="mb-6 flex flex-col gap-2">
            <label className="block text-sm font-medium text-foreground mb-1 px-1">
              New scheduled time
            </label>
            <div className="flex gap-4 items-center">
              {/* Date picker button */}
              <div className="relative">
                <button
                  ref={calendarBtnRef}
                  type="button"
                  onClick={() => setCalendarOpen((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 dark:bg-zinc-800/80 border border-zinc-700 text-foreground font-medium shadow hover:bg-primary/80 hover:text-white transition-all"
                  aria-haspopup="dialog"
                  aria-expanded={calendarOpen}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="4" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {selectedDate
                    ? selectedDate.toLocaleDateString()
                    : "Pick date"}
                </button>
                {calendarOpen && (
                  <div
                    ref={calendarDropdownRef}
                    className="absolute left-0 mt-2 z-50 bg-zinc-900/95 dark:bg-zinc-800/95 border border-zinc-700 rounded-xl shadow-2xl p-4"
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
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                    className="rounded-lg bg-zinc-900/80 dark:bg-zinc-800/80 border border-zinc-700 text-foreground px-2 py-1 focus:border-primary focus:ring-2 focus:ring-primary/30"
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>
                        {h.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <span className="text-foreground font-semibold">:</span>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(Number(e.target.value))}
                    className="rounded-lg bg-zinc-900/80 dark:bg-zinc-800/80 border border-zinc-700 text-foreground px-2 py-1 focus:border-primary focus:ring-2 focus:ring-primary/30"
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
          <div className="flex justify-end gap-3 mt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg font-semibold shadow-sm"
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
