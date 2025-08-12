"use client";

import React, { useState } from "react";

const PlazenLogo = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white"
  >
    <path
      d="M3 12C5.66667 8 7.33333 8 10 12C12.6667 16 14.3333 16 17 12C19.6667 8 21 8 21 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="10" r="1.5" fill="currentColor" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    <circle cx="18" cy="10" r="1.5" fill="currentColor" />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 text-gray-400"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

// Toggle Switch Component for "Time Sensitive"
const ToggleSwitch = ({ isToggled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      isToggled ? "bg-blue-600" : "bg-gray-600"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        isToggled ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

export default function Home() {
  // --- State Management ---

  // State for the list of tasks. Initialized with some placeholder data.
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Morning Stand-up Meeting",
      time: "09:00",
      isFlexible: false,
      done: true,
    },
    {
      id: 2,
      title: "Design new landing page mockups",
      time: "10:30",
      isFlexible: true,
      done: false,
    },
    {
      id: 3,
      title: "Lunch Break",
      time: "12:30",
      isFlexible: false,
      done: false,
    },
    {
      id: 4,
      title: "Review pull requests",
      time: "14:00",
      isFlexible: true,
      done: false,
    },
  ]);

  // State for the new task form inputs
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isFlexible, setIsFlexible] = useState(true);
  const [duration, setDuration] = useState("30");

  // --- Handlers ---

  // Handles form submission to add a new task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return; // Don't add empty tasks

    const newTask = {
      id: tasks.length + 1,
      title: newTaskTitle,
      // In a real app, the time would be calculated by your algorithm
      time: "15:45",
      isFlexible: isFlexible,
      done: false,
    };

    setTasks([...tasks, newTask]);
    // Reset form fields
    setNewTaskTitle("");
    setIsFlexible(true);
    setDuration("30");
  };

  // Toggles the 'done' status of a task
  const handleToggleDone = (taskId: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased">
      {/* --- Header --- */}
      <header className="border-b border-gray-700/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <PlazenLogo />
              <span className="text-xl font-semibold">Plazen</span>
            </div>
            <div className="flex items-center">
              <button className="rounded-full p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                <UserIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Left Column: Add Task Form --- */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/80 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-medium mb-4">Add a New Task</h2>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label
                    htmlFor="task-title"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Task Title
                  </label>
                  <input
                    type="text"
                    id="task-title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., Water the plants"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">
                    Time Sensitive?
                  </span>
                  <ToggleSwitch
                    isToggled={!isFlexible}
                    onToggle={() => setIsFlexible(!isFlexible)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="duration"
                    className="block text-sm font-medium text-gray-300"
                  >
                    {isFlexible
                      ? "Estimated Duration (minutes)"
                      : "Specific Time"}
                  </label>
                  <input
                    type="text"
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={isFlexible ? "e.g., 45" : "e.g., 14:30"}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800"
                >
                  Add to Schedule
                </button>
              </form>
            </div>
          </div>

          {/* --- Right Column: Today's Schedule --- */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/80 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-medium mb-4">
                Today&apos;s Schedule
              </h2>
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    onClick={() => handleToggleDone(task.id)}
                    className={`flex items-center justify-between p-4 rounded-md cursor-pointer transition-all duration-200 ${
                      task.done
                        ? "bg-gray-700/50 text-gray-500"
                        : "bg-gray-700 hover:bg-gray-600/80"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mr-4 ${
                          task.isFlexible ? "bg-green-400" : "bg-red-400"
                        }`}
                      ></div>
                      <div>
                        <p
                          className={`font-medium ${
                            task.done ? "line-through" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-400">{task.time}</p>
                      </div>
                    </div>
                    {/* Checkmark appears when done */}
                    {task.done && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6 text-green-400"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
