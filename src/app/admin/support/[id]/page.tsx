import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { TicketView } from "@/components/TicketView";

async function getTicket(id: string) {
  const ticket = await prisma.support_tickets.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { created_at: "asc" },
        include: { user: { select: { email: true, id: true } } },
      },
      labels: { include: { label: true } },
      users: { select: { email: true } },
    },
  });

  if (!ticket) {
    return null;
  }

  return JSON.parse(JSON.stringify(ticket));
}

async function getAllLabels() {
  const labels = await prisma.support_labels.findMany({
    orderBy: { name: "asc" },
  });
  return JSON.parse(JSON.stringify(labels));
}

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  const { id } = await params;
  const ticket = await getTicket(id);
  const allLabels = await getAllLabels();

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Ticket not found</h1>
      </div>
    );
  }

  return (
    <div className="p-8 container mx-auto max-w-6xl min-h-screen">
      <TicketView
        initialTicket={ticket}
        currentUserId={session.user.id}
        isAdmin={true}
        allLabels={allLabels}
      />
    </div>
  );
}
