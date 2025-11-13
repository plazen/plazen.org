import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

export default async function SupportPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const tickets = await prisma.support_tickets.findMany({
    where: { user_id: session?.user.id },
    orderBy: { updated_at: "desc" },
    include: { labels: { include: { label: true } } },
  });

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">
            Track your inquiries and issues.
          </p>
        </div>
        <Button asChild>
          <Link href="/support/new">
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-12 border rounded-lg border-dashed">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No tickets yet</h3>
            <p className="text-muted-foreground">
              Need help? Create a new support ticket.
            </p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/support/${ticket.id}`}
              className="block"
            >
              <div className="bg-card border rounded-lg p-4 hover:border-primary transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{ticket.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs capitalize
                        ${
                          ticket.status === "open"
                            ? "bg-green-500/10 text-green-500"
                            : ticket.status === "closed"
                            ? "bg-gray-500/10 text-gray-500"
                            : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated{" "}
                      {formatDistanceToNow(new Date(ticket.updated_at))} ago
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {ticket.labels.map(({ label }) => (
                      <span
                        key={label.id}
                        className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground"
                        style={{ borderLeft: `3px solid ${label.color}` }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
