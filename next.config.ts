import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : null;
const defaultSupabaseDomain = "bmaaavingiaelyvxaraj.supabase.co";

const imageHostnames = [
  "avatars.githubusercontent.com",
  "lh3.googleusercontent.com",
  "i.pinimg.com",
  "storage.ko-fi.com",
  "ogtmbdatqgzxtmwqnvre.supabase.co",
];

if (supabaseDomain && !imageHostnames.includes(supabaseDomain)) {
  imageHostnames.push(supabaseDomain);
}

if (!imageHostnames.includes(defaultSupabaseDomain)) {
  imageHostnames.push(defaultSupabaseDomain);
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: imageHostnames.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/**",
    })),
  },
};

export default nextConfig;
