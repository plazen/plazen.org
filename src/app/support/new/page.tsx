"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/support/tickets", {
      method: "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        message: formData.get("message"),
        priority: formData.get("priority"),
      }),
    });

    if (res.ok) router.push("/support");
    setLoading(false);
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <Link
        href="/support"
        className="text-sm text-muted-foreground hover:text-primary flex items-center mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to tickets
      </Link>

      <div className="bg-card border rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Ticket</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <Input
              name="title"
              required
              placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              name="priority"
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="low" className="bg-background">
                Low
              </option>
              <option value="normal" selected className="bg-background">
                Normal
              </option>
              <option value="high" className="bg-background">
                High
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              name="message"
              required
              className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe your issue in detail..."
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Submit Ticket"}
          </Button>
        </form>
      </div>
    </div>
  );
}
