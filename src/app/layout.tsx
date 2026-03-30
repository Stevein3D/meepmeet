import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel, Caudex, Alegreya } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import Footer from '@/components/Footer'
import BackToTopButton from '@/components/BackToTopButton'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const caudex = Caudex({
  variable: "--font-caudex",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const alegreya = Alegreya({
  variable: "--font-alegreya",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "MeepMeet",
  description: "Board game night planner",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${caudex.variable} ${alegreya.variable} antialiased`}
        >
          {children}
          <BackToTopButton />
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}