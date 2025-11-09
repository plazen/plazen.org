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
    it("should return existing user settings including telegram_id", async () => {
      const mockSettings = {
        id: "settings-id",
        user_id: "test-user-id",
        timetable_start: 9,
        timetable_end: 17,
        show_time_needle: true,
        theme: "dark",
        telegram_id: "123456789", // Include new field
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue(mockSettings);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timetable_start).toBe(9);
      expect(data.theme).toBe("dark");
      expect(data.telegram_id).toBe("123456789"); // Check new field
    });

    it("should create default settings with null telegram_id if none exist", async () => {
      const defaultSettings = {
        id: "new-settings-id",
        user_id: "test-user-id",
        timetable_start: 8,
        timetable_end: 18,
        show_time_needle: true,
        theme: "dark",
        telegram_id: null, // Default should be null
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.userSettings.findUnique.mockResolvedValue(null);
      mockPrisma.userSettings.create.mockResolvedValue(defaultSettings);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timetable_start).toBe(8);
      expect(data.telegram_id).toBeNull(); // Check new field default
      expect(mockPrisma.userSettings.create).toHaveBeenCalledWith({
        data: {
          user_id: "test-user-id",
          timetable_start: 8,
          timetable_end: 18,
          show_time_needle: true,
          theme: "dark",
          telegram_id: null, // Ensure default is created as null
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
    it("should update all user settings successfully, including telegram_id", async () => {
      const updatedSettings = {
        id: "settings-id",
        user_id: "test-user-id",
        timetable_start: 7,
        timetable_end: 19,
        show_time_needle: false,
        theme: "light",
        telegram_id: "987654321", // Include new field
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
          telegram_id: "987654321", // Send new field
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timetable_start).toBe(7);
      expect(data.theme).toBe("light");
      expect(data.telegram_id).toBe("987654321"); // Check updated field
      expect(mockPrisma.userSettings.update).toHaveBeenCalledWith({
        where: { user_id: "test-user-id" },
        data: {
          timetable_start: 7,
          timetable_end: 19,
          show_time_needle: false,
          theme: "light",
          telegram_id: "987654321", // Ensure it's in the update call
          updated_at: expect.any(Date),
        },
      });
    });

    it("should handle partial update for just telegram_id", async () => {
      const updatedSettings = {
        id: "settings-id",
        user_id: "test-user-id",
        timetable_start: 8, // Unchanged
        timetable_end: 18, // Unchanged
        telegram_id: "555555", // Changed
        updated_at: new Date(),
      };

      mockPrisma.userSettings.update.mockResolvedValue(updatedSettings);

      const request = new NextRequest("http://localhost:3000/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          telegram_id: "555555",
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.telegram_id).toBe("555555");
      expect(mockPrisma.userSettings.update).toHaveBeenCalledWith({
        where: { user_id: "test-user-id" },
        data: {
          telegram_id: "555555",
          updated_at: expect.any(Date),
        },
      });
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
