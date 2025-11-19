import { TicketView } from "@/components/TicketView";
import AdminPage from "../../AdminPage";

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage>
      <div className="p-8 container mx-auto max-w-6xl min-h-screen">
        <TicketView ticketId={id} isAdmin={true} />
      </div>
    </AdminPage>
  );
}
