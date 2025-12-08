import type { Metadata } from "next";
import { Inter, Roboto, Open_Sans, Montserrat, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { SettingsProvider } from "@/lib/settings/context";
import { DynamicFavicon } from "@/components/dynamic-favicon";

// Load all available fonts
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  variable: "--font-roboto",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beech PPC AI",
  description: "Intelligent PPC management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <DynamicFavicon />
        </head>
        <body
          className={`${inter.variable} ${roboto.variable} ${openSans.variable} ${montserrat.variable} ${sourceSans.variable} antialiased`}
          style={{ fontFamily: 'var(--font-sans, var(--font-inter))' }}
        >
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
