import type { Metadata } from "next";
import ResetPasswordPage from "./ResetPasswordPage";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Plazen account.",
};

export default function Page() {
  return <ResetPasswordPage />;
}
