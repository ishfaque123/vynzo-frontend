/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Router cache: revisiting a page within 5 minutes reuses its
    // payload instead of waiting on a fresh server round trip, so
    // back-and-forth navigation (Home <-> Profile) no longer flashes
    // the route loading skeleton on every tap.
    staleTimes: { dynamic: 300, static: 180 },
  },
};

module.exports = nextConfig;
