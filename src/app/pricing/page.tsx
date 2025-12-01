import type { Metadata } from "next";
import PricingPage from "./PricingPage";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Plazen is free to use. Upgrade to Pro to support development and unlock power features like unlimited routine tasks and priority support.",
  alternates: {
    canonical: "/pricing",
  },
};

export default function Page() {
  return <PricingPage />;
}
