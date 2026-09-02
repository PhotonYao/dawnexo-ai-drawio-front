import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生成独立部署产物（.next/standalone），便于打进精简的 Docker 运行镜像
  output: "standalone",
};

export default nextConfig;
