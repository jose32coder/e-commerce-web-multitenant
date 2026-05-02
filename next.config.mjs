/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permitir acceso desde móviles/IPs locales en desarrollo
  allowedDevOrigins: ["192.168.0.203", "10.2.0.2", "localhost:3000"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rrlmzbtlmrbuzlmphty.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
