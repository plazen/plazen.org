"use client";

import React, { useState, useEffect } from "react";
import { PlazenLogo } from "@/components/plazen-logo";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";

type ReleaseNote = {
  id: string;
  version: string;
  topic: string;
  text: string;
  date: string;
};

export default function ReleaseNotesPage() {
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch("/api/release-notes");
        if (res.ok) {
          const data = await res.json();
          setNotes(data);
        }
      } catch (error) {
        console.error("Failed to fetch release notes", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  return (
    <div className="font-lexend">
      <style>
        {`
          .note-item:hover h2 {
            color: var(--color-primary);
          }
        `}
      </style>
      <div className="bg-background text-gray-300 min-h-screen p-8 md:p-12 lg:p-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/schedule" className="flex items-center gap-3 mb-8 group">
            <PlazenLogo />
            <span className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
              Plazen
            </span>
          </Link>

          <article className="prose prose-invert prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-white mb-6">
              Release Notes
            </h1>
            <p className="text-gray-400">
              See what&apos;s new, what&apos;s fixed, and what&apos;s improved
              in Plazen.
            </p>

            {loading ? (
              <div className="py-20">
                <LoadingSpinner text="Loading notes..." />
              </div>
            ) : (
              <section className="space-y-8 mt-12 not-prose">
                {notes.map((note) => (
                  <Link
                    href={`/release-notes/${note.id}`}
                    key={note.id}
                    className="block no-underline note-item group"
                  >
                    <div className="p-6 border border-border rounded-xl transition-all duration-200 hover:border-primary/50 hover:shadow-lg bg-card/50 hover:bg-card">
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-semibold text-white !m-0 !p-0 !border-0 transition-colors duration-200">
                          {note.topic}
                        </h2>
                        <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full flex-shrink-0">
                          {note.version}
                        </span>
                      </div>
                      <p className="text-gray-400 !m-0">
                        {new Date(note.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </section>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
