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
        className="text-sm text-muted-foreground hover:text-primary flex items-center mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to tickets
      </Link>

      <div className="bg-card rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Create New Ticket</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Subject
            </label>
            <Input
              name="title"
              required
              placeholder="Brief summary of the issue"
              className="bg-background border-input/50 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Priority
            </label>
            <div className="relative">
              <select
                name="priority"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input/50 bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="low">Low</option>
                <option value="normal" selected>
                  Normal
                </option>
                <option value="high">High</option>
              </select>
              {/* Custom chevron/arrow could go here if needed */}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Message
            </label>
            <textarea
              name="message"
              required
              className="flex min-h-[150px] w-full rounded-md border border-input/50 bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="Describe your issue in detail..."
            />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Submit Ticket"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
