import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const releaseNotes = await prisma.release_notes.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(releaseNotes, { status: 200 });
  } catch (error) {
    console.error("Error fetching release notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch release notes" },
      { status: 500 }
    );
  }
}
