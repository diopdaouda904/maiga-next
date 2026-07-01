import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "Maïga Smash — Gestion des stocks",
  description: "Gestion de stock en temps réel pour Maïga Smash",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#e8962e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${plexMono.variable} h-full`}>
      <body className="min-h-full bg-bg text-txt font-sans antialiased">
        <div className="max-w-md mx-auto min-h-screen">{children}</div>
      </body>
    </html>
  );
}
