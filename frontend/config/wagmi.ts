import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, arbitrum, optimism, polygon, sepolia, arbitrumSepolia } from 'wagmi/chains';
import { http } from 'viem';

// Environment variables with fallbacks
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

if (!walletConnectProjectId) {
  throw new Error('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set');
}

// Chain configurations with RPC URLs
const chains = [
  {
    ...mainnet,
    rpcUrls: {
      default: { http: [`https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`] },
      public: { http: ['https://ethereum.publicnode.com'] },
    },
  },
  {
    ...arbitrum,
    rpcUrls: {
      default: { http: [`https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`] },
      public: { http: ['https://arbitrum-one.publicnode.com'] },
    },
  },
  {
    ...optimism,
    rpcUrls: {
      default: { http: [`https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`] },
      public: { http: ['https://optimism.publicnode.com'] },
    },
  },
  {
    ...polygon,
    rpcUrls: {
      default: { http: [`https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`] },
      public: { http: ['https://polygon.publicnode.com'] },
    },
  },
  // Testnets
  {
    ...sepolia,
    rpcUrls: {
      default: { http: [`https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`] },
      public: { http: ['https://ethereum-sepolia.publicnode.com'] },
    },
  },
  {
    ...arbitrumSepolia,
    rpcUrls: {
      default: { http: [`https://arb-sepolia.g.alchemy.com/v2/${alchemyApiKey}`] },
      public: { http: ['https://arbitrum-sepolia.publicnode.com'] },
    },
  },
] as const;

// Wagmi configuration
export const config = getDefaultConfig({
  appName: 'ChainFlash Pro',
  projectId: walletConnectProjectId,
  chains,
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
    [arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
    [optimism.id]: http(`https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
    [polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`),
    [arbitrumSepolia.id]: http(`https://arb-sepolia.g.alchemy.com/v2/${alchemyApiKey}`),
  },
  ssr: true, // Enable server-side rendering
});

// Chain-specific configurations for 1inch
export const ONEINCH_CHAIN_IDS = {
  ethereum: 1,
  arbitrum: 42161,
  optimism: 10,
  polygon: 137,
} as const;

// Pyth-supported chains
export const PYTH_SUPPORTED_CHAINS = [1, 42161, 10, 137] as const;

// Default tokens for each chain
export const DEFAULT_TOKENS = {
  [mainnet.id]: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      chainId: mainnet.id,
      logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
    },
    {
      address: '0xA0b86a33E6441d2b99A3f0D7c8d296F3D5a53a2E',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: mainnet.id,
      logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441d2b99a3f0d7c8d296f3d5a53a2e.png',
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: mainnet.id,
      logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      decimals: 8,
      chainId: mainnet.id,
      logoURI: 'https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png',
    },
  ],
  [arbitrum.id]: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      chainId: arbitrum.id,
      logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
    },
    {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: arbitrum.id,
      logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441d2b99a3f0d7c8d296f3d5a53a2e.png',
    },
  ],
  [optimism.id]: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      chainId: optimism.id,
      logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
    },
    {
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: optimism.id,
      logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441d2b99a3f0d7c8d296f3d5a53a2e.png',
    },
  ],
  [polygon.id]: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      chainId: polygon.id,
      logoURI: 'https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png',
    },
    {
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: polygon.id,
      logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441d2b99a3f0d7c8d296f3d5a53a2e.png',
    },
  ],
} as const; 