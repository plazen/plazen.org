"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

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
};

const Timetable: React.FC<TimetableProps> = ({ tasks }) => {
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

  return (
    <div className="bg-gray-800/80 rounded-lg shadow-lg p-6 h-[500px] lg:h-auto lg:min-h-[600px] overflow-y-auto">
      <h2 className="text-lg font-medium mb-4">Today&apos;s Schedule</h2>
      <div className="relative h-[800px]">
        {/* Time Markers */}
        {Array.from({ length: totalHours + 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full flex items-center"
            style={{ top: `${(i / totalHours) * 100}%` }}
          >
            <span className="text-xs text-gray-400 -mt-2 pr-2">
              {String(timetableStartHour + i).padStart(2, "0")}:00
            </span>
            <div className="flex-grow border-t border-dashed border-gray-700 -mt-2"></div>
          </div>
        ))}

        {eventsToDisplay.map((event, index) => {
          const startHour =
            event.startTime.getHours() + event.startTime.getMinutes() / 60;
          const duration = (event.duration_minutes || 60) / 60;
          const top = ((startHour - timetableStartHour) / totalHours) * 100;
          const height = (duration / totalHours) * 100;
          const endTime = new Date(
            event.startTime.getTime() + (event.duration_minutes || 60) * 60000
          );

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="absolute left-16 right-0 rounded-lg p-2 text-white overflow-hidden"
              style={{
                top: `${top}%`,
                height: `${height}%`,
                backgroundColor: event.is_time_sensitive
                  ? "rgba(37, 99, 235, 0.5)"
                  : "rgba(22, 163, 74, 0.5)",
                borderLeft: `4px solid ${
                  event.is_time_sensitive ? "#3B82F6" : "#16A34A"
                }`,
              }}
            >
              <p className="font-bold text-sm truncate">{event.title}</p>
              <p className="text-xs opacity-80">
                {formatTime(event.startTime)} - {formatTime(endTime)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Timetable;
