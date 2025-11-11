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
          .font-lexend {
            font-family: 'Lexend', sans-serif;
          }
          .prose-custom h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: white;
            margin-top: 2em;
            margin-bottom: 1em;
            border-bottom: 1px solid var(--color-border);
            padding-bottom: 0.5em;
          }
          .prose-custom p {
            line-height: 1.7;
            white-space: pre-wrap;
          }
          .prose-custom .note-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5em;
          }
          .prose-custom .version-tag {
            font-size: 0.875rem;
            font-weight: 500;
            padding: 0.25em 0.75em;
            border-radius: 9999px;
            background-color: var(--color-primary-foreground);
            color: var(--color-primary);
            background-color: oklch(0.7 0.1 190 / 0.1);
            color: oklch(0.7 0.1 190);
          }
          .prose-custom .date {
            font-size: 0.875rem;
            color: var(--color-muted-foreground);
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

          <article className="prose prose-invert prose-lg max-w-none prose-custom">
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
              <section>
                {notes.map((note) => (
                  <div key={note.id} className="mb-10">
                    <div className="note-header">
                      <h2 className="!m-0 !border-0 !p-0">{note.topic}</h2>
                      <span className="version-tag">{note.version}</span>
                    </div>
                    <p className="date !m-0">
                      {new Date(note.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="mt-4">{note.text}</p>
                  </div>
                ))}
              </section>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
