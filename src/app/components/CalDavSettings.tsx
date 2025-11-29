"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Check,
  Copy,
  Info,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Monitor,
} from "lucide-react";

interface CalDavSettingsProps {
  email: string;
}

export function CalDavSettings({ email }: CalDavSettingsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "ios" | "macos" | "android" | "thunderbird" | null
  >(null);

  // Dynamically determine URL if on client, otherwise fallback
  const serverUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/caldav`
      : "https://plazen.org/api/caldav";

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const InstructionHeader = ({
    id,
    title,
    icon: Icon,
  }: {
    id: "ios" | "macos" | "android" | "thunderbird";
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <button
      onClick={() => setActiveTab(activeTab === id ? null : id)}
      className="flex items-center w-full p-4 bg-muted/50 hover:bg-muted transition-colors rounded-lg mb-2 text-left border"
    >
      <Icon className="w-5 h-5 mr-3 text-muted-foreground" />
      <span className="font-medium flex-1 text-foreground">{title}</span>
      {activeTab === id ? (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6 bg-card rounded-xl border shadow-sm">
      <div>
        <h2 className="text-2xl font-bold mb-2 tracking-tight">
          Calendar Synchronization
        </h2>
        <p className="text-muted-foreground text-sm">
          Connect your Plazen tasks to Apple Calendar, Outlook, or any
          CalDAV-compatible app. Two-way sync allows you to view and edit tasks
          directly from your device.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start space-x-3 border border-blue-100 dark:border-blue-800">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Credentials Required</p>
            <p>
              Use your <strong>Plazen email</strong> and{" "}
              <strong>password</strong> to authenticate. If you signed up with
              Google/GitHub, please set a password in your account settings
              first.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Server Address
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={serverUrl}
                className="font-mono text-sm bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(serverUrl, "server")}
                title="Copy Server URL"
              >
                {copiedField === "server" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Username
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={email}
                className="font-mono text-sm bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(email, "username")}
                title="Copy Username"
              >
                {copiedField === "username" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <h3 className="font-semibold mb-4 text-lg">Setup Instructions</h3>

        {/* iOS */}
        <InstructionHeader
          id="ios"
          title="iPhone & iPad (iOS)"
          icon={Smartphone}
        />
        {activeTab === "ios" && (
          <div className="p-4 border border-t-0 rounded-b-lg mb-4 bg-muted/20 text-sm space-y-2 -mt-2 mx-1">
            <ol className="list-decimal list-inside space-y-2 ml-1 text-muted-foreground">
              <li>
                Open <strong>Settings</strong> and go to <strong>Apps</strong>{" "}
                {">"} <strong>Calendar</strong>.
              </li>
              <li>
                Tap <strong>Calendar Accounts</strong> {">"}{" "}
                <strong>Add Account</strong>.
              </li>
              <li>
                Select <strong>Other</strong> {">"}{" "}
                <strong>Add CalDAV Account</strong>.
              </li>
              <li>
                <strong>Server:</strong>{" "}
                <span className="font-mono text-xs bg-muted px-1 rounded select-all">
                  {serverUrl}
                </span>
              </li>
              <li>
                Enter your <strong>User Name</strong> and{" "}
                <strong>Password</strong>.
              </li>
              <li>
                Tap <strong>Next</strong>. Ensure &quot;Reminders&quot; is
                unchecked if prompted (only Calendars are supported).
              </li>
              <li>
                Tap <strong>Save</strong>. Your tasks will appear in the
                Calendar app.
              </li>
            </ol>
          </div>
        )}

        {/* macOS */}
        <InstructionHeader id="macos" title="Mac (macOS)" icon={Monitor} />
        {activeTab === "macos" && (
          <div className="p-4 border border-t-0 rounded-b-lg mb-4 bg-muted/20 text-sm space-y-2 -mt-2 mx-1">
            <ol className="list-decimal list-inside space-y-2 ml-1 text-muted-foreground">
              <li>
                Open <strong>System Settings</strong> and go to{" "}
                <strong>Internet Accounts</strong>.
              </li>
              <li>
                Click <strong>Add Account</strong> {">"}{" "}
                <strong>Add Other Account</strong>.
              </li>
              <li>
                Select <strong>CalDAV Account</strong>.
              </li>
              <li>
                Choose <strong>&quot;Advanced&quot;</strong> for Account Type.
              </li>
              <li>
                <strong>User Name:</strong> {email}
              </li>
              <li>
                <strong>Password:</strong> Your Plazen password.
              </li>
              <li>
                <strong>Server Address:</strong>{" "}
                <span className="select-all">plazen.org</span>
              </li>
              <li>
                <strong>Server Path:</strong>{" "}
                <span className="select-all">/api/caldav/</span>
              </li>
              <li>
                <strong>Port:</strong> 443 (Check &quot;Use SSL&quot;).
              </li>
              <li>
                Click <strong>Sign In</strong>.
              </li>
            </ol>
          </div>
        )}

        {/* Android */}
        <InstructionHeader
          id="android"
          title="Android (via DAVx5)"
          icon={Smartphone}
        />
        {activeTab === "android" && (
          <div className="p-4 border border-t-0 rounded-b-lg mb-4 bg-muted/20 text-sm space-y-2 -mt-2 mx-1">
            <ol className="list-decimal list-inside space-y-2 ml-1 text-muted-foreground">
              <li>
                Install <strong>DAVx5</strong> from the Play Store or F-Droid.
              </li>
              <li>
                Open DAVx5 and tap the <strong>+</strong> button (Add Account).
              </li>
              <li>
                Select <strong>&quot;Login with URL and user name&quot;</strong>
                .
              </li>
              <li>
                <strong>Base URL:</strong>{" "}
                <span className="font-mono text-xs bg-muted px-1 rounded select-all">
                  {serverUrl}
                </span>
              </li>
              <li>Enter your email and password.</li>
              <li>
                Tap <strong>Login</strong>.
              </li>
              <li>
                Create the account and select the &quot;Plazen Tasks&quot;
                calendar to sync.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
