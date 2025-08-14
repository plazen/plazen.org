"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ContextMenu from "./ContextMenu";
import TimeNeedle from "./TimeNeedle";

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
  tasksLoading: boolean;
  onToggleDone: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onReschedule: (task: Task) => void;
};

const Timetable: React.FC<TimetableProps> = ({
  tasks,
  settings,
  date,
  tasksLoading,
  onToggleDone,
  onDeleteTask,
  onReschedule,
}) => {
  const [menu, setMenu] = useState<{ x: number; y: number; task: Task | null }>(
    { x: 0, y: 0, task: null }
  );

  const handleContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, task });
  };

  const closeMenu = () => setMenu({ ...menu, task: null });

  const { timetable_start: startHour, timetable_end: endHour } = settings;
  const totalHours = useMemo(() => {
    if (endHour > startHour) {
      return endHour - startHour;
    } else {
      return 24 - startHour + endHour;
    }
  }, [startHour, endHour]);

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const eventsToDisplay = useMemo(() => {
    return tasks
      .filter((t) => t.scheduled_time)
      .map((t) => ({ ...t, startTime: new Date(t.scheduled_time!) }));
  }, [tasks]);

  const menuOptions = menu.task
    ? [
        { label: "Delete", onClick: () => onDeleteTask(menu.task!.id) },
        { label: "Reschedule", onClick: () => onReschedule(menu.task!) },
      ]
    : [];

  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="bg-card rounded-xl shadow-2xl p-6 relative overflow-hidden border border-border">
      {tasksLoading && (
        <div className="absolute inset-0 bg-card bg-opacity-50 flex items-center justify-center z-30">
          <p className="text-foreground">Loading...</p>
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(theme(colors.foreground)_/_0.5,transparent_0.5px)] [background-size:16px_16px] opacity-5"></div>
      <h2 className="text-xl font-bold mb-6 text-foreground tracking-wider">
        {formattedDate}
      </h2>
      <div className="relative h-[800px] overflow-y-auto pr-2">
        <div className="absolute top-0 bottom-0 w-16 text-right text-muted-foreground">
          {Array.from({ length: totalHours + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full"
              style={{ top: `${(i / totalHours) * 100}%` }}
            >
              <span className="text-xs font-mono inline-block">
                {String((startHour + i) % 24).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>
        <div className="absolute top-0 bottom-0 left-20 right-0">
          {Array.from({ length: totalHours + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-dashed border-border mt-3"
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
            const duration = (event.duration_minutes || 60) / 60;
            const top = ((currentStartHour - startHour) / totalHours) * 100;
            const height = (duration / totalHours) * 100;
            const endTime = new Date(
              event.startTime.getTime() + (event.duration_minutes || 60) * 60000
            );
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
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isCompleted ? 0.5 : 1,
                  y: 0,
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute p-2 flex flex-col justify-between text-foreground cursor-pointer rounded-lg backdrop-blur-sm border border-border"
                style={{
                  top: `${top}%`,
                  minHeight: "40px",
                  height: `${height}%`,
                  left: "0",
                  right: "0",
                  borderLeft: `3px solid ${baseColor}`,
                  background: gradientBg,
                }}
              >
                <div>
                  <p
                    className={`font-semibold text-sm ${
                      isCompleted ? "line-through" : ""
                    }`}
                  >
                    {event.title} &nbsp;
                    <span className="text-xs opacity-70 font-mono">
                      {formatTime(event.startTime)} – {formatTime(endTime)}
                    </span>
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
