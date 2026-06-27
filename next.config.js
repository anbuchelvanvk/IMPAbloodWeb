/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['100.113.192.104'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "frame-src 'self' https://accounts.google.com https://*.google.com https://*.firebaseapp.com https://*.web.app https://apis.google.com",
              "object-src 'none'",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googleapis.com https://apis.google.com",
              "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.googleapis.com https://apis.google.com",
              "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.googleapis.com https://firebaseinstallations.googleapis.com https://content-firebaseappcheck.googleapis.com"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
