"use client";

import React from "react";
import { motion } from "framer-motion";

interface TimetableSkeletonProps {
  startHour: number;
  endHour: number;
}

const TimetableSkeleton: React.FC<TimetableSkeletonProps> = ({
  startHour,
  endHour,
}) => {
  const totalHours = endHour > startHour ? endHour - startHour : 24 - startHour + endHour;

  // Generate some mock task positions for skeleton loading
  const mockTasks = [
    { top: 15, height: 8, width: 85 },
    { top: 35, height: 12, width: 70 },
    { top: 55, height: 6, width: 90 },
    { top: 75, height: 10, width: 65 },
  ];

  return (
    <div className="bg-card rounded-xl shadow-2xl p-6 relative overflow-hidden border border-border">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(theme(colors.foreground)_/_0.5,transparent_0.5px)] [background-size:16px_16px] opacity-5"></div>
      
      {/* Date skeleton */}
      <motion.div
        className="h-6 bg-muted rounded mb-6"
        style={{ width: "60%" }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <div className="relative h-[800px] overflow-y-auto pr-2">
        {/* Time labels skeleton */}
        <div className="absolute top-0 bottom-0 w-16 text-right">
          {Array.from({ length: totalHours + 1 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-12 h-3 bg-muted rounded"
              style={{ top: `${(i / totalHours) * 100}%` }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Hour lines */}
        <div className="absolute top-0 bottom-0 left-20 right-0">
          {Array.from({ length: totalHours + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-dashed border-border/30 mt-3"
              style={{ top: `${(i / totalHours) * 100}%` }}
            />
          ))}
        </div>

        {/* Mock task skeletons */}
        <div className="relative h-full ml-16">
          {mockTasks.map((task, index) => (
            <motion.div
              key={index}
              className="absolute bg-muted rounded-lg border border-border/50"
              style={{
                top: `${task.top}%`,
                height: `${task.height}%`,
                width: `${task.width}%`,
                left: "0",
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3,
                ease: "easeInOut",
              }}
            >
              {/* Task title skeleton */}
              <div className="p-2">
                <motion.div
                  className="h-3 bg-muted-foreground/20 rounded mb-1"
                  style={{ width: "80%" }}
                  animate={{
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut",
                  }}
                />
                {task.height > 8 && (
                  <motion.div
                    className="h-2 bg-muted-foreground/15 rounded"
                    style={{ width: "60%" }}
                    animate={{
                      opacity: [0.15, 0.4, 0.15],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      delay: index * 0.25,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Loading overlay */}
      <motion.div
        className="absolute inset-0 bg-card/60 backdrop-blur-sm flex items-center justify-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="w-8 h-8 border-2 border-muted border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.p
            className="text-sm text-muted-foreground font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Loading your schedule...
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default TimetableSkeleton;
