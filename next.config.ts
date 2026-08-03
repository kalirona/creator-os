import type { NextConfig } from "next";
import { execSync } from "child_process";

function bakeBuildInfo() {
  let commit: string | null = null;
  try {
    commit = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    commit = null;
  }
  return {
    APP_COMMIT: commit ?? "",
    APP_BUILT_AT: new Date().toISOString(),
  };
}

const buildInfo = bakeBuildInfo();

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
]

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  env: buildInfo,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
