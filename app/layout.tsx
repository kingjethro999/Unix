import type { Metadata } from "next";
import {
  Crimson_Pro,
  EB_Garamond,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
  JetBrains_Mono,
  Libre_Baskerville,
  Lora,
  Merriweather,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
});
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
});
const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "UNIX - The Foundational Workspace for Modern Writers",
  description:
    "A modern, AI-powered collaborative writing workspace with real-time editing, context-aware AI assistance, and seamless team collaboration.",
};

import NextTopLoader from "nextjs-toploader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${ebGaramond.variable} ${lora.variable} ${merriweather.variable} ${libreBaskerville.variable} ${crimsonPro.variable} ${sourceSans.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased font-sans`}
      >
        <NextTopLoader color="#2563eb" showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
