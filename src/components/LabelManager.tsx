"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Plus, Trash2, Tag } from "lucide-react";

type Label = {
  id: string;
  name: string;
  color: string;
};

export function LabelManager() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#64748b");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchLabels = async () => {
    const res = await fetch("/api/support/labels");
    if (res.ok) {
      const data = await res.json();
      setLabels(data);
    }
  };

  useEffect(() => {
    if (isOpen) fetchLabels();
  }, [isOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    setLoading(true);
    await fetch("/api/support/labels", {
      method: "POST",
      body: JSON.stringify({ name: newLabel, color: newColor }),
    });
    setNewLabel("");
    await fetchLabels();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove this label from all tickets."))
      return;
    setLoading(true);
    await fetch(`/api/support/labels?id=${id}`, {
      method: "DELETE",
    });
    await fetchLabels();
    setLoading(false);
  };

  return (
    <div className="mb-8">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="mb-4"
      >
        <Tag className="mr-2 h-4 w-4" />
        {isOpen ? "Hide Labels" : "Manage Labels"}
      </Button>

      {isOpen && (
        <div className="bg-card border rounded-lg p-4 max-w-md animate-in slide-in-from-top-2">
          <h3 className="font-semibold mb-4">Manage Support Labels</h3>

          <form onSubmit={handleCreate} className="flex gap-2 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Label name (e.g., Bug)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                disabled={loading}
              />
            </div>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-10 w-10 rounded cursor-pointer bg-transparent"
              title="Label Color"
            />
            <Button type="submit" disabled={loading || !newLabel.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          <div className="space-y-2">
            {labels.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No labels created yet.
              </p>
            ) : (
              labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-2 bg-secondary/50 rounded-md group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm font-medium">{label.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(label.id)}
                    disabled={loading}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
