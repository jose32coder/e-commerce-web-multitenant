// src/app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { DEFAULT_SITE_HOSTNAME, DEFAULT_SITE_NAME } from "@/lib/siteConfig";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseDescription = "Piezas esenciales con estética atemporal.";

export async function generateMetadata() {
  const brand = DEFAULT_SITE_NAME;
  const hostname = DEFAULT_SITE_HOSTNAME.replace(/^https?:\/\//, "");
  const url = `https://${hostname}`;

  return {
    title: {
      default: `${brand} | Tu tienda de ecommerce`,
      template: `%s | ${brand}`,
    },
    description: baseDescription,
    openGraph: {
      type: "website",
      locale: "es_ES",
      url,
      siteName: brand,
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning={true} data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
