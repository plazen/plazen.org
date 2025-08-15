import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plazen – Smart Daily Timetable & Task Scheduler",
  description:
    "Plazen helps you plan your day with a smart, visual timetable. Schedule, track, and complete your tasks with ease.",
  keywords: [
    "timetable",
    "daily planner",
    "task scheduler",
    "productivity",
    "calendar",
    "todo",
    "plazen",
    "task management",
    "organizer",
    "schedule app",
    "modern planner",
  ],
  authors: [{ name: "Plazen Team", url: "https://plazen.org/" }],
  openGraph: {
    title: "Plazen – Smart Daily Timetable & Task Scheduler",
    description:
      "Plan your day visually, schedule tasks, and boost productivity with Plazen.",
    url: "https://plazen.org/",
    siteName: "Plazen",
    images: [
      {
        url: "https://plazen.org/favicon.ico",
        width: 1200,
        height: 630,
        alt: "Plazen – Smart Daily Timetable & Task Scheduler",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plazen – Smart Daily Timetable & Task Scheduler",
    description:
      "Plan your day visually, schedule tasks, and boost productivity with Plazen.",
    images: ["https://plazen.org/favicon.ico"],
    creator: "@plazen@fosstodon.org",
  },
  metadataBase: new URL("https://plazen.org/"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="me" href="https://fosstodon.org/@plazen" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
