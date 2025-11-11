import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const releaseNote = await prisma.release_notes.findUnique({
      where: { id },
    });

    if (!releaseNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(releaseNote, { status: 200 });
  } catch (error) {
    console.error("Error fetching release note:", error);
    return NextResponse.json(
      { error: "Failed to fetch release note" },
      { status: 500 }
    );
  }
}
