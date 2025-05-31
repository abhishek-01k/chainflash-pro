'use client';

import { siteConfig } from "@/config/site"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { MainNav } from "./main-nav";

export function SiteHeader() {
  return (
    <header className=" dark:bg-gray-900 text-white sticky top-0 z-40 w-full border-b">
      <div className="px-4 flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end gap-2">
          <ConnectButton chainStatus='icon' />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
