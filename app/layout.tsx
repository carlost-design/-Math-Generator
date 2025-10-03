import type { Metadata } from "next";
import { Montserrat, Merriweather, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";

const poppins = Montserrat({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-sans" });
const lora = Merriweather({ subsets: ["latin"], weight: ["300","400","700","900"], variable: "--font-serif" });
const fira = Source_Code_Pro({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: 'Math Problem Generator',
  description: 'AI-powered math problem generator for Primary 5 students',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${lora.variable} ${fira.variable} antialiased`}>
        <Providers>
          <SiteHeader />
          {children}
          <div className="h-16 md:hidden" />
          <div className="md:hidden">
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
