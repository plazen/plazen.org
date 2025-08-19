import { NextRequest } from "next/server";
import { GET, POST, PATCH, DELETE } from "@/app/api/tasks/route";
import prisma from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";

// Mock modules
jest.mock("@/lib/prisma");
jest.mock("@supabase/ssr");
jest.mock("next/headers");

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCreateServerClient = createServerClient as jest.MockedFunction<
  typeof createServerClient
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

      const request = new NextRequest("http://localhost:3000/api/tasks");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("1");
      expect(data[0].title).toBe("Test Task");
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

      const request = new NextRequest(
        "http://localhost:3000/api/tasks?date=2025-08-19"
      );
      const response = await GET(request);

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
    it("should create a time-sensitive task successfully", async () => {
      const newTask = {
        id: BigInt(1),
        user_id: "test-user-id",
        title: "New Task",
        duration_minutes: 60,
        is_time_sensitive: true,
        scheduled_time: "2025-08-19T10:00:00.000Z",
        is_completed: false,
        created_at: new Date(),
      };

      mockPrisma.tasks.create.mockResolvedValue(newTask);

      const request = new NextRequest("http://localhost:3000/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "New Task",
          duration_minutes: 60,
          is_time_sensitive: true,
          scheduled_time: "2025-08-19T10:00:00.000Z",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("1");
      expect(data.title).toBe("New Task");
      expect(mockPrisma.tasks.create).toHaveBeenCalledWith({
        data: {
          user_id: "test-user-id",
          title: "New Task",
          duration_minutes: 60,
          is_time_sensitive: true,
          scheduled_time: "2025-08-19T10:00:00.000Z",
          is_completed: false,
        },
      });
    });

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
