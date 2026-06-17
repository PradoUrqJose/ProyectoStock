/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Le damos luz verde a archivos pesados del ERP
    },
  },
};

export default nextConfig;
