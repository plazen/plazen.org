import type { Metadata } from "next";
import LoginPage from "./LoginPage";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Sign in to Plazen to access your smart schedule and task management.",
};

export default function Page() {
  return <LoginPage />;
}
