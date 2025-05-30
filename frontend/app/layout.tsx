import "./globals.css"
import { Metadata } from "next"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: {
    default: "ChainFlash Pro",
    template: `%s - ChainFlash Pro`,
  },
  description: "Cross-Chain State Channel Trading Platform - Instant settlements with Nitrolite, powered by 1inch and Pyth Network",
  keywords: ["DeFi", "Trading", "State Channels", "Cross-Chain", "1inch", "Pyth Network", "Nitrolite"],
  authors: [{ name: "ChainFlash Pro Team" }],
  creator: "ChainFlash Pro",
  publisher: "ChainFlash Pro",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chainflash.pro",
    siteName: "ChainFlash Pro",
    title: "ChainFlash Pro - Cross-Chain State Channel Trading",
    description: "Professional-grade cross-chain trading with instant settlements through state channels",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ChainFlash Pro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChainFlash Pro - Cross-Chain State Channel Trading",
    description: "Professional-grade cross-chain trading with instant settlements through state channels",
    images: ["/og-image.png"],
    creator: "@chainflashpro",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <Providers>
              <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1">
                  {children}
                </main>
              </div>
              <TailwindIndicator />
              <Toaster />
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
