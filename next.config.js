/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Router cache: revisiting a page within 30s reuses its payload
    // instead of waiting on a fresh server round trip, so back-and-
    // forth navigation (Home <-> Profile) no longer flashes the
    // route loading skeleton on every tap.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

module.exports = nextConfig;
