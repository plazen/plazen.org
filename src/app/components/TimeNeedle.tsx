"use client";

import React, { useState, useEffect } from "react";

type TimeNeedleProps = {
  startHour: number;
  endHour: number;
};

const TimeNeedle: React.FC<TimeNeedleProps> = ({ startHour, endHour }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const calculateTopPosition = () => {
    const now = currentTime;
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const totalHours = endHour - startHour;

    if (currentHour < startHour || currentHour > endHour) {
      return -1; // Hide if outside timetable hours
    }

    const percentage = ((currentHour - startHour) / totalHours) * 100;
    return percentage;
  };

  const topPosition = calculateTopPosition();

  if (topPosition === -1) {
    return null;
  }

  return (
    <div
      className="absolute left-0 right-0 z-20"
      style={{ top: `${topPosition}%` }}
    >
      <div className="flex items-center">
        <div className="w-16 text-right pr-2">
          <span className="text-xs font-medium text-red-400">
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        </div>
        <div className="relative flex-grow h-px bg-red-400">
          <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-400"></div>
        </div>
      </div>
    </div>
  );
};

export default TimeNeedle;
