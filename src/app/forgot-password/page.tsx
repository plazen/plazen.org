import type { Metadata } from "next";
import ForgotPasswordPage from "./ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Plazen account password.",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
