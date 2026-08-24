import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Pin the workspace root — without this, dev-server root inference can pick a
  // parent directory and CSS/module resolution breaks (Can't resolve 'tailwindcss')
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async headers() {
    // One CSP, with only the framing directives varying by route. Written as a
    // function so a route that needs different framing does not quietly lose
    // every other protection along with it.
    const csp = (frameAncestors: string) => [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https:",
      // The site editor previews a collector's real page in an iframe, so the
      // dashboard has to be allowed to embed one. Same origin only.
      "frame-src 'self'",
      `frame-ancestors ${frameAncestors}`,
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: csp("'none'") },
        ],
      },
      {
        // A collection page is framed by the site editor's preview, and only
        // ever from this origin. Everything else stays as it was.
        source: '/museum/:slug',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: csp("'self'") },
        ],
      },
      {
        // Allow embed pages to be iframed from anywhere
        source: '/museum/:slug/embed',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: csp('*') },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
