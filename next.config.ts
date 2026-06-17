import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "run-agent-6a31510c1a06ff6df71a45bf-mqh8ff33.remote-agent.svc.cluster.local",
    "run-agent-6a32259df0687f83c5a0e394-mqhl3tfy-preview.agent-sandbox-bj-d3-gw.trae.cn",
    "127.0.0.1",
    "localhost",
  ],
};

export default nextConfig;
