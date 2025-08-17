import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "spdw",
  description: "spdw - stats and numbers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t py-1 mt-2">
            <div className="content-area">
              <div className="flex justify-center items-center space-x-4 text-sm text-muted-foreground">
                <span>© spdw 2025</span>
                <Link href="/about" className="about-link">
                  About
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
