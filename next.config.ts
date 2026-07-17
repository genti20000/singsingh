import type { NextConfig } from 'next';
const nextConfig: NextConfig = { poweredByHeader: false, experimental: { serverActions: { bodySizeLimit: '26mb' } } };
export default nextConfig;
