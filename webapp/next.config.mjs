/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // Erlaube große Foto-Uploads (z.B. Handyfotos) für Server Actions
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
