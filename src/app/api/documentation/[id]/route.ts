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

    const docEntry = await prisma.documentation_entries.findUnique({
      where: { id },
    });

    if (!docEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(docEntry, { status: 200 });
  } catch (error) {
    console.error("Error fetching documentation entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch documentation entry" },
      { status: 500 }
    );
  }
}
