"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Trash2, Edit, Plus, X } from "lucide-react";

// Define the type based on your schema
type ReleaseNote = {
  text: string | null;
  id: string;
  topic: string | null;
  version: string | null;
  date: Date | null;
  created_at: Date;
  updated_at: Date | null;
};

export function ReleaseNotesManager() {
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [topic, setTopic] = useState("");
  const [version, setVersion] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/release-notes");
        if (response.ok) {
          const data = await response.json();
          setNotes(data);
        } else {
          setError("Failed to fetch release notes");
        }
      } catch {
        setError("Failed to fetch release notes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const clearForm = () => {
    setTopic("");
    setVersion("");
    setText("");
    setDate(new Date().toISOString().split("T")[0]);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const url = editingId
      ? `/api/admin/release-notes/${editingId}`
      : "/api/admin/release-notes";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, version, text, date }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save note");
      }

      const updatedNote = await res.json();

      if (editingId) {
        setNotes(notes.map((n) => (n.id === editingId ? updatedNote : n)));
      } else {
        setNotes([updatedNote, ...notes]);
      }
      clearForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (note: ReleaseNote) => {
    setEditingId(note.id);
    setTopic(note.topic || "");
    setVersion(note.version || "");
    setText(note.text || "");
    setDate(
      note.date
        ? new Date(note.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/release-notes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete note");
      }
      setNotes(notes.filter((n) => n.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin: Release Notes</h1>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-card p-6 rounded-xl border border-border mb-8 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Note" : "Create New Note"}
        </h2>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Topic (e.g., New Feature)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
          <Input
            placeholder="Version (e.g., v1.2.0)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            required
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <textarea
          placeholder="Release note text (Markdown is supported)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            {editingId ? "Update Note" : "Create Note"}
          </Button>
        </div>
      </form>

      {/* List of Notes */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-card p-4 rounded-xl border border-border flex justify-between items-start"
          >
            <div>
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                {note.version}
              </span>
              <h3 className="text-lg font-semibold mt-2">{note.topic}</h3>
              <p className="text-sm text-muted-foreground">
                {note.date ? new Date(note.date).toLocaleDateString() : "N/A"}
              </p>
              <p className="text-sm mt-2 whitespace-pre-wrap">{note.text}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEdit(note)}
                disabled={isLoading}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(note.id)}
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
