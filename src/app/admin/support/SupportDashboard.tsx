"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { LabelManager } from "@/components/LabelManager";
import LoadingSpinner from "@/app/components/LoadingSpinner";

type Ticket = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  users: { email: string };
  labels: { label: { id: string; name: string; color: string } }[];
};

export function SupportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch("/api/support/tickets");
        if (response.ok) {
          const data = await response.json();
          setTickets(data);
        } else {
          setError("Failed to fetch tickets");
        }
      } catch (error) {
        setError("Failed to fetch tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <LoadingSpinner
          size="lg"
          text="Loading tickets..."
          variant="dots"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 container mx-auto max-w-6xl min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Admin Support Dashboard</h1>

      <LabelManager />

      <div className="bg-card rounded-md border overflow-hidden">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-muted/50 [&_tr]:border-b">
            <tr className="border-b transition-colors">
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
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      ticket.status === "open"
                        ? "bg-green-500/10 text-green-500"
                        : ticket.status === "closed"
                        ? "bg-muted text-muted-foreground"
                        : "bg-blue-500/10 text-blue-500"
                    }`}
                  >
                    {ticket.status.replace("_", " ")}
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
                  <div className="flex gap-1.5 flex-wrap">
                    {ticket.labels.map(({ label }) => (
                      <span
                        key={label.id}
                        className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium"
                        style={{ borderLeft: `2px solid ${label.color}` }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 align-middle text-right">
                  <Link
                    href={`/admin/support/${ticket.id}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
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
