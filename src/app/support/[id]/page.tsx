import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { TicketView } from "@/components/TicketView";

async function getTicket(id: string, userId: string) {
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

  if (!ticket || ticket.user_id !== userId) {
    return null;
  }

  // Convert dates to strings
  return JSON.parse(JSON.stringify(ticket));
}

export default async function UserTicketPage({
  params,
}: {
  params: { id: string };
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
  if (!session) {
    redirect("/login");
  }

  const ticket = await getTicket(params.id, session.user.id);

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Ticket not found</h1>
        <p className="text-muted-foreground">
          This ticket may not exist or you may not have permission to view it.
        </p>
      </div>
    );
  }

  return (
    <TicketView
      initialTicket={ticket}
      currentUserId={session.user.id}
      isAdmin={false}
    />
  );
}
