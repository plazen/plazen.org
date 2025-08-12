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
  onToggleDone: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onReschedule: (task: Task) => void;
};

const Timetable: React.FC<TimetableProps> = ({
  tasks,
  settings,
  onToggleDone,
  onDeleteTask,
  onReschedule,
}) => {
  const [menu, setMenu] = useState<{ x: number; y: number; task: Task | null }>(
    { x: 0, y: 0, task: null }
  );

  const handleContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setMenu({ x: e.pageX, y: e.pageY, task });
  };

  const closeMenu = () => setMenu({ ...menu, task: null });

  const { timetable_start: startHour, timetable_end: endHour } = settings;
  const totalHours =
    endHour > startHour ? endHour - startHour : 24 - startHour + endHour;

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

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff1a_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
      <h2 className="text-xl font-bold mb-6 text-white tracking-wider">
        Today&apos;s Schedule
      </h2>
      <div className="relative h-[800px] overflow-y-auto pr-2">
        <div className="absolute top-0 bottom-0 w-16 text-right pr-4 text-gray-400">
          {Array.from({ length: totalHours + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full"
              style={{ top: `${(i / totalHours) * 100}%` }}
            >
              <span className="text-xs font-mono -mt-2 inline-block">
                {String((startHour + i) % 24).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>
        <div className="absolute top-0 bottom-0 left-16 right-0">
          {Array.from({ length: totalHours }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-dashed border-white/10"
              style={{ top: `${((i + 1) / totalHours) * 100}%` }}
            />
          ))}
        </div>
        <div className="relative h-full ml-16">
          {settings.show_time_needle && (
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
            const baseColorRGB = event.is_time_sensitive
              ? "59, 130, 246"
              : "34, 197, 94";
            const gradientBg = `repeating-linear-gradient(0deg, rgba(${baseColorRGB}, 0.1), rgba(${baseColorRGB}, 0.1) 1px, transparent 1px, transparent 20px), linear-gradient(45deg, rgba(${baseColorRGB}, 0.3), rgba(${baseColorRGB}, 0.1))`;

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
                  x: isCompleted ? "100%" : "0%",
                  width: isCompleted ? "50%" : "100%",
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute p-2 flex flex-col justify-between text-white cursor-pointer rounded-lg backdrop-blur-sm"
                style={{
                  top: `${top}%`,
                  minHeight: "40px",
                  height: `${height}%`,
                  left: "0",
                  right: "0",
                  borderLeft: `3px solid rgb(${baseColorRGB})`,
                  background: gradientBg,
                }}
              >
                <p
                  className={`font-semibold text-sm truncate ${
                    isCompleted ? "line-through" : ""
                  }`}
                >
                  {event.title}
                </p>
                <p className="text-xs opacity-70 font-mono mt-auto">
                  {formatTime(event.startTime)} – {formatTime(endTime)}
                </p>
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
