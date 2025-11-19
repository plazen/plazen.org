"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Trash2, Edit, Plus, X } from "lucide-react";

type DocEntry = {
  id: string;
  topic: string | null;
  text: string | null;
  category: string | null;
  created_at: Date;
  updated_at: Date | null;
};

export function DocumentationManager() {
  const [entries, setEntries] = useState<DocEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/documentation");
        if (response.ok) {
          const data = await response.json();
          setEntries(data);
        } else {
          setError("Failed to fetch documentation entries");
        }
      } catch (error) {
        setError("Failed to fetch documentation entries");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const clearForm = () => {
    setTopic("");
    setCategory("");
    setText("");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const url = editingId
      ? `/api/admin/documentation/${editingId}`
      : "/api/admin/documentation";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, text, category, updated_at: new Date() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save entry");
      }

      const updatedEntry = await res.json();

      if (editingId) {
        setEntries(entries.map((n) => (n.id === editingId ? updatedEntry : n)));
      } else {
        setEntries([updatedEntry, ...entries]);
      }
      clearForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (entry: DocEntry) => {
    setEditingId(entry.id);
    setTopic(entry.topic || "");
    setCategory(entry.category || "");
    setText(entry.text || "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/documentation/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete entry");
      }
      setEntries(entries.filter((n) => n.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin: Documentation</h1>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-card p-6 rounded-xl border border-border mb-8 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Entry" : "Create New Entry"}
        </h2>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Topic (e.g., Getting Started)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
          <Input
            placeholder="Category (e.g., Guides)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <textarea
          placeholder="Documentation text (Markdown is supported)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          className="w-full min-h-[250px] rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="flex justify-end gap-3">
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Edit
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            <Plus className="w-4 h-4 mr-2" />
            {editingId ? "Update Entry" : "Create Entry"}
          </Button>
        </div>
      </form>

      {/* List of Entries */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-card p-4 rounded-xl border border-border flex justify-between items-start"
          >
            <div>
              {entry.category && (
                <span className="text-xs px-2 py-0.5 bg-secondary/80 text-secondary-foreground rounded-full font-medium">
                  {entry.category}
                </span>
              )}
              <h3 className="text-lg font-semibold mt-2">{entry.topic}</h3>
              <p className="text-sm text-muted-foreground">
                Updated{" "}
                {new Date(
                  entry.updated_at || entry.created_at
                ).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEdit(entry)}
                disabled={isLoading}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(entry.id)}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
