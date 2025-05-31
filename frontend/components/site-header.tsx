'use client';

import Link from "next/link"
import { useAccount } from "wagmi"
import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export function SiteHeader() {
  const { isConnected } = useAccount()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-8 flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="hidden font-bold sm:inline-block">
            {siteConfig.name}
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {isConnected && (
              <nav className="flex items-center space-x-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href="/trading"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Trading
                </Link>
              </nav>
            )}
          </div>
          <nav className="flex items-center space-x-2">
            <ConnectButton chainStatus='icon' />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
