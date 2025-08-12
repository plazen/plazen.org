"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    const date = new Date(isoDate);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
  };

  const [newTime, setNewTime] = useState(formatForInput(task.scheduled_time));

  const handleSave = () => {
    if (newTime) {
      onSave(task.id, new Date(newTime).toISOString());
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium leading-6 text-white mb-2">
            Reschedule Task
          </h3>
          <p className="text-sm text-gray-400 mb-4 truncate">{task.title}</p>
          <div>
            <label
              htmlFor="task-time"
              className="block text-sm font-medium text-gray-300"
            >
              New scheduled time
            </label>
            <input
              type="datetime-local"
              id="task-time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RescheduleModal;
