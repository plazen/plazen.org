import type { Metadata } from "next";
import AccountPage from "./AccountPage";

export const metadata: Metadata = {
  title: "Account",
  description:
    "Manage your Plazen account settings, profile, and preferences.",
};

export default function Page() {
  return <AccountPage />;
}
