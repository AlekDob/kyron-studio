import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  env: {
    STUDIO_SERVER_URL: process.env.STUDIO_SERVER_URL ?? "http://localhost:8790",
    PAYLOAD_API_URL: process.env.PAYLOAD_API_URL ?? "https://kyronedu.it/api",
    KYRON_ADMIN_LOGIN_URL:
      process.env.KYRON_ADMIN_LOGIN_URL ?? "https://kyronedu.it/admin/login",
  },
};

export default nextConfig;
