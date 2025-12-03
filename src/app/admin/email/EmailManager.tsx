"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import {
  Send,
  Inbox,
  Mail,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Paperclip,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Code,
  Quote,
  Heading1,
  Heading2,
  MailOpen,
  AlertCircle,
  Reply,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// Types
interface AllowedSender {
  email: string;
  name: string;
}

interface EmailConfig {
  smtp: {
    configured: boolean;
    host: string | null;
    port: string;
    secure: boolean;
    from: {
      name: string;
      email: string | null;
    };
    allowedSenders: AllowedSender[];
  };
  imap: {
    configured: boolean;
    host: string | null;
    port: string;
    secure: boolean;
  };
}

interface EmailAddress {
  name: string;
  email: string;
}

interface EmailEnvelope {
  date: string;
  subject: string;
  from: EmailAddress[];
  to: EmailAddress[];
  cc?: EmailAddress[];
  messageId: string;
}

interface EmailHeader {
  uid: number;
  flags: string[];
  envelope: EmailEnvelope;
  size: number;
}

interface EmailBody {
  uid: number;
  text?: string;
  html?: string;
  headers: Record<string, string>;
}

interface Mailbox {
  name: string;
  exists: number;
  recent: number;
  unseen: number;
}

type Tab = "compose" | "inbox" | "settings";

export function EmailManager() {
  // State
  const [activeTab, setActiveTab] = useState<Tab>("compose");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Config state
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<{
    smtp?: { success: boolean; error?: string };
    imap?: { success: boolean; error?: string };
  } | null>(null);

  // Compose state
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [composeReplyTo, setComposeReplyTo] = useState("");
  const [composeFrom, setComposeFrom] = useState("");
  const [composeInReplyTo, setComposeInReplyTo] = useState("");
  const [composeReferences, setComposeReferences] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [isReply, setIsReply] = useState(false);

  // Inbox state
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState("INBOX");
  const [emails, setEmails] = useState<EmailHeader[]>([]);
  const [totalEmails, setTotalEmails] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(20);
  const [selectedEmail, setSelectedEmail] = useState<EmailHeader | null>(null);
  const [emailBody, setEmailBody] = useState<EmailBody | null>(null);
  const [loadingBody, setLoadingBody] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);

  // Fetch config on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/admin/email");
      if (response.ok) {
        const data = await response.json();
        // Set default from address if not already set
        if (data.smtp?.allowedSenders?.length > 0 && !composeFrom) {
          setComposeFrom(data.smtp.allowedSenders[0].email);
        }
        setConfig(data);
      } else {
        const err = await response.json();
        setError(err.error || "Failed to fetch email configuration");
      }
    } catch {
      setError("Failed to fetch email configuration");
    } finally {
      setLoading(false);
    }
  };

  const verifyConfiguration = async (type: "smtp" | "imap" | "both") => {
    setVerifying(true);
    setVerificationResults(null);
    try {
      const response = await fetch("/api/admin/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await response.json();
      setVerificationResults(data.results);
      if (data.success) {
        setSuccess("Email configuration verified successfully!");
      }
    } catch {
      setError("Failed to verify email configuration");
    } finally {
      setVerifying(false);
    }
  };

  const fetchMailboxes = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/email/mailboxes");
      if (response.ok) {
        const data = await response.json();
        setMailboxes(data.mailboxes || []);
      }
    } catch {
      console.error("Failed to fetch mailboxes");
    }
  }, []);

  const fetchEmails = useCallback(async () => {
    setLoadingEmails(true);
    try {
      const response = await fetch(
        `/api/admin/email/inbox?mailbox=${encodeURIComponent(selectedMailbox)}&page=${currentPage}&perPage=${perPage}`,
      );
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
        setTotalEmails(data.total || 0);
      } else {
        const err = await response.json();
        setError(err.error || "Failed to fetch emails");
      }
    } catch {
      setError("Failed to fetch emails");
    } finally {
      setLoadingEmails(false);
    }
  }, [selectedMailbox, currentPage, perPage]);

  // Fetch mailboxes and emails when inbox tab is active
  useEffect(() => {
    if (activeTab === "inbox" && config?.imap.configured) {
      fetchMailboxes();
      fetchEmails();
    }
  }, [activeTab, config?.imap.configured, fetchMailboxes, fetchEmails]);

  const fetchEmailBody = async (uid: number) => {
    setLoadingBody(true);
    setEmailBody(null);
    try {
      const response = await fetch(
        `/api/admin/email/inbox/${uid}?mailbox=${encodeURIComponent(selectedMailbox)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setEmailBody(data);
      } else {
        const err = await response.json();
        setError(err.error || "Failed to fetch email body");
      }
    } catch {
      setError("Failed to fetch email body");
    } finally {
      setLoadingBody(false);
    }
  };

  const markAsRead = async (uid: number) => {
    try {
      await fetch(`/api/admin/email/inbox/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", mailbox: selectedMailbox }),
      });
      // Update local state
      setEmails((prev) =>
        prev.map((e) =>
          e.uid === uid ? { ...e, flags: [...e.flags, "\\Seen"] } : e,
        ),
      );
    } catch {
      console.error("Failed to mark as read");
    }
  };

  const markAsUnread = async (uid: number) => {
    try {
      await fetch(`/api/admin/email/inbox/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unread", mailbox: selectedMailbox }),
      });
      // Update local state
      setEmails((prev) =>
        prev.map((e) =>
          e.uid === uid
            ? { ...e, flags: e.flags.filter((f) => f !== "\\Seen") }
            : e,
        ),
      );
    } catch {
      console.error("Failed to mark as unread");
    }
  };

  const deleteEmail = async (uid: number) => {
    if (!confirm("Are you sure you want to delete this email?")) return;
    try {
      await fetch(
        `/api/admin/email/inbox/${uid}?mailbox=${encodeURIComponent(selectedMailbox)}`,
        { method: "DELETE" },
      );
      setEmails((prev) => prev.filter((e) => e.uid !== uid));
      if (selectedEmail?.uid === uid) {
        setSelectedEmail(null);
        setEmailBody(null);
      }
      setSuccess("Email deleted successfully");
    } catch {
      setError("Failed to delete email");
    }
  };

  const sendEmail = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      setError("Recipient and subject are required");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo.split(",").map((e) => e.trim()),
          cc: composeCc ? composeCc.split(",").map((e) => e.trim()) : undefined,
          bcc: composeBcc
            ? composeBcc.split(",").map((e) => e.trim())
            : undefined,
          subject: composeSubject,
          content: composeContent,
          contentType: "markdown",
          replyTo: composeReplyTo || undefined,
          from: composeFrom || undefined,
          inReplyTo: composeInReplyTo || undefined,
          references: composeReferences || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Email sent successfully! Message ID: ${data.messageId}`);
        // Clear form
        setComposeTo("");
        setComposeCc("");
        setComposeBcc("");
        setComposeSubject("");
        setComposeContent("");
        setComposeReplyTo("");
        setComposeInReplyTo("");
        setComposeReferences("");
        setIsReply(false);
        setShowCcBcc(false);
      } else {
        const err = await response.json();
        setError(err.error || "Failed to send email");
      }
    } catch {
      setError("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleReply = (email: EmailHeader) => {
    // Set the To field to the sender of the email
    const sender = email.envelope.from[0];
    setComposeTo(sender?.email || "");

    // Set subject with Re: prefix if not already present
    const subject = email.envelope.subject || "";
    setComposeSubject(subject.startsWith("Re:") ? subject : `Re: ${subject}`);

    // Set threading headers for proper email threading
    const originalMessageId = email.envelope.messageId;
    if (originalMessageId) {
      setComposeInReplyTo(originalMessageId);
      setComposeReferences(originalMessageId);
    }

    // Start with empty content
    setComposeContent("");

    // Mark as reply
    setIsReply(true);

    // Switch to compose tab
    setActiveTab("compose");
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById(
      "compose-content",
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = composeContent;
    const selectedText = text.substring(start, end);

    const newText =
      text.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      text.substring(end);
    setComposeContent(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + selectedText.length;
    }, 0);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatAddress = (addr: EmailAddress) => {
    if (addr.name) {
      return `${addr.name} <${addr.email}>`;
    }
    return addr.email;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isRead = (email: EmailHeader) => {
    return email.flags.includes("\\Seen");
  };

  // Clear messages after a delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <LoadingSpinner
          size="lg"
          text="Loading email settings..."
          variant="dots"
        />
      </div>
    );
  }

  const totalPages = Math.ceil(totalEmails / perPage);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin: Email Manager</h1>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4">
        <Button
          variant={activeTab === "compose" ? "default" : "outline"}
          onClick={() => setActiveTab("compose")}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Compose
        </Button>
        <Button
          variant={activeTab === "inbox" ? "default" : "outline"}
          onClick={() => setActiveTab("inbox")}
          className="gap-2"
          disabled={!config?.imap.configured}
        >
          <Inbox className="w-4 h-4" />
          Inbox
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "outline"}
          onClick={() => setActiveTab("settings")}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Compose Tab */}
      {activeTab === "compose" && (
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {isReply ? "Reply to Email" : "Compose Email"}
            </h2>
            {isReply && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsReply(false);
                  setComposeTo("");
                  setComposeSubject("");
                  setComposeContent("");
                  setComposeInReplyTo("");
                  setComposeReferences("");
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel Reply
              </Button>
            )}
          </div>

          {!config?.smtp.configured && (
            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500">
              SMTP is not configured. Please set up SMTP environment variables
              to send emails.
            </div>
          )}

          <div className="space-y-4">
            {/* From Field */}
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                From
              </label>
              <select
                value={composeFrom}
                onChange={(e) => setComposeFrom(e.target.value)}
                disabled={!config?.smtp.configured}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {config?.smtp.allowedSenders?.map((sender) => (
                  <option key={sender.email} value={sender.email}>
                    {sender.name} &lt;{sender.email}&gt;
                  </option>
                ))}
              </select>
            </div>

            {/* To Field */}
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                To (comma-separated for multiple recipients)
              </label>
              <Input
                type="text"
                placeholder="recipient@example.com"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                disabled={!config?.smtp.configured}
              />
            </div>

            {/* CC/BCC Toggle */}
            <button
              type="button"
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-sm text-primary hover:underline"
            >
              {showCcBcc ? "Hide" : "Show"} Cc/Bcc
            </button>

            {/* CC/BCC Fields */}
            {showCcBcc && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">
                    Cc
                  </label>
                  <Input
                    type="text"
                    placeholder="cc@example.com"
                    value={composeCc}
                    onChange={(e) => setComposeCc(e.target.value)}
                    disabled={!config?.smtp.configured}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">
                    Bcc
                  </label>
                  <Input
                    type="text"
                    placeholder="bcc@example.com"
                    value={composeBcc}
                    onChange={(e) => setComposeBcc(e.target.value)}
                    disabled={!config?.smtp.configured}
                  />
                </div>
              </>
            )}

            {/* Reply-To */}
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                Reply-To (optional)
              </label>
              <Input
                type="text"
                placeholder="replyto@example.com"
                value={composeReplyTo}
                onChange={(e) => setComposeReplyTo(e.target.value)}
                disabled={!config?.smtp.configured}
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                Subject
              </label>
              <Input
                type="text"
                placeholder="Email subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                disabled={!config?.smtp.configured}
              />
            </div>

            {/* Content with Markdown Toolbar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-muted-foreground">
                  Content (Markdown supported)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="w-4 h-4" /> Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" /> Show Preview
                    </>
                  )}
                </button>
              </div>

              {/* Markdown Toolbar */}
              <div className="flex flex-wrap gap-1 mb-2 p-2 bg-muted/30 rounded-t-md border border-b-0 border-input">
                <button
                  type="button"
                  onClick={() => insertMarkdown("# ", "")}
                  className="p-1.5 hover:bg-muted rounded"
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("## ", "")}
                  className="p-1.5 hover:bg-muted rounded"
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <div className="w-px bg-border mx-1" />
                <button
                  type="button"
                  onClick={() => insertMarkdown("**", "**")}
                  className="p-1.5 hover:bg-muted rounded"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("*", "*")}
                  className="p-1.5 hover:bg-muted rounded"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <div className="w-px bg-border mx-1" />
                <button
                  type="button"
                  onClick={() => insertMarkdown("[", "](url)")}
                  className="p-1.5 hover:bg-muted rounded"
                  title="Link"
                >
                  <Link className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("`", "`")}
                  className="p-1.5 hover:bg-muted rounded"
                  title="Inline Code"
                >
                  <Code className="w-4 h-4" />
                </button>
                <div className="w-px bg-border mx-1" />
                <button
                  type="button"
                  onClick={() => insertMarkdown("- ", "")}
                  className="p-1.5 hover:bg-muted rounded"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("1. ", "")}
                  className="p-1.5 hover:bg-muted rounded"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("> ", "")}
                  className="p-1.5 hover:bg-muted rounded"
                  title="Quote"
                >
                  <Quote className="w-4 h-4" />
                </button>
              </div>

              <div className={showPreview ? "grid grid-cols-2 gap-4" : ""}>
                <textarea
                  id="compose-content"
                  placeholder="Write your email content here using Markdown..."
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  disabled={!config?.smtp.configured}
                  className="w-full min-h-[300px] rounded-md rounded-t-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                />

                {showPreview && (
                  <div className="min-h-[300px] rounded-md border border-input bg-muted/20 px-4 py-3 prose prose-invert prose-sm max-w-none overflow-auto">
                    <ReactMarkdown>
                      {composeContent || "*No content yet*"}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <div className="flex gap-2">
                <Button variant="outline" disabled className="gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attach File
                </Button>
              </div>
              <Button
                onClick={sendEmail}
                disabled={!config?.smtp.configured || sending}
                className="gap-2"
              >
                {sending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inbox Tab */}
      {activeTab === "inbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1 bg-card rounded-xl border border-border overflow-hidden">
            {/* Mailbox Selector and Refresh */}
            <div className="p-4 border-b border-border flex items-center gap-2">
              <select
                value={selectedMailbox}
                onChange={(e) => {
                  setSelectedMailbox(e.target.value);
                  setCurrentPage(1);
                  setSelectedEmail(null);
                  setEmailBody(null);
                }}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {mailboxes.length > 0 ? (
                  mailboxes.map((mb) => (
                    <option key={mb.name} value={mb.name}>
                      {mb.name} ({mb.exists})
                    </option>
                  ))
                ) : (
                  <option value="INBOX">INBOX</option>
                )}
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchEmails}
                disabled={loadingEmails}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingEmails ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            {/* Email List */}
            <div className="max-h-[600px] overflow-y-auto">
              {loadingEmails ? (
                <div className="p-8 text-center">
                  <LoadingSpinner
                    size="md"
                    text="Loading emails..."
                    variant="dots"
                  />
                </div>
              ) : emails.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No emails found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {emails.map((email) => (
                    <button
                      key={email.uid}
                      onClick={() => {
                        setSelectedEmail(email);
                        fetchEmailBody(email.uid);
                        if (!isRead(email)) {
                          markAsRead(email.uid);
                        }
                      }}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedEmail?.uid === email.uid ? "bg-muted/70" : ""
                      } ${!isRead(email) ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        {!isRead(email) ? (
                          <Mail className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        ) : (
                          <MailOpen className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span
                              className={`text-sm truncate ${
                                !isRead(email) ? "font-semibold" : ""
                              }`}
                            >
                              {email.envelope.from[0]?.name ||
                                email.envelope.from[0]?.email ||
                                "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(email.envelope.date)}
                            </span>
                          </div>
                          <p
                            className={`text-sm truncate ${
                              !isRead(email)
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {email.envelope.subject || "(No Subject)"}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatSize(email.size)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Email View */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
            {selectedEmail ? (
              <>
                {/* Email Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-2">
                        {selectedEmail.envelope.subject || "(No Subject)"}
                      </h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <span className="font-medium">From:</span>{" "}
                          {selectedEmail.envelope.from
                            .map(formatAddress)
                            .join(", ")}
                        </p>
                        <p>
                          <span className="font-medium">To:</span>{" "}
                          {selectedEmail.envelope.to
                            .map(formatAddress)
                            .join(", ")}
                        </p>
                        {selectedEmail.envelope.cc && (
                          <p>
                            <span className="font-medium">Cc:</span>{" "}
                            {selectedEmail.envelope.cc
                              .map(formatAddress)
                              .join(", ")}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Date:</span>{" "}
                          {new Date(
                            selectedEmail.envelope.date,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {isRead(selectedEmail) ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => markAsUnread(selectedEmail.uid)}
                          title="Mark as unread"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => markAsRead(selectedEmail.uid)}
                          title="Mark as read"
                        >
                          <MailOpen className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleReply(selectedEmail)}
                        title="Reply"
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteEmail(selectedEmail.uid)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-4 max-h-[500px] overflow-auto">
                  {loadingBody ? (
                    <div className="p-8 text-center">
                      <LoadingSpinner
                        size="md"
                        text="Loading email content..."
                        variant="dots"
                      />
                    </div>
                  ) : emailBody ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      {emailBody.html ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: emailBody.html }}
                          className="email-body-html"
                        />
                      ) : emailBody.text ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {emailBody.text}
                        </pre>
                      ) : (
                        <p className="text-muted-foreground italic">
                          No content available
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Failed to load email content
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground h-full flex items-center justify-center flex-col">
                <Mail className="w-16 h-16 mb-4 opacity-30" />
                <p>Select an email to view</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* SMTP Configuration */}
          <div className="bg-card p-6 rounded-xl border border-border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              SMTP Configuration (Sending)
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {config?.smtp.configured ? (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="w-4 h-4" />
                    Not Configured
                  </span>
                )}
              </div>

              {config?.smtp.configured && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground">Host</span>
                    <p className="text-sm font-mono">{config.smtp.host}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Port</span>
                    <p className="text-sm font-mono">{config.smtp.port}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Secure
                    </span>
                    <p className="text-sm">
                      {config.smtp.secure ? "Yes (TLS)" : "No (STARTTLS)"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">From</span>
                    <p className="text-sm font-mono">
                      {config.smtp.from.name} &lt;{config.smtp.from.email}&gt;
                    </p>
                  </div>
                </div>
              )}

              {verificationResults?.smtp && (
                <div
                  className={`p-3 rounded-lg ${
                    verificationResults.smtp.success
                      ? "bg-green-500/10 text-green-500"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {verificationResults.smtp.success
                    ? "SMTP connection verified successfully!"
                    : `SMTP verification failed: ${verificationResults.smtp.error}`}
                </div>
              )}

              {!config?.smtp.configured && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Set the following environment variables to enable SMTP:
                  </p>
                  <code className="block text-xs bg-background p-3 rounded font-mono">
                    SMTP_HOST=smtp.example.com
                    <br />
                    SMTP_PORT=587
                    <br />
                    SMTP_SECURE=false
                    <br />
                    SMTP_USER=your-email@example.com
                    <br />
                    SMTP_PASS=your-password
                    <br />
                    SMTP_FROM_NAME=Plazen
                    <br />
                    SMTP_FROM_EMAIL=noreply@plazen.org
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* IMAP Configuration */}
          <div className="bg-card p-6 rounded-xl border border-border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Inbox className="w-5 h-5" />
              IMAP Configuration (Receiving)
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {config?.imap.configured ? (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="w-4 h-4" />
                    Not Configured
                  </span>
                )}
              </div>

              {config?.imap.configured && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <span className="text-xs text-muted-foreground">Host</span>
                    <p className="text-sm font-mono">{config.imap.host}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Port</span>
                    <p className="text-sm font-mono">{config.imap.port}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Secure
                    </span>
                    <p className="text-sm">
                      {config.imap.secure ? "Yes (TLS)" : "No"}
                    </p>
                  </div>
                </div>
              )}

              {verificationResults?.imap && (
                <div
                  className={`p-3 rounded-lg ${
                    verificationResults.imap.success
                      ? "bg-green-500/10 text-green-500"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {verificationResults.imap.success
                    ? "IMAP connection verified successfully!"
                    : `IMAP verification failed: ${verificationResults.imap.error}`}
                </div>
              )}

              {!config?.imap.configured && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Set the following environment variables to enable IMAP:
                  </p>
                  <code className="block text-xs bg-background p-3 rounded font-mono">
                    IMAP_HOST=imap.example.com
                    <br />
                    IMAP_PORT=993
                    <br />
                    IMAP_SECURE=true
                    <br />
                    IMAP_USER=your-email@example.com
                    <br />
                    IMAP_PASS=your-password
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: If not set, IMAP will use SMTP credentials by default.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Verify Configuration */}
          <div className="bg-card p-6 rounded-xl border border-border">
            <h2 className="text-xl font-semibold mb-4">Verify Configuration</h2>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => verifyConfiguration("smtp")}
                disabled={verifying || !config?.smtp.configured}
                className="gap-2"
              >
                {verifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Test SMTP
              </Button>
              <Button
                onClick={() => verifyConfiguration("imap")}
                disabled={verifying || !config?.imap.configured}
                variant="outline"
                className="gap-2"
              >
                {verifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Test IMAP
              </Button>
              <Button
                onClick={() => verifyConfiguration("both")}
                disabled={
                  verifying ||
                  (!config?.smtp.configured && !config?.imap.configured)
                }
                variant="secondary"
                className="gap-2"
              >
                {verifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Test Both
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
