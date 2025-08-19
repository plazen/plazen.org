"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ContextMenu from "./ContextMenu";
import TimeNeedle from "./TimeNeedle";
import { Calendar, Trash2 } from "lucide-react";

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

type TimetableProps = {
  tasks: Task[];
  settings: Settings;
  date: Date;
  onToggleDone: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onReschedule: (task: Task) => void;
};

const Timetable: React.FC<TimetableProps> = ({
  tasks,
  settings,
  date,
  onToggleDone,
  onDeleteTask,
  onReschedule,
}) => {
  const [menu, setMenu] = useState<{ x: number; y: number; task: Task | null }>(
    { x: 0, y: 0, task: null }
  );
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const handleContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, task });
  };

  const handleTouchStart = (e: React.TouchEvent, task: Task) => {
    const timer = setTimeout(() => {
      const touch = e.touches[0];
      setMenu({ x: touch.clientX, y: touch.clientY, task });
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const closeMenu = () => setMenu({ ...menu, task: null });

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const { timetable_start: startHour, timetable_end: endHour } = settings;
  const totalHours = useMemo(() => {
    if (endHour > startHour) {
      return endHour - startHour;
    } else {
      return 24 - startHour + endHour;
    }
  }, [startHour, endHour]);

  const eventsToDisplay = useMemo(() => {
    function parseLocal(dateString: string) {
      console.log("Received date:", dateString);
      const clean = dateString.replace(/Z$/, "");
      const noMs = clean.replace(/\.\d{3}$/, "");
      // Parse as local time by splitting the ISO string and return object with Date-like methods
      const [datePart, timePart] = noMs.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second = 0] = timePart.split(":").map(Number);

      // Create a Date-like object that uses the raw local time values without Date objects
      const localTime = {
        getHours: () => hour,
        getMinutes: () => minute,
        getTime: () => {
          return (
            ((year - 1970) * 365.25 * 24 * 60 * 60 +
              (month - 1) * 30.44 * 24 * 60 * 60 +
              (day - 1) * 24 * 60 * 60 +
              hour * 60 * 60 +
              minute * 60 +
              second) *
            1000
          );
        },
        // Add toLocaleTimeString for formatTime compatibility
        toLocaleTimeString: () => {
          const paddedHour = String(hour).padStart(2, "0");
          const paddedMinute = String(minute).padStart(2, "0");
          return `${paddedHour}:${paddedMinute}`;
        },
      };
      return localTime as Date; // Type assertion for compatibility
    }
    return tasks
      .filter((t) => t.scheduled_time)
      .map((t) => ({ ...t, startTime: parseLocal(t.scheduled_time!) }));
  }, [tasks]);

  const menuOptions = menu.task
    ? [
        {
          label: "Reschedule",
          onClick: () => onReschedule(menu.task!),
          icon: <Calendar className="w-4 h-4" />,
        },
        {
          label: "Delete",
          onClick: () => onDeleteTask(menu.task!.id),
          variant: "destructive" as const,
          icon: <Trash2 className="w-4 h-4" />,
        },
      ]
    : [];

  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="bg-card rounded-xl shadow-2xl p-6 relative overflow-hidden border border-border">
      <div className="absolute inset-0 bg-[radial-gradient(theme(colors.foreground)_/_0.5,transparent_0.5px)] [background-size:16px_16px] opacity-5"></div>
      <div className="relative h-[800px] overflow-y-auto pr-2 pt-2">
        <div className="absolute top-2 bottom-0 w-16 text-right text-muted-foreground">
          {Array.from({ length: totalHours + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full flex items-center justify-end pr-6"
              style={{
                top: `${(i / totalHours) * 100}%`,
                transform: "translateY(-50%)",
                minHeight: "20px",
              }}
            >
              <span className="text-xs font-mono inline-block leading-none">
                {String((startHour + i) % 24).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>
        <div className="absolute top-2 bottom-0 left-12 right-0">
          {Array.from({ length: totalHours + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-dashed border-border"
              style={{ top: `${(i / totalHours) * 100}%` }}
            />
          ))}
        </div>
        <div className="relative h-full ml-16">
          {settings.show_time_needle && isToday && (
            <TimeNeedle startHour={startHour} endHour={endHour} />
          )}
          {eventsToDisplay.map((event) => {
            const currentStartHour =
              event.startTime.getHours() + event.startTime.getMinutes() / 60;
            const duration = event.duration_minutes || 60;

            // Simple positioning: calculate offset from timetable start
            const hoursFromStart = currentStartHour - startHour;
            const top = (hoursFromStart / totalHours) * 100;

            const height = (duration / 60 / totalHours) * 100;
            const endTime = {
              toLocaleTimeString: () => {
                const endMinutes = event.startTime.getMinutes() + duration;
                const endHour =
                  event.startTime.getHours() + Math.floor(endMinutes / 60);
                const finalMinute = endMinutes % 60;
                const paddedHour = String(endHour % 24).padStart(2, "0");
                const paddedMinute = String(finalMinute).padStart(2, "0");
                return `${paddedHour}:${paddedMinute}`;
              },
            };
            const isCompleted = event.is_completed;
            const baseColor = event.is_time_sensitive
              ? "hsl(var(--primary))"
              : "hsl(var(--secondary-foreground))";

            const gradientBg = event.is_time_sensitive
              ? `linear-gradient(45deg, oklch(0.7 0.1 190 / 0.1), oklch(0.7 0.1 190 / 0.2))`
              : `linear-gradient(45deg, oklch(0.95 0.01 240 / 0.05), oklch(0.95 0.01 240 / 0.1))`;

            if (top < 0 || top > 100) return null;

            return (
              <motion.div
                key={event.id}
                layout
                onClick={() => onToggleDone(event.id, isCompleted)}
                onContextMenu={(e) => handleContextMenu(e, event)}
                onTouchStart={(e) => handleTouchStart(e, event)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isCompleted ? 0.5 : 1,
                  y: 0,
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute p-2 flex flex-col text-foreground cursor-pointer rounded-lg backdrop-blur-sm border border-border overflow-hidden ${
                  duration < 60 ? "justify-center" : "justify-start"
                }`}
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  left: "0",
                  right: "0",
                  borderLeft: `3px solid ${baseColor}`,
                  background: gradientBg,
                }}
              >
                <div>
                  <p
                    className={`font-semibold ${
                      isCompleted ? "line-through" : ""
                    } ${
                      duration >= 60
                        ? "text-sm"
                        : duration >= 30
                        ? "text-[10px] leading-tight" // 30m: smaller font
                        : "text-[8px] leading-tight" // 15m: even smaller font
                    } truncate`}
                    style={{
                      fontSize:
                        duration >= 60
                          ? undefined
                          : duration >= 30
                          ? `min(0.75rem, max(0.55rem, calc(1.1rem - 0.03rem * ${event.title.length})))`
                          : `min(0.65rem, max(0.45rem, calc(0.9rem - 0.035rem * ${event.title.length})))`,
                      lineHeight: duration < 60 ? 1.1 : undefined,
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                    }}
                  >
                    {event.title}
                    {duration >= 60 && (
                      <span className="opacity-70 font-mono ml-2 text-xs">
                        {event.startTime.toLocaleTimeString()} –{" "}
                        {endTime.toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>

                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {menu.task && (
          <ContextMenu
            x={menu.x}
            y={menu.y}
            options={menuOptions}
            onClose={closeMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Timetable;
