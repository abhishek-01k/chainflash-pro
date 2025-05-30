'use client';

import Link from "next/link"
import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Icons } from "@/components/icons"
import { useAccount } from 'wagmi'

export function SiteHeader() {
  const { isConnected } = useAccount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="py-2 px-4 flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block text-xl">
              {siteConfig.name}
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6">
            {isConnected && (
              <Link
                href="/dashboard"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/trading"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Trading
            </Link>
            <Link
              href="/portfolio"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Portfolio
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <ConnectButton chainStatus='icon' />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
