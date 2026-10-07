import type { NextConfig } from "next";

// Dev-only opt-in: tunnel /api/erau/* to a remote deployment (e.g. over `ssh -L`) instead of
// this machine's local DB, so local UI code can run against live prod data. Unset in every
// real deployment, so this is always a no-op there. See README "Developing against live
// production data" for setup — while set, claim/fuel clicks hit the REAL remote database.
const remoteDevProxyUrl = process.env.REMOTE_DEV_PROXY_URL;

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon — must not be bundled by the Route Handler build.
  serverExternalPackages: ["better-sqlite3"],
  async rewrites() {
    if (!remoteDevProxyUrl) return [];
    return [{ source: "/api/erau/:path*", destination: `${remoteDevProxyUrl}/api/erau/:path*` }];
  },
};

export default nextConfig;
