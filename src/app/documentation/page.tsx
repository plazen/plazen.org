import type { Metadata } from "next";
import DocumentationPage from "./DocumentationPage";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Find guides and information on how to use Plazen, the intelligent task scheduler that plans your day automatically.",
  alternates: {
    canonical: "/documentation",
  },
};

export default function Page() {
  return <DocumentationPage />;
}
