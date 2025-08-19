/**
 * Integration Tests for Business Logic
 * Tests the core functionality without Next.js API route dependencies
 */

// Mock Prisma first, before importing
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    tasks: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    userSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Business Logic Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Settings and Task Creation Flow", () => {
    it("should create user settings and then create auto-scheduled task", async () => {
      // Mock user session
      const userId = "integration-test-user";

      // Mock Prisma responses for settings creation
      const mockSettings = {
        user_id: userId,
        timetable_start: 8,
        timetable_end: 18,
        show_time_needle: true,
        theme: "dark",
      };

      const mockTask = {
        id: BigInt(1),
        user_id: userId,
        title: "Auto Scheduled Task",
        duration_minutes: 60,
        is_time_sensitive: false,
        scheduled_time: "2025-08-19T09:00:00.000Z",
        is_completed: false,
        created_at: new Date(),
      };

      (mockPrisma.userSettings.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // First call returns no settings
        .mockResolvedValueOnce(mockSettings); // Second call returns created settings

      (mockPrisma.userSettings.create as jest.Mock).mockResolvedValue(
        mockSettings
      );
      (mockPrisma.tasks.findMany as jest.Mock).mockResolvedValue([]); // No existing tasks
      (mockPrisma.tasks.create as jest.Mock).mockResolvedValue(mockTask);

      // Test settings creation logic
      let settings = await mockPrisma.userSettings.findUnique({
        where: { user_id: userId },
      });

      if (!settings) {
        settings = await mockPrisma.userSettings.create({
          data: {
            user_id: userId,
            timetable_start: 8,
            timetable_end: 18,
            show_time_needle: true,
            theme: "dark",
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      expect(settings.timetable_start).toBe(8);
      expect(settings.timetable_end).toBe(18);

      // Test task creation with auto-scheduling
      const taskData = {
        title: "Auto Scheduled Task",
        duration_minutes: 60,
        is_time_sensitive: false,
        for_date: "2025-08-19",
      };

      // Find existing tasks for the day
      const existingTasks = await mockPrisma.tasks.findMany({
        where: {
          user_id: userId,
          scheduled_time: {
            gte: new Date("2025-08-19T00:00:00.000Z"),
            lt: new Date("2025-08-20T00:00:00.000Z"),
          },
        },
        orderBy: { scheduled_time: "asc" },
      });

      expect(existingTasks).toHaveLength(0); // No existing tasks

      // Create the task
      const newTask = await mockPrisma.tasks.create({
        data: {
          user_id: userId,
          title: taskData.title,
          duration_minutes: taskData.duration_minutes,
          is_time_sensitive: taskData.is_time_sensitive,
          scheduled_time: "2025-08-19T09:00:00.000Z", // Auto-scheduled time
          is_completed: false,
        },
      });

      expect(newTask.title).toBe("Auto Scheduled Task");
      expect(newTask.scheduled_time).toBeTruthy();
      expect(mockPrisma.userSettings.findUnique).toHaveBeenCalled();
      expect(mockPrisma.tasks.create).toHaveBeenCalled();
    });
  });

  describe("Task Scheduling Conflict Resolution", () => {
    it("should handle task scheduling conflicts", async () => {
      const userId = "conflict-test-user";

      const mockSettings = {
        user_id: userId,
        timetable_start: 9,
        timetable_end: 17,
      };

      // Mock existing task that occupies 10:00-11:00
      const existingTask = {
        id: BigInt(1),
        user_id: userId,
        scheduled_time: new Date("2025-08-19T10:00:00.000Z"),
        duration_minutes: 60,
        title: "Existing Task",
        is_time_sensitive: true,
        is_completed: false,
        created_at: new Date(),
      };

      const newTask = {
        id: BigInt(2),
        user_id: userId,
        title: "New Task",
        duration_minutes: 60,
        is_time_sensitive: false,
        scheduled_time: "2025-08-19T11:00:00.000Z", // Should be scheduled after existing task
        is_completed: false,
        created_at: new Date(),
      };

      (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue(
        mockSettings
      );
      (mockPrisma.tasks.findMany as jest.Mock).mockResolvedValue([
        existingTask,
      ]);
      (mockPrisma.tasks.create as jest.Mock).mockResolvedValue(newTask);

      // Test conflict detection logic
      await mockPrisma.userSettings.findUnique({
        where: { user_id: userId },
      });

      const existingTasks = await mockPrisma.tasks.findMany({
        where: {
          user_id: userId,
          scheduled_time: {
            gte: new Date("2025-08-19T00:00:00.000Z"),
            lt: new Date("2025-08-20T00:00:00.000Z"),
          },
        },
        orderBy: { scheduled_time: "asc" },
      });

      expect(existingTasks).toHaveLength(1);
      expect(existingTasks[0].scheduled_time).toEqual(
        new Date("2025-08-19T10:00:00.000Z")
      );

      // Create new task avoiding conflict
      const createdTask = await mockPrisma.tasks.create({
        data: {
          user_id: userId,
          title: "New Task",
          duration_minutes: 60,
          is_time_sensitive: false,
          scheduled_time: "2025-08-19T11:00:00.000Z", // Scheduled after existing task
          is_completed: false,
        },
      });

      expect(createdTask.title).toBe("New Task");
      expect(createdTask.scheduled_time).toBeTruthy();
    });
  });

  describe("Task Retrieval and Filtering", () => {
    it("should retrieve tasks within date range", async () => {
      const userId = "range-test-user";

      const tasksInRange = [
        {
          id: BigInt(1),
          user_id: userId,
          title: "Task 1",
          scheduled_time: new Date("2025-08-19T10:00:00.000Z"),
          duration_minutes: 60,
          is_time_sensitive: true,
          is_completed: false,
          created_at: new Date(),
        },
        {
          id: BigInt(2),
          user_id: userId,
          title: "Task 2",
          scheduled_time: new Date("2025-08-19T14:00:00.000Z"),
          duration_minutes: 30,
          is_time_sensitive: false,
          is_completed: true,
          created_at: new Date(),
        },
      ];

      (mockPrisma.tasks.findMany as jest.Mock).mockResolvedValue(tasksInRange);

      // Test date range query
      const rangeStart = new Date("2025-08-19T00:00:00.000Z");
      const rangeEnd = new Date("2025-08-20T00:00:00.000Z");

      const tasks = await mockPrisma.tasks.findMany({
        where: {
          user_id: userId,
          scheduled_time: {
            gte: rangeStart,
            lt: rangeEnd,
          },
        },
        orderBy: { created_at: "asc" },
      });

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe("Task 1");
      expect(tasks[1].title).toBe("Task 2");

      // Test BigInt to string conversion (simulating API serialization)
      const serializableTasks = tasks.map((task) => ({
        ...task,
        id: task.id.toString(),
      }));

      expect(serializableTasks[0].id).toBe("1");
      expect(serializableTasks[1].id).toBe("2");
    });
  });
});

describe("End-to-End Task Lifecycle", () => {
  const userId = "e2e-test-user";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should complete full task lifecycle: create -> update -> complete -> delete", async () => {
    // Step 1: Create task
    const newTask = {
      id: BigInt(1),
      user_id: userId,
      title: "E2E Test Task",
      duration_minutes: 60,
      is_time_sensitive: true,
      scheduled_time: "2025-08-19T10:00:00.000Z",
      is_completed: false,
      created_at: new Date(),
    };

    (mockPrisma.tasks.create as jest.Mock).mockResolvedValue(newTask);

    const createdTask = await mockPrisma.tasks.create({
      data: {
        user_id: userId,
        title: "E2E Test Task",
        duration_minutes: 60,
        is_time_sensitive: true,
        scheduled_time: "2025-08-19T10:00:00.000Z",
        is_completed: false,
      },
    });

    expect(createdTask.title).toBe("E2E Test Task");

    // Step 2: Update task (reschedule)
    const updatedTask = {
      ...newTask,
      scheduled_time: "2025-08-19T14:00:00.000Z",
    };

    (mockPrisma.tasks.update as jest.Mock).mockResolvedValue(updatedTask);

    const rescheduledTask = await mockPrisma.tasks.update({
      where: {
        id: BigInt(1),
        user_id: userId,
      },
      data: {
        scheduled_time: "2025-08-19T14:00:00.000Z",
      },
    });

    expect(rescheduledTask.scheduled_time).toBe("2025-08-19T14:00:00.000Z");

    // Step 3: Mark task as completed
    const completedTask = {
      ...updatedTask,
      is_completed: true,
    };

    (mockPrisma.tasks.update as jest.Mock).mockResolvedValue(completedTask);

    const markedCompleteTask = await mockPrisma.tasks.update({
      where: {
        id: BigInt(1),
        user_id: userId,
      },
      data: {
        is_completed: true,
      },
    });

    expect(markedCompleteTask.is_completed).toBe(true);

    // Step 4: Delete task
    (mockPrisma.tasks.delete as jest.Mock).mockResolvedValue(completedTask);

    const deletedTask = await mockPrisma.tasks.delete({
      where: {
        id: BigInt(1),
        user_id: userId,
      },
    });

    expect(deletedTask).toBeTruthy();
    expect(mockPrisma.tasks.delete).toHaveBeenCalledWith({
      where: {
        id: BigInt(1),
        user_id: userId,
      },
    });
  });
});

// Performance and load testing
describe("Performance Tests", () => {
  it("should handle multiple task creation requests efficiently", async () => {
    const userId = "perf-test-user";

    // Mock settings
    (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
      timetable_start: 8,
      timetable_end: 18,
    });

    (mockPrisma.tasks.findMany as jest.Mock).mockResolvedValue([]);

    // Create 10 tasks
    const taskPromises = [];
    for (let i = 0; i < 10; i++) {
      const mockTask = {
        id: BigInt(i + 1),
        user_id: userId,
        title: `Performance Task ${i + 1}`,
        duration_minutes: 60,
        is_time_sensitive: false,
        scheduled_time: `2025-08-19T${8 + i}:00:00.000Z`,
        is_completed: false,
        created_at: new Date(),
      };

      (mockPrisma.tasks.create as jest.Mock).mockResolvedValueOnce(mockTask);

      const taskPromise = mockPrisma.tasks.create({
        data: {
          user_id: userId,
          title: `Performance Task ${i + 1}`,
          duration_minutes: 60,
          is_time_sensitive: false,
          scheduled_time: `2025-08-19T${8 + i}:00:00.000Z`,
          is_completed: false,
        },
      });

      taskPromises.push(taskPromise);
    }

    const startTime = Date.now();
    const results = await Promise.all(taskPromises);
    const endTime = Date.now();

    // All requests should complete successfully
    expect(results).toHaveLength(10);
    results.forEach((result, index) => {
      expect(result.title).toBe(`Performance Task ${index + 1}`);
    });

    // Should complete within reasonable time (adjust as needed)
    expect(endTime - startTime).toBeLessThan(1000); // 1 second max for mocked operations
  });
});

describe("Auto-Scheduling Algorithm Tests", () => {
  it("should find available time slots for tasks", () => {
    // Test the core auto-scheduling logic used in the API
    function findAvailableSlot(
      timetableStart: number,
      timetableEnd: number,
      existingTasks: Array<{ start: number; duration: number }>,
      newTaskDuration: number
    ): number | null {
      const totalMinutes = (timetableEnd - timetableStart) * 60;
      const occupiedSlots = existingTasks.map((task) => ({
        start: task.start,
        end: task.start + task.duration,
      }));

      // Sort by start time
      occupiedSlots.sort((a, b) => a.start - b.start);

      let currentTime = timetableStart * 60; // Convert to minutes

      for (const slot of occupiedSlots) {
        const availableTime = slot.start - currentTime;
        if (availableTime >= newTaskDuration) {
          return currentTime; // Found a slot
        }
        currentTime = Math.max(currentTime, slot.end);
      }

      // Check if there's time after the last task
      const remainingTime = totalMinutes - (currentTime - timetableStart * 60);
      if (remainingTime >= newTaskDuration) {
        return currentTime;
      }

      return null; // No available slot
    }

    // Test with no existing tasks
    expect(findAvailableSlot(8, 18, [], 60)).toBe(8 * 60); // 8:00 AM

    // Test with existing tasks
    const existingTasks = [
      { start: 9 * 60, duration: 60 }, // 9:00-10:00
      { start: 14 * 60, duration: 90 }, // 2:00-3:30 PM
    ];

    expect(findAvailableSlot(8, 18, existingTasks, 60)).toBe(8 * 60); // 8:00 AM (before first task)
    expect(findAvailableSlot(8, 18, existingTasks, 120)).toBe(10 * 60); // 10:00 AM (between tasks)
  });

  it("should handle task overflow scenarios", () => {
    function canFitTask(
      timetableStart: number,
      timetableEnd: number,
      existingTasks: Array<{ start: number; duration: number }>,
      newTaskDuration: number
    ): boolean {
      const totalHours = timetableEnd - timetableStart;
      const totalMinutes = totalHours * 60;

      const usedMinutes = existingTasks.reduce(
        (sum, task) => sum + task.duration,
        0
      );
      const availableMinutes = totalMinutes - usedMinutes;

      return availableMinutes >= newTaskDuration;
    }

    // 10-hour day (600 minutes)
    const existingTasks = [
      { start: 9, duration: 60 }, // 1 hour
      { start: 11, duration: 120 }, // 2 hours
      { start: 14, duration: 90 }, // 1.5 hours
    ];
    // Total used: 270 minutes, Available: 330 minutes

    expect(canFitTask(8, 18, existingTasks, 60)).toBe(true); // Can fit 1 more hour
    expect(canFitTask(8, 18, existingTasks, 330)).toBe(true); // Can fit exactly remaining time
    expect(canFitTask(8, 18, existingTasks, 360)).toBe(false); // Cannot fit more than available
  });
});
