import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon — must not be bundled by the Route Handler build.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
