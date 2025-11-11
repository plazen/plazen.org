"use client";

import React, { useState, useEffect } from "react";
import { PlazenLogo } from "@/components/plazen-logo";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ReactMarkdown from "react-markdown";

type ReleaseNote = {
  id: string;
  version: string;
  topic: string;
  text: string;
  date: string;
};

const MarkdownStyles = () => (
  <style>
    {`
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
        margin-bottom: 1em;
      }
      .prose-custom ul, .prose-custom ol {
        line-height: 1.7;
        margin-left: 1.5rem;
        margin-bottom: 1em;
      }
      .prose-custom li {
        margin-bottom: 0.5em;
      }
      .prose-custom a {
        color: var(--color-primary);
        text-decoration: underline;
      }
      .prose-custom code {
        background-color: var(--color-input);
        padding: 0.2em 0.4em;
        border-radius: 6px;
        font-family: var(--font-geist-mono), monospace;
      }
      .prose-custom pre {
        background-color: var(--color-input);
        padding: 1em;
        border-radius: 8px;
        overflow-x: auto;
      }
      .prose-custom hr {
        border-color: var(--color-border);
        margin-top: 2em;
        margin-bottom: 2em;
      }
    `}
  </style>
);

export default function SingleReleaseNotePage({
  params,
}: {
  params: { id: string };
}) {
  const [note, setNote] = useState<ReleaseNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    const fetchNote = async () => {
      try {
        const res = await fetch(`/api/release-notes/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setNote(data);
        }
      } catch (error) {
        console.error("Failed to fetch release note", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [params.id]);

  return (
    <div className="font-lexend">
      <MarkdownStyles />
      <div className="bg-background text-gray-300 min-h-screen p-8 md:p-12 lg:p-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/schedule" className="flex items-center gap-3 mb-8 group">
            <PlazenLogo />
            <span className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
              Plazen
            </span>
          </Link>

          <article className="prose prose-invert prose-lg max-w-none prose-custom">
            {loading ? (
              <div className="py-20">
                <LoadingSpinner text="Loading note..." />
              </div>
            ) : note ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h1 className="text-4xl font-bold text-white !m-0">
                    {note.topic}
                  </h1>
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
                <hr />

                <ReactMarkdown>{note.text || ""}</ReactMarkdown>
              </>
            ) : (
              <p>Note not found.</p>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
