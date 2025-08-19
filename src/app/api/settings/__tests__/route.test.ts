// @ts-nocheck
import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/settings/route";
import prisma from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";

// Mock modules
jest.mock("@/lib/prisma");
jest.mock("@supabase/ssr");
jest.mock("next/headers");

const mockPrisma = prisma as any;
const mockCreateServerClient = createServerClient as jest.MockedFunction<
  typeof createServerClient
>;

describe("/api/settings route handlers", () => {
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

  describe("GET /api/settings", () => {
    it("should return existing user settings", async () => {
      const mockSettings = {
        id: "settings-id",
        user_id: "test-user-id",
        timetable_start: 9,
        timetable_end: 17,
        show_time_needle: true,
        theme: "dark",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue(mockSettings);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timetable_start).toBe(9);
      expect(data.timetable_end).toBe(17);
      expect(data.show_time_needle).toBe(true);
      expect(data.theme).toBe("dark");
    });

    it("should create default settings if none exist", async () => {
      const defaultSettings = {
        id: "new-settings-id",
        user_id: "test-user-id",
        timetable_start: 8,
        timetable_end: 18,
        show_time_needle: true,
        theme: "dark",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue(null);
      mockPrisma.userSettings.create.mockResolvedValue(defaultSettings);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timetable_start).toBe(8);
      expect(data.timetable_end).toBe(18);
      expect(mockPrisma.userSettings.create).toHaveBeenCalledWith({
        data: {
          user_id: "test-user-id",
          timetable_start: 8,
          timetable_end: 18,
          show_time_needle: true,
          theme: "dark",
          created_at: expect.any(Date),
          updated_at: expect.any(Date),
        },
      });
    });

    it("should return unauthorized when no session", async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.userSettings.findUnique.mockRejectedValue(
        new Error("Database error")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch settings");
    });
  });

  describe("PATCH /api/settings", () => {
    it("should update user settings successfully", async () => {
      const updatedSettings = {
        id: "settings-id",
        user_id: "test-user-id",
        timetable_start: 7,
        timetable_end: 19,
        show_time_needle: false,
        theme: "light",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.userSettings.update.mockResolvedValue(updatedSettings);

      const request = new NextRequest("http://localhost:3000/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          timetable_start: 7,
          timetable_end: 19,
          show_time_needle: false,
          theme: "light",
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timetable_start).toBe(7);
      expect(data.timetable_end).toBe(19);
      expect(data.show_time_needle).toBe(false);
      expect(data.theme).toBe("light");
      expect(mockPrisma.userSettings.update).toHaveBeenCalledWith({
        where: { user_id: "test-user-id" },
        data: {
          timetable_start: 7,
          timetable_end: 19,
          show_time_needle: false,
          theme: "light",
          updated_at: expect.any(Date),
        },
      });
    });

    it("should handle partial updates", async () => {
      const updatedSettings = {
        id: "settings-id",
        user_id: "test-user-id",
        timetable_start: 10,
        timetable_end: 18,
        show_time_needle: true,
        theme: "dark",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.userSettings.update.mockResolvedValue(updatedSettings);

      const request = new NextRequest("http://localhost:3000/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          timetable_start: 10,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timetable_start).toBe(10);
    });

    it("should return unauthorized when no session", async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });

      const request = new NextRequest("http://localhost:3000/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          timetable_start: 9,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should handle database errors during update", async () => {
      mockPrisma.userSettings.update.mockRejectedValue(
        new Error("Database error")
      );

      const request = new NextRequest("http://localhost:3000/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          timetable_start: 9,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update settings");
    });
  });
});
