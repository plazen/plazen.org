import type { Metadata } from "next";
import NewTicketPage from "./NewTicketPage";

export const metadata: Metadata = {
  title: "New Support Ticket",
  description: "Create a new support ticket to get help with Plazen.",
};

export default function Page() {
  return <NewTicketPage />;
}
