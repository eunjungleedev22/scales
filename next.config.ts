import type { NextConfig } from "next";

/** Baseline security headers for every response. */
const securityHeaders = [
  // Don't allow the app to be embedded in other sites (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  // Don't let browsers guess content types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send the origin to other sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Always use HTTPS once visited
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Turn off powerful features the app doesn't use (microphone: own site only, for voice questions)
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
