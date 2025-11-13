import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function AdminSupportPage() {
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

  const tickets = await prisma.support_tickets.findMany({
    orderBy: { updated_at: "desc" },
    include: {
      users: { select: { email: true } },
      labels: { include: { label: true } },
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Support Dashboard</h1>

      <div className="rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Status
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Subject
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                User
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Last Update
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Labels
              </th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      ticket.status === "open"
                        ? "bg-green-900 text-green-300"
                        : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="p-4 align-middle font-medium">{ticket.title}</td>
                <td className="p-4 align-middle text-muted-foreground">
                  {ticket.users.email}
                </td>
                <td className="p-4 align-middle">
                  {formatDistanceToNow(new Date(ticket.updated_at))} ago
                </td>
                <td className="p-4 align-middle">
                  <div className="flex gap-1 flex-wrap">
                    {ticket.labels.map(({ label }) => (
                      <span
                        key={label.id}
                        className="text-xs bg-secondary px-1.5 py-0.5 rounded border border-border"
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 align-middle text-right">
                  <Link
                    href={`/admin/support/${ticket.id}`}
                    className="text-primary hover:underline"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
