"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Send, X, Shield, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  email: string | null;
};

type Label = {
  id: string;
  name: string;
  color: string;
};

type TicketLabel = {
  label: Label;
};

type Message = {
  id: string;
  message: string;
  created_at: string;
  is_internal: boolean;
  user: User;
};

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  users: User;
  messages: Message[];
  labels: TicketLabel[];
};

type AllLabels = Label;

interface TicketViewProps {
  initialTicket: Ticket;
  currentUserId: string;
  isAdmin: boolean;
  allLabels?: AllLabels[];
}

export function TicketView({
  initialTicket,
  currentUserId,
  isAdmin,
  allLabels = [],
}: TicketViewProps) {
  const [ticket, setTicket] = useState(initialTicket);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refresh ticket data from server
  const refreshTicket = async () => {
    const res = await fetch(`/api/support/tickets/${ticket.id}`);
    if (res.ok) {
      const data = await res.json();
      setTicket(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    await fetch(`/api/support/tickets/${ticket.id}`, {
      method: "POST",
      body: JSON.stringify({
        message: newMessage,
        is_internal: isInternal,
      }),
    });

    setNewMessage("");
    setIsInternal(false);
    await refreshTicket();
    setLoading(false);
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newStatus = e.target.value;
    setLoading(true);
    await fetch(`/api/support/tickets/${ticket.id}`, {
      method: "POST",
      body: JSON.stringify({ status: newStatus }),
    });
    await refreshTicket();
    setLoading(false);
  };

  const handleAddLabel = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const labelId = e.target.value;
    if (!labelId) return;

    setLoading(true);
    await fetch(`/api/support/tickets/${ticket.id}/labels`, {
      method: "POST",
      body: JSON.stringify({ labelId }),
    });
    await refreshTicket();
    setLoading(false);
  };

  const handleRemoveLabel = async (labelId: string) => {
    setLoading(true);
    await fetch(`/api/support/tickets/${ticket.id}/labels?labelId=${labelId}`, {
      method: "DELETE",
    });
    await refreshTicket();
    setLoading(false);
  };

  const ticketLabels = ticket.labels.map((l) => l.label);
  const availableLabels = allLabels.filter(
    (l) => !ticketLabels.find((tl) => tl.id === l.id)
  );

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Link
        href={isAdmin ? "/admin/support" : "/support"}
        className="text-sm text-muted-foreground hover:text-primary flex items-center mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to tickets
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className=" border rounded-lg mb-6">
            <div className="p-4 border-b">
              <span className="text-xs text-muted-foreground">
                Ticket #{ticket.id.split("-")[0]}
              </span>
              <h1 className="text-2xl font-bold">{ticket.title}</h1>
              <p className="text-sm text-muted-foreground">
                Opened by {ticket.users.email} on{" "}
                {format(parseISO(ticket.created_at), "PPP")}
              </p>
            </div>
            <div className="p-4 space-y-6">
              {ticket.messages
                .filter((msg) => isAdmin || !msg.is_internal)
                .map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="flex-shrink-0 bg-secondary rounded-full h-10 w-10 flex items-center justify-center">
                      {msg.user.id === ticket.user_id ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <Shield className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex-1 p-4 rounded-lg",
                        msg.is_internal
                          ? "bg-yellow-500/10 border border-yellow-500/30"
                          : "bg-secondary/50",
                        msg.user.id === currentUserId ? "bg-primary/10" : ""
                      )}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm">
                          {msg.user.id === currentUserId
                            ? "You"
                            : msg.user.email}
                          {msg.user.id !== ticket.user_id &&
                            !msg.is_internal &&
                            " (Support)"}
                          {msg.is_internal && " (Internal Note)"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(msg.created_at), "Pp")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={loading}
              className="flex min-h-[120px] w-full rounded-md rounded-b-none  bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder={
                isAdmin
                  ? "Type your reply or add an internal note..."
                  : "Type your reply..."
              }
            />
            <div className="flex justify-between items-center bg-card  rounded-lg rounded-t-none p-3">
              <div>
                {isAdmin && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-primary rounded"
                    />
                    {isInternal
                      ? "Internal Note (not visible to user)"
                      : "Public Reply"}
                  </label>
                )}
              </div>
              <Button type="submit" disabled={loading || !newMessage.trim()}>
                {loading ? "Sending..." : "Send"}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-card rounded-lg p-4">
            <h3 className="font-semibold mb-3">Ticket Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                {isAdmin ? (
                  <select
                    value={ticket.status}
                    onChange={handleStatusChange}
                    disabled={loading}
                    className="text-right bg-transparen p-0 focus:ring-0"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <span className="capitalize">
                    {ticket.status.replace("_", " ")}
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="capitalize">{ticket.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Update</span>
                <span>{format(parseISO(ticket.updated_at), "Pp")}</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-card rounded-lg p-4">
              <h3 className="font-semibold mb-3">Labels</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {ticketLabels.map((label) => (
                  <span
                    key={label.id}
                    className="flex items-center text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground"
                    style={{ borderLeft: `3px solid ${label.color}` }}
                  >
                    {label.name}
                    <button
                      onClick={() => handleRemoveLabel(label.id)}
                      disabled={loading}
                    >
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </span>
                ))}
              </div>
              <select
                onChange={handleAddLabel}
                disabled={loading || availableLabels.length === 0}
                className="flex h-9 w-full items-center justify-between rounded-md bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {availableLabels.length > 0
                    ? "Add a label..."
                    : "No labels to add"}
                </option>
                {availableLabels.map((label) => (
                  <option
                    key={label.id}
                    value={label.id}
                    className="bg-background"
                  >
                    {label.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
