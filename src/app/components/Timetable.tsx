"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ContextMenu from "./ContextMenu";

type Task = {
  id: string;
  title: string;
  is_time_sensitive: boolean;
  duration_minutes: number | null;
  scheduled_time: string | null;
  is_completed: boolean;
};

type TimetableProps = {
  tasks: Task[];
  onToggleDone: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onReschedule: (task: Task) => void;
};

const Timetable: React.FC<TimetableProps> = ({
  tasks,
  onToggleDone,
  onDeleteTask,
  onReschedule,
}) => {
  const [menu, setMenu] = useState<{ x: number; y: number; task: Task | null }>(
    {
      x: 0,
      y: 0,
      task: null,
    }
  );

  const handleContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setMenu({ x: e.pageX, y: e.pageY, task });
  };

  const closeMenu = () => {
    setMenu({ ...menu, task: null });
  };

  const timetableStartHour = 8;
  const timetableEndHour = 18;
  const totalHours = timetableEndHour - timetableStartHour;

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const eventsToDisplay = useMemo(() => {
    return tasks
      .filter((t) => t.scheduled_time)
      .map((t) => ({
        ...t,
        startTime: new Date(t.scheduled_time!),
      }));
  }, [tasks]);

  const menuOptions = menu.task
    ? [
        { label: "Delete", onClick: () => onDeleteTask(menu.task!.id) },
        { label: "Reschedule", onClick: () => onReschedule(menu.task!) },
      ]
    : [];

  return (
    <div className="bg-gray-800/80 rounded-lg shadow-lg p-6 h-[500px] lg:h-auto lg:min-h-[600px] overflow-y-auto">
      <h2 className="text-lg font-medium mb-4">Today&apos;s Schedule</h2>
      <div className="relative h-[800px]">
        <div className="absolute top-0 bottom-0 -ml-16 w-16 text-right pr-4 text-gray-400">
          {Array.from({ length: totalHours + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full"
              style={{ top: `${(i / totalHours) * 100}%` }}
            >
              <span className="text-xs -mt-2 inline-block">
                {String(timetableStartHour + i).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        <div className="absolute top-0 bottom-0 left-0 right-0">
          {Array.from({ length: totalHours }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-dashed border-gray-700"
              style={{ top: `${((i + 1) / totalHours) * 100}%` }}
            />
          ))}
        </div>

        <div className="relative h-full">
          {eventsToDisplay.map((event, index) => {
            const startHour =
              event.startTime.getHours() + event.startTime.getMinutes() / 60;
            const duration = (event.duration_minutes || 60) / 60;
            const top = ((startHour - timetableStartHour) / totalHours) * 100;
            const height = (duration / totalHours) * 100;
            const endTime = new Date(
              event.startTime.getTime() + (event.duration_minutes || 60) * 60000
            );
            const isCompleted = event.is_completed;

            return (
              <motion.div
                key={event.id}
                layout
                onClick={() => onToggleDone(event.id, isCompleted)}
                onContextMenu={(e) => handleContextMenu(e, event)}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isCompleted ? 0.6 : 1,
                  y: 0,
                  x: isCompleted ? "100%" : "0%",
                  width: isCompleted ? "50%" : "100%",
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute p-2 text-white overflow-hidden cursor-pointer rounded-lg"
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  left: "0",
                  right: "0",
                  backgroundColor: event.is_time_sensitive
                    ? "rgba(37, 99, 235, 0.5)"
                    : "rgba(22, 163, 74, 0.5)",
                  borderLeft: `4px solid ${
                    event.is_time_sensitive ? "#3B82F6" : "#16A34A"
                  }`,
                }}
              >
                <p
                  className={`font-bold text-sm truncate ${
                    isCompleted ? "line-through" : ""
                  }`}
                >
                  {event.title}
                </p>
                <p className="text-xs opacity-80">
                  {formatTime(event.startTime)} - {formatTime(endTime)}
                </p>
                {isCompleted && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute top-1/2 right-2 -translate-y-1/2 text-white"
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
