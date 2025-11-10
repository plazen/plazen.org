import type { Metadata } from "next";
import { Lexend, Geist_Mono } from "next/font/google"; // [MODIFIED]
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const lexend = Lexend({
  // [MODIFIED]
  variable: "--font-geist-sans", // We keep this variable name to match globals.css
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"], // Added weights to match your privacy page
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://plazen.org"),
  title: {
    default: "Plazen — Let your schedule build itself.",
    template: "%s | Plazen",
  },
  description:
    "Plazen is a modern, open-source task manager that intelligently plans your day for you.",
  keywords: [
    "Plazen",
    "task manager",
    "schedule",
    "planner",
    "to-do",
    "productivity",
    "time blocking",
  ],
  alternates: {
    canonical: "/",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    type: "website",
    url: "https://plazen.org",
    siteName: "Plazen",
    title: "Plazen — Let your schedule build itself.",
    description:
      "Add flexible to-dos and Plazen automatically finds the best time in your day.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Plazen app preview",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plazen — Let your schedule build itself.",
    description:
      "Add flexible to-dos and Plazen automatically finds the best time in your day.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "https://avatars.githubusercontent.com/u/226096442?s=200&v=4" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <link rel="me" href="https://fosstodon.org/@plazen" />
      <body
        className={`${lexend.variable} ${geistMono.variable} antialiased`} // [MODIFIED]
      >
        <ThemeProvider defaultTheme="dark" storageKey="plazen-theme">
          {children}

          <footer>
            <p className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Plazen. Protected under the{" "}
              <a
                className="underline underline-offset-3"
                href="https://github.com/plazen/plazen.org/blob/main/LICENSE"
              >
                MIT license
              </a>
              .
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
