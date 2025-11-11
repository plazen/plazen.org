import React from "react";
import { PlazenLogo } from "@/components/plazen-logo";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

type ReleaseNote = {
  id: string;
  version: string | null;
  topic: string | null;
  text: string | null;
  date: Date | null;
};

const MarkdownStyles = () => (
  <style>
    {`
      .font-lexend {
        font-family: 'Lexend', sans-serif;
      }
      .prose-custom h2, .prose-custom h3 {
        font-weight: 600;
        color: white;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
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
        text-decoration-offset: 2px;
      }
      .prose-custom a:hover {
        color: var(--color-primary-foreground);
        background: var(--color-primary);
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

export default async function SingleReleaseNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let note: ReleaseNote | null = null;
  try {
    note = await prisma.release_notes.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to fetch release note", error);
  }

  if (!note) {
    notFound();
  }

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
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-4xl font-bold text-white !m-0">
                {note.topic}
              </h1>
              <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full flex-shrink-0">
                {note.version}
              </span>
            </div>
            <p className="text-gray-400 !m-0">
              {note.date
                ? new Date(note.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "No date"}
            </p>
            <hr />

            {/* This is where the markdown is rendered */}
            <ReactMarkdown>{note.text || ""}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}
