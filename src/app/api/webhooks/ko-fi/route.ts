import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const dataStr = formData.get("data") as string;
    if (!dataStr)
      return NextResponse.json({ error: "No data" }, { status: 400 });

    const payload = JSON.parse(dataStr);

    if (payload.verification_token !== process.env.KOFI_VERIFICATION_TOKEN) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    if (payload.type === "Subscription" || payload.type === "Donation") {
      const userEmail = payload.email;

      const user = await prisma.users.findFirst({
        where: { email: userEmail },
      });

      if (user) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 31);
        await prisma.subscription.upsert({
          where: { user_id: user.id },
          update: {
            is_pro: true,
            provider: "ko-fi",
            subscription_id:
              payload.subscription_id || payload.kofi_transaction_id,
            ends_at: expiresAt,
            updated_at: new Date(),
          },
          create: {
            user_id: user.id,
            is_pro: true,
            provider: "ko-fi",
            subscription_id:
              payload.subscription_id || payload.kofi_transaction_id,
            ends_at: expiresAt,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
