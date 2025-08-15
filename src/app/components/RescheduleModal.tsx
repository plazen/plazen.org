"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

type Task = {
  id: string;
  title: string;
  scheduled_time: string | null;
};

type RescheduleModalProps = {
  task: Task;
  onClose: () => void;
  onSave: (taskId: string, newTime: string) => void;
};

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  task,
  onClose,
  onSave,
}) => {
  const formatForInput = (isoDate: string | null) => {
    if (!isoDate) return "";
    return isoDate.replace(/:([0-9]{2})(\.[0-9]+)?(Z)?$/, ":$1");
  };

  const [newTime, setNewTime] = useState(formatForInput(task.scheduled_time));

  const handleSave = () => {
    if (newTime) {
      onSave(task.id, newTime);
      console.log(`Task ${task.id} rescheduled to ${newTime}`);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-card rounded-lg shadow-xl p-6 w-full max-w-sm border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium leading-6 text-foreground mb-2">
            Reschedule Task
          </h3>
          <p className="text-sm text-muted-foreground mb-4 truncate">
            {task.title}
          </p>
          <div>
            <label
              htmlFor="task-time"
              className="block text-sm font-medium text-foreground"
            >
              New scheduled time
            </label>
            <input
              type="datetime-local"
              id="task-time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="mt-1 block w-full rounded-md bg-input border-border text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RescheduleModal;
