// @ts-nocheck
import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "@/app/api/tasks/route";
import prisma from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { syncCalendarSource } from "@/lib/calDavService";
import {
  shouldGenerateRoutineTasksForToday,
  autoGenerateRoutineTasksForToday,
} from "@/lib/routineTasksService";

// Mock modules
jest.mock("@/lib/prisma");
jest.mock("@supabase/ssr");
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));
jest.mock("@/lib/calDavService");
jest.mock("@/lib/routineTasksService");

const mockPrisma = prisma as any;
const mockCreateServerClient = createServerClient as jest.MockedFunction<
  typeof createServerClient
>;
const mockSyncCalendarSource = syncCalendarSource as jest.MockedFunction<
  typeof syncCalendarSource
>;
const mockCookies = cookies as unknown as jest.Mock;
const mockShouldGenerateRoutineTasksForToday =
  shouldGenerateRoutineTasksForToday as jest.MockedFunction<
    typeof shouldGenerateRoutineTasksForToday
  >;
const mockAutoGenerateRoutineTasksForToday =
  autoGenerateRoutineTasksForToday as jest.MockedFunction<
    typeof autoGenerateRoutineTasksForToday
  >;

describe("/api/tasks route handlers", () => {
  const mockSession = {
    user: { id: "test-user-id" },
  };

  const mockSupabaseClient = {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: mockSession },
      }),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateServerClient.mockReturnValue(mockSupabaseClient as unknown);
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
    });

    mockCookies.mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as any);

    mockPrisma.tasks = {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    mockPrisma.external_events = {
      findMany: jest.fn(),
    };
    mockPrisma.calendar_sources = {
      findMany: jest.fn(),
      update: jest.fn(),
    };

    mockPrisma.userSettings = {
      findUnique: jest.fn(),
    };

    mockPrisma.external_events.findMany.mockResolvedValue([]);
    mockPrisma.calendar_sources.findMany.mockResolvedValue([]);
    mockSyncCalendarSource.mockResolvedValue(undefined as never);
    mockShouldGenerateRoutineTasksForToday.mockResolvedValue(false);
    mockAutoGenerateRoutineTasksForToday.mockResolvedValue([]);
  });

  describe("GET /api/tasks", () => {
    it("should return unauthorized when no session", async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });

      const request = new NextRequest("http://localhost:3000/api/tasks");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should fetch all tasks successfully", async () => {
      const mockTasks = [
        {
          id: BigInt(1),
          user_id: "test-user-id",
          title: "Test Task",
          duration_minutes: 60,
          is_time_sensitive: true,
          scheduled_time: new Date("2025-08-19T10:00:00.000Z"),
          is_completed: false,
          created_at: new Date(),
        },
      ];

      mockPrisma.tasks.findMany.mockResolvedValue(mockTasks);
      mockPrisma.external_events.findMany.mockResolvedValue([]);

      const request = new NextRequest("http://localhost:3000/api/tasks");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("1");
      expect(data[0].title).toBe("Test Task");
      expect(mockPrisma.external_events.findMany).toHaveBeenCalledWith({
        where: {
          source: { user_id: "test-user-id" },
        },
        include: { source: true },
      });
    });

    it("should filter tasks by date when date parameter provided", async () => {
      const mockTasks = [
        {
          id: BigInt(1),
          user_id: "test-user-id",
          title: "Test Task",
          duration_minutes: 60,
          is_time_sensitive: true,
          scheduled_time: new Date("2025-08-19T10:00:00.000Z"),
          is_completed: false,
          created_at: new Date(),
        },
      ];

      mockPrisma.tasks.findMany.mockResolvedValue(mockTasks);
      mockPrisma.calendar_sources.findMany.mockResolvedValue([
        { id: "source-1", user_id: "test-user-id" },
      ]);
      mockPrisma.external_events.findMany.mockResolvedValue([
        {
          id: 42,
          title: "External Meeting",
          start_time: new Date("2025-08-19T09:00:00.000Z"),
          end_time: new Date("2025-08-19T10:00:00.000Z"),
          description: "Sync",
          source: { color: "#123456" },
        },
      ]);

      const request = new NextRequest(
        "http://localhost:3000/api/tasks?date=2025-08-19&timezoneOffset=120"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.tasks.findMany).toHaveBeenCalledWith({
        where: {
          user_id: "test-user-id",
          scheduled_time: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
        },
        orderBy: { created_at: "asc" },
      });

      expect(mockPrisma.external_events.findMany).toHaveBeenCalledWith({
        where: {
          source: { user_id: "test-user-id" },
          start_time: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
        },
        include: { source: true },
      });

      expect(mockSyncCalendarSource).toHaveBeenCalledTimes(1);
      const callArgs = mockSyncCalendarSource.mock.calls[0];
      const options = callArgs[1];
      const expectedRangeStart = new Date(Date.UTC(2025, 7, 19, 0, 0, 0));
      const expectedRangeEnd = new Date(Date.UTC(2025, 7, 20, 0, 0, 0));

      expect(callArgs[0]).toBe("source-1");
      expect(options).toEqual(
        expect.objectContaining({
          expectedUserId: "test-user-id",
          rangeStart: expectedRangeStart,
          rangeEnd: expectedRangeEnd,
        })
      );

      expect(data).toHaveLength(2);
      const externalEvent = data[1];
      expect(externalEvent.id).toBe("ext_42");
      expect(externalEvent.scheduled_time).toBe("2025-08-19T07:00:00.000Z");
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.tasks.findMany.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/tasks");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch tasks");
    });
  });

  describe("POST /api/tasks", () => {
    it("should auto-schedule non-time-sensitive tasks", async () => {
      const newTask = {
        id: BigInt(1),
        user_id: "test-user-id",
        title: "Auto Scheduled Task",
        duration_minutes: 60,
        is_time_sensitive: false,
        scheduled_time: "2025-08-19T09:00:00.000Z",
        is_completed: false,
        created_at: new Date(),
      };

      const mockSettings = {
        user_id: "test-user-id",
        timetable_start: 8,
        timetable_end: 18,
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue(mockSettings);
      mockPrisma.tasks.findMany.mockResolvedValue([]);
      mockPrisma.tasks.create.mockResolvedValue(newTask);

      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "Auto Scheduled Task",
          duration_minutes: 60,
          is_time_sensitive: false,
          for_date: "2025-08-19",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe("Auto Scheduled Task");
      expect(mockPrisma.userSettings.findUnique).toHaveBeenCalled();
    });

    it("should return 400 when title is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          duration_minutes: 60,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Title is required");
    });

    it("should handle unauthorized requests", async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });

      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Task",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("PATCH /api/tasks", () => {
    it("should update task completion status", async () => {
      const updatedTask = {
        id: BigInt(1),
        user_id: "test-user-id",
        title: "Updated Task",
        duration_minutes: 60,
        is_time_sensitive: true,
        scheduled_time: "2025-08-19T10:00:00.000Z",
        is_completed: true,
        created_at: new Date(),
      };

      mockPrisma.tasks.update.mockResolvedValue(updatedTask);

      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "PATCH",
        body: JSON.stringify({
          id: "1",
          is_completed: true,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.is_completed).toBe(true);
      expect(mockPrisma.tasks.update).toHaveBeenCalledWith({
        where: {
          id: BigInt(1),
          user_id: "test-user-id",
        },
        data: {
          is_completed: true,
        },
      });
    });

    it("should update task scheduled time and mark as time sensitive", async () => {
      const updatedTask = {
        id: BigInt(1),
        user_id: "test-user-id",
        title: "Rescheduled Task",
        duration_minutes: 60,
        is_time_sensitive: true,
        scheduled_time: "2025-08-19T14:00:00.000Z",
        is_completed: false,
        created_at: new Date(),
      };

      mockPrisma.tasks.update.mockResolvedValue(updatedTask);

      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "PATCH",
        body: JSON.stringify({
          id: "1",
          scheduled_time: "2025-08-19T14:00:00.000Z",
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.is_time_sensitive).toBe(true);
    });

    it("should return 400 when no task ID provided", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "PATCH",
        body: JSON.stringify({
          is_completed: true,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Task ID is required");
    });

    it("should return 400 when no update data provided", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "PATCH",
        body: JSON.stringify({
          id: "1",
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No update data provided");
    });
  });

  describe("DELETE /api/tasks", () => {
    it("should delete task successfully", async () => {
      mockPrisma.tasks.delete.mockResolvedValue({
        id: BigInt(1),
        user_id: "test-user-id",
        title: "Deleted Task",
        duration_minutes: 60,
        is_time_sensitive: true,
        scheduled_time: new Date(),
        is_completed: false,
        created_at: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "DELETE",
        body: JSON.stringify({
          id: "1",
        }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Task deleted successfully");
      expect(mockPrisma.tasks.delete).toHaveBeenCalledWith({
        where: {
          id: BigInt(1),
          user_id: "test-user-id",
        },
      });
    });

    it("should return 400 when no task ID provided", async () => {
      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "DELETE",
        body: JSON.stringify({}),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Task ID is required");
    });

    it("should handle database errors during deletion", async () => {
      mockPrisma.tasks.delete.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "DELETE",
        body: JSON.stringify({
          id: "1",
        }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete task");
    });
  });
});
