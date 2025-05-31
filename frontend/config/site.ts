export const siteConfig = {
  name: "ChainFlash Pro",
  description: "Cross-Chain State Channel Trading Platform - Instant settlements with Nitrolite, powered by 1inch and Pyth Network",
  url: "https://chainflash.pro",
  ogImage: "/og-image.png",
  mainNav: [
    {
      title: "Home",
      href: "/",
      requiresWallet: false
    },
    {
      title: "Trading",
      href: "/trading",
      requiresWallet: true
    },
    {
      title: "Channels",
      href: "/channels",
      requiresWallet: false
    }
  ],
  links: {
    twitter: "https://twitter.com/chainflashpro",
    github: "https://github.com/chainflashpro",
  },
}

export type SiteConfig = typeof siteConfig;
