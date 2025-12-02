import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : null;
const defaultSupabaseDomain = "bmaaavingiaelyvxaraj.supabase.co";

const imageDomains = [
  "avatars.githubusercontent.com",
  "lh3.googleusercontent.com",
  "i.pinimg.com",
  "storage.ko-fi.com",
  "ogtmbdatqgzxtmwqnvre.supabase.co",
];

if (supabaseDomain && !imageDomains.includes(supabaseDomain)) {
  imageDomains.push(supabaseDomain);
}

if (!imageDomains.includes(defaultSupabaseDomain)) {
  imageDomains.push(defaultSupabaseDomain);
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    domains: imageDomains,
  },
};

export default nextConfig;
