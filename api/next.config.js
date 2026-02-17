/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Critical for Docker deployment
  reactStrictMode: true,
};

module.exports = nextConfig;
