import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  // `env` key байхгүй бол process.env.API нь зөвхөн server дээр л (Node
  // process) харагдана — "use client" файлуудад build-time утга inline
  // хийгдэхгүй тул үргэлж undefined болж, hardcoded fallback руу унадаг байв.
  env: {
    API: process.env.API,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.zunailbar.mn",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    middlewareClientMaxBodySize: 50 * 1024 * 1024
  },
};

export default nextConfig;
