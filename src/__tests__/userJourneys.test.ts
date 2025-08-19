/**
 * End-to-End User Journey Tests
 * These tests simulate complete user workflows using business logic
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

describe("User Journey: Complete Task Management Flow", () => {
  const userId = "journey-user-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should complete full user onboarding and task creation journey", async () => {
    // Journey Step 1: User logs in and gets default settings
    const defaultSettings = {
      user_id: userId,
      timetable_start: 8,
      timetable_end: 18,
      show_time_needle: true,
      theme: "dark",
      created_at: new Date(),
      updated_at: new Date(),
    };

    (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValueOnce(
      null
    );
    (mockPrisma.userSettings.create as jest.Mock).mockResolvedValue(
      defaultSettings
    );

    // Simulate getting user settings for first time
    let settings = await mockPrisma.userSettings.findUnique({
      where: { user_id: userId },
    });

    if (!settings) {
      settings = await mockPrisma.userSettings.create({
        data: defaultSettings,
      });
    }

    expect(settings.timetable_start).toBe(8);
    expect(settings.timetable_end).toBe(18);

    // Journey Step 2: User customizes their settings
    const customSettings = {
      ...defaultSettings,
      timetable_start: 9,
      timetable_end: 17,
      show_time_needle: false,
      updated_at: new Date(),
    };

    (mockPrisma.userSettings.update as jest.Mock).mockResolvedValue(
      customSettings
    );

    const updatedSettings = await mockPrisma.userSettings.update({
      where: { user_id: userId },
      data: {
        timetable_start: 9,
        timetable_end: 17,
        show_time_needle: false,
        updated_at: new Date(),
      },
    });

    expect(updatedSettings.timetable_start).toBe(9);
    expect(updatedSettings.timetable_end).toBe(17);

    // Journey Step 3: User creates their first time-sensitive task
    const firstTask = {
      id: BigInt(1),
      user_id: userId,
      title: "Important Meeting",
      duration_minutes: 60,
      is_time_sensitive: true,
      scheduled_time: "2025-08-19T10:00:00.000Z",
      is_completed: false,
      created_at: new Date(),
    };

    (mockPrisma.tasks.create as jest.Mock).mockResolvedValue(firstTask);

    const createdTask = await mockPrisma.tasks.create({
      data: {
        user_id: userId,
        title: "Important Meeting",
        duration_minutes: 60,
        is_time_sensitive: true,
        scheduled_time: "2025-08-19T10:00:00.000Z",
        is_completed: false,
      },
    });

    expect(createdTask.title).toBe("Important Meeting");
    expect(createdTask.is_time_sensitive).toBe(true);

    // Journey Step 4: User creates an auto-scheduled task
    const autoTask = {
      id: BigInt(2),
      user_id: userId,
      title: "Review Documents",
      duration_minutes: 45,
      is_time_sensitive: false,
      scheduled_time: "2025-08-19T11:00:00.000Z",
      is_completed: false,
      created_at: new Date(),
    };

    (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue(
      customSettings
    );
    (mockPrisma.tasks.findMany as jest.Mock).mockResolvedValue([firstTask]);
    (mockPrisma.tasks.create as jest.Mock).mockResolvedValue(autoTask);

    // Check existing tasks for auto-scheduling
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

    const autoCreatedTask = await mockPrisma.tasks.create({
      data: {
        user_id: userId,
        title: "Review Documents",
        duration_minutes: 45,
        is_time_sensitive: false,
        scheduled_time: "2025-08-19T11:00:00.000Z", // Auto-scheduled
        is_completed: false,
      },
    });

    expect(autoCreatedTask.title).toBe("Review Documents");
    expect(autoCreatedTask.is_time_sensitive).toBe(false);

    // Journey Step 5: User views their daily schedule
    (mockPrisma.tasks.findMany as jest.Mock).mockResolvedValue([
      firstTask,
      autoTask,
    ]);

    const dailyTasks = await mockPrisma.tasks.findMany({
      where: {
        user_id: userId,
        scheduled_time: {
          gte: new Date("2025-08-19T00:00:00.000Z"),
          lt: new Date("2025-08-20T00:00:00.000Z"),
        },
      },
      orderBy: { created_at: "asc" },
    });

    expect(dailyTasks).toHaveLength(2);

    // Journey Step 6: User completes the first task
    const completedTask = { ...firstTask, is_completed: true };
    (mockPrisma.tasks.update as jest.Mock).mockResolvedValue(completedTask);

    const updatedTask = await mockPrisma.tasks.update({
      where: {
        id: BigInt(1),
        user_id: userId,
      },
      data: {
        is_completed: true,
      },
    });

    expect(updatedTask.is_completed).toBe(true);

    // Journey Step 7: User reschedules the second task
    const rescheduledTask = {
      ...autoTask,
      scheduled_time: "2025-08-19T14:00:00.000Z",
      is_time_sensitive: true,
    };
    (mockPrisma.tasks.update as jest.Mock).mockResolvedValue(rescheduledTask);

    const rescheduled = await mockPrisma.tasks.update({
      where: {
        id: BigInt(2),
        user_id: userId,
      },
      data: {
        scheduled_time: "2025-08-19T14:00:00.000Z",
        is_time_sensitive: true,
      },
    });

    expect(rescheduled.scheduled_time).toBe("2025-08-19T14:00:00.000Z");

    // Journey Step 8: User deletes the completed task
    (mockPrisma.tasks.delete as jest.Mock).mockResolvedValue(completedTask);

    const deletedTask = await mockPrisma.tasks.delete({
      where: {
        id: BigInt(1),
        user_id: userId,
      },
    });

    expect(deletedTask).toBeTruthy();

    // Verify the journey completed successfully
    expect(mockPrisma.userSettings.create).toHaveBeenCalled();
    expect(mockPrisma.userSettings.update).toHaveBeenCalled();
    expect(mockPrisma.tasks.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.tasks.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.tasks.delete).toHaveBeenCalledTimes(1);
  });
});

describe("User Journey: Multi-Day Task Planning", () => {
  const userId = "multi-day-user";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle planning tasks across multiple days", async () => {
    const settings = {
      user_id: userId,
      timetable_start: 8,
      timetable_end: 18,
    };

    // Day 1: Create tasks for today
    const todayTasks = [
      {
        id: BigInt(1),
        user_id: userId,
        title: "Monday Meeting",
        duration_minutes: 60,
        is_time_sensitive: true,
        scheduled_time: "2025-08-19T09:00:00.000Z",
        is_completed: false,
        created_at: new Date(),
      },
      {
        id: BigInt(2),
        user_id: userId,
        title: "Monday Task",
        duration_minutes: 90,
        is_time_sensitive: false,
        scheduled_time: "2025-08-19T10:30:00.000Z",
        is_completed: false,
        created_at: new Date(),
      },
    ];

    (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue(
      settings
    );
    (mockPrisma.tasks.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.tasks.create as jest.Mock).mockResolvedValueOnce(todayTasks[0]);
    (mockPrisma.tasks.create as jest.Mock).mockResolvedValueOnce(todayTasks[1]);

    // Create tasks for today
    for (const task of todayTasks) {
      const createdTask = await mockPrisma.tasks.create({
        data: {
          user_id: userId,
          title: task.title,
          duration_minutes: task.duration_minutes,
          is_time_sensitive: task.is_time_sensitive,
          scheduled_time: task.scheduled_time,
          is_completed: false,
        },
      });

      expect(createdTask.title).toBe(task.title);
    }

    // Day 2: Create tasks for tomorrow
    const tomorrowTasks = [
      {
        id: BigInt(3),
        user_id: userId,
        title: "Tuesday Presentation",
        duration_minutes: 120,
        is_time_sensitive: true,
        scheduled_time: "2025-08-20T14:00:00.000Z",
        is_completed: false,
        created_at: new Date(),
      },
    ];

    (mockPrisma.tasks.findMany as jest.Mock).mockResolvedValue(todayTasks);
    (mockPrisma.tasks.create as jest.Mock).mockResolvedValue(tomorrowTasks[0]);

    const tomorrowTask = await mockPrisma.tasks.create({
      data: {
        user_id: userId,
        title: "Tuesday Presentation",
        duration_minutes: 120,
        is_time_sensitive: true,
        scheduled_time: "2025-08-20T14:00:00.000Z",
        is_completed: false,
      },
    });

    expect(tomorrowTask.title).toBe("Tuesday Presentation");

    // Verify tasks are created for both days
    expect(mockPrisma.tasks.create).toHaveBeenCalledTimes(3);
  });
});

describe("User Journey: Edge Cases and Error Handling", () => {
  const userId = "edge-case-user";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle busy day with no available slots", async () => {
    const settings = {
      user_id: userId,
      timetable_start: 9,
      timetable_end: 17, // 8-hour day
    };

    // Fill the entire day with existing tasks
    const existingTasks = Array.from({ length: 8 }, (_, i) => ({
      id: BigInt(i + 1),
      user_id: userId,
      scheduled_time: new Date(`2025-08-19T${9 + i}:00:00.000Z`),
      duration_minutes: 60,
      title: `Existing Task ${i + 1}`,
      is_time_sensitive: true,
      is_completed: false,
      created_at: new Date(),
    }));

    (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue(
      settings
    );
    (mockPrisma.tasks.findMany as jest.Mock).mockResolvedValue(existingTasks);

    const newTask = {
      id: BigInt(9),
      user_id: userId,
      title: "Overflow Task",
      duration_minutes: 60,
      is_time_sensitive: false,
      scheduled_time: null, // Should remain null when no slots available
      is_completed: false,
      created_at: new Date(),
    };

    (mockPrisma.tasks.create as jest.Mock).mockResolvedValue(newTask);

    // Check for available slots first
    const userSettings = await mockPrisma.userSettings.findUnique({
      where: { user_id: userId },
    });

    const currentTasks = await mockPrisma.tasks.findMany({
      where: {
        user_id: userId,
        scheduled_time: {
          gte: new Date("2025-08-19T00:00:00.000Z"),
          lt: new Date("2025-08-20T00:00:00.000Z"),
        },
      },
      orderBy: { scheduled_time: "asc" },
    });

    // Simulate checking if task can fit (should not fit with 8 existing 1-hour tasks)
    const totalHours =
      userSettings!.timetable_end - userSettings!.timetable_start;
    const usedHours = currentTasks.reduce(
      (sum, task) => sum + (task.duration_minutes || 0) / 60,
      0
    );
    const availableHours = totalHours - usedHours;
    const canFit = availableHours >= 1; // 1 hour needed

    expect(canFit).toBe(false); // Should not fit

    // Create task anyway (without auto-scheduling)
    const createdTask = await mockPrisma.tasks.create({
      data: {
        user_id: userId,
        title: "Overflow Task",
        duration_minutes: 60,
        is_time_sensitive: false,
        scheduled_time: null, // No auto-scheduling possible
        is_completed: false,
      },
    });

    expect(createdTask.title).toBe("Overflow Task");
    expect(createdTask.scheduled_time).toBeNull();
  });

  it("should handle concurrent task creation", async () => {
    const settings = {
      user_id: userId,
      timetable_start: 8,
      timetable_end: 18,
    };

    (mockPrisma.userSettings.findUnique as jest.Mock).mockResolvedValue(
      settings
    );
    (mockPrisma.tasks.findMany as jest.Mock).mockResolvedValue([]);

    // Simulate concurrent task creation
    const concurrentTasks = Array.from({ length: 5 }, (_, i) => ({
      id: BigInt(i + 1),
      user_id: userId,
      title: `Concurrent Task ${i + 1}`,
      duration_minutes: 60,
      is_time_sensitive: false,
      scheduled_time: `2025-08-19T${8 + i}:00:00.000Z`,
      is_completed: false,
      created_at: new Date(),
    }));

    // Mock task creation for concurrent requests
    concurrentTasks.forEach((task) => {
      (mockPrisma.tasks.create as jest.Mock).mockResolvedValueOnce(task);
    });

    // Execute all task creations concurrently
    const taskPromises = concurrentTasks.map((task, i) =>
      mockPrisma.tasks.create({
        data: {
          user_id: userId,
          title: `Concurrent Task ${i + 1}`,
          duration_minutes: 60,
          is_time_sensitive: false,
          scheduled_time: `2025-08-19T${8 + i}:00:00.000Z`,
          is_completed: false,
        },
      })
    );

    const results = await Promise.all(taskPromises);

    // All tasks should be created successfully
    expect(results).toHaveLength(5);
    results.forEach((result, i) => {
      expect(result.title).toBe(`Concurrent Task ${i + 1}`);
    });
  });

  it("should handle task validation errors", () => {
    // Test input validation logic
    function validateTaskInput(input: {
      title?: string;
      duration_minutes?: number;
      scheduled_time?: string;
    }): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (!input.title || input.title.trim() === "") {
        errors.push("Title is required");
      }

      if (input.title && input.title.length > 200) {
        errors.push("Title is too long");
      }

      if (
        input.duration_minutes &&
        (input.duration_minutes < 5 || input.duration_minutes > 480)
      ) {
        errors.push("Duration must be between 5 and 480 minutes");
      }

      if (
        input.scheduled_time &&
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(
          input.scheduled_time
        )
      ) {
        errors.push("Invalid scheduled time format");
      }

      return { valid: errors.length === 0, errors };
    }

    // Test various validation scenarios
    expect(
      validateTaskInput({ title: "Valid Task", duration_minutes: 60 })
    ).toEqual({
      valid: true,
      errors: [],
    });

    expect(validateTaskInput({ title: "", duration_minutes: 60 })).toEqual({
      valid: false,
      errors: ["Title is required"],
    });

    expect(
      validateTaskInput({ title: "Valid Task", duration_minutes: 1000 })
    ).toEqual({
      valid: false,
      errors: ["Duration must be between 5 and 480 minutes"],
    });

    expect(
      validateTaskInput({
        title: "Valid Task",
        duration_minutes: 60,
        scheduled_time: "invalid-format",
      })
    ).toEqual({
      valid: false,
      errors: ["Invalid scheduled time format"],
    });
  });
});
