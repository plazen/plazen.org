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
        className="text-sm text-muted-foreground hover:text-primary flex items-center mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to tickets
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg mb-6 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/40">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded bg-secondary/50">
                  #{ticket.id.split("-")[0]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(ticket.created_at), "PPP p")}
                </span>
              </div>
              <h1 className="text-2xl font-bold">{ticket.title}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Opened by{" "}
                <span className="font-medium text-foreground">
                  {ticket.users.email}
                </span>
              </p>
            </div>
            <div className="p-6 space-y-6">
              {ticket.messages
                .filter((msg) => isAdmin || !msg.is_internal)
                .map((msg) => (
                  <div key={msg.id} className="flex gap-4 group">
                    <div className="flex-shrink-0">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-background shadow-sm",
                          msg.user.id === ticket.user_id
                            ? "bg-secondary text-foreground"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {msg.user.id === ticket.user_id ? (
                          <User className="w-5 h-5" />
                        ) : (
                          <Shield className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex-1 p-4 rounded-lg shadow-sm transition-colors",
                        msg.is_internal
                          ? "bg-yellow-500/10 border border-yellow-500/20"
                          : msg.user.id === currentUserId
                          ? "bg-primary/5 border border-primary/10"
                          : "bg-secondary/30 border border-border/50"
                      )}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">
                          {msg.user.id === currentUserId
                            ? "You"
                            : msg.user.email}
                          {msg.user.id !== ticket.user_id &&
                            !msg.is_internal &&
                            " (Support)"}
                          {msg.is_internal && " (Internal Note)"}
                        </span>
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {format(parseISO(msg.created_at), "p")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card rounded-lg shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring/30 transition-all"
          >
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={loading}
              className="flex min-h-[120px] w-full bg-transparent px-6 py-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none resize-none"
              placeholder={
                isAdmin
                  ? "Type your reply or add an internal note..."
                  : "Type your reply..."
              }
            />
            <div className="flex justify-between items-center bg-muted/20 border-t border-border/40 px-4 py-3">
              <div>
                {isAdmin && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/20"
                    />
                    {isInternal ? "Internal Note" : "Public Reply"}
                  </label>
                )}
              </div>
              <Button type="submit" disabled={loading || !newMessage.trim()}>
                {loading ? "Sending..." : "Send Reply"}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-lg">Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">
                  Status
                </span>
                {isAdmin ? (
                  <select
                    value={ticket.status}
                    onChange={handleStatusChange}
                    disabled={loading}
                    className="w-full bg-secondary/50 rounded-md px-2 py-2 border-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-secondary/70 transition-colors"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        ticket.status === "open"
                          ? "bg-green-500"
                          : ticket.status === "in_progress"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      )}
                    />
                    <span className="capitalize font-medium">
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">
                  Priority
                </span>
                <span
                  className={cn(
                    "inline-flex self-start px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                    ticket.priority === "high"
                      ? "bg-red-500/10 text-red-500"
                      : ticket.priority === "low"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-blue-500/10 text-blue-500"
                  )}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-4 text-lg">Labels</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {ticketLabels.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No labels assigned
                  </p>
                )}
                {ticketLabels.map((label) => (
                  <span
                    key={label.id}
                    className="flex items-center text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground font-medium group"
                    style={{ borderLeft: `3px solid ${label.color}` }}
                  >
                    {label.name}
                    <button
                      onClick={() => handleRemoveLabel(label.id)}
                      disabled={loading}
                      className="ml-2 text-muted-foreground hover:text-destructive transition-colors opacity-50 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <select
                  onChange={handleAddLabel}
                  disabled={loading || availableLabels.length === 0}
                  value=""
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input/50 bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    {availableLabels.length > 0
                      ? "Add label..."
                      : "No labels available"}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
