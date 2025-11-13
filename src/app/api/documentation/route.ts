import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const docEntries = await prisma.documentation_entries.findMany({
      orderBy: {
        category: "asc",
      },
    });

    return NextResponse.json(docEntries, { status: 200 });
  } catch (error) {
    console.error("Error fetching documentation entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch documentation entries" },
      { status: 500 }
    );
  }
}
