import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { NotificationManager } from "./NotificationManager";

export default async function AdminNotificationsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
    redirect("/schedule");
  }

  const initialNotifications = await prisma.notifications.findMany({
    orderBy: {
      created_at: "desc",
    },
  });

  return (
    <div className="p-4 md:p-8">
      <NotificationManager initialNotifications={initialNotifications} />
    </div>
  );
}
