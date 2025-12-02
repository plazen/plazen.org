import type { Metadata } from "next";
import ReleaseNotesPage from "./ReleaseNotesPage";

export const metadata: Metadata = {
  title: "Release Notes",
  description:
    "See what's new, what's fixed, and what's improved in Plazen. Stay up to date with our latest features and changes.",
  alternates: {
    canonical: "/release-notes",
  },
};

export default function Page() {
  return <ReleaseNotesPage />;
}
