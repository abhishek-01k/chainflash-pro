// Core Types
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export interface ChainInfo {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

// 1inch Types
export interface OneInchQuote {
  fromToken: Token;
  toToken: Token;
  fromTokenAmount: string;
  toTokenAmount: string;
  protocols: any[];
  estimatedGas: string;
  walletAddress: string;
  dstAmount: string;
}

export interface OneInchSwap extends OneInchQuote {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
}

export interface FusionOrder {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
}

export interface LimitOrder {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  predicate: string;
  permit: string;
  interaction: string;
}

// Pyth Network Types
export interface PythPriceFeed {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publishTime: number;
  };
  emaPrice: {
    price: string;
    conf: string;
    expo: number;
    publishTime: number;
  };
}

export interface PriceUpdate {
  id: string;
  price: number;
  confidence: number;
  publishTime: number;
  previousPrice?: number;
  change24h?: number;
  changePercentage24h?: number;
}

// Nitrolite State Channel Types
export interface StateChannel {
  channelId: string;
  participants: string[];
  challengePeriod: number;
  finalizesAt: number;
  state: ChannelState;
  outcome: Outcome[];
}

export interface ChannelState {
  turnNum: number;
  isFinal: boolean;
  channel: {
    chainId: string;
    participants: string[];
    challengeDuration: number;
    appDefinition: string;
    appData: string;
  };
  outcome: Outcome[];
  appData: string;
  challengeDuration: number;
}

export interface Outcome {
  asset: string;
  metadata: string;
  allocations: Allocation[];
}

export interface Allocation {
  destination: string;
  amount: string;
  allocationType: number;
  metadata: string;
}

// Trading Types
export interface TradeOrder {
  id: string;
  type: 'market' | 'limit' | 'fusion' | 'twap' | 'options';
  side: 'buy' | 'sell';
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  price?: string;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  timestamp: number;
  txHash?: string;
  channelId?: string; // For Nitrolite orders
}

export interface ArbitrageOpportunity {
  id: string;
  fromChain: ChainInfo;
  toChain: ChainInfo;
  token: Token;
  priceDifference: number;
  profitPercentage: number;
  estimatedProfit: string;
  timestamp: number;
}

// Portfolio Types
export interface Portfolio {
  totalValue: string;
  totalValueChange24h: string;
  totalValueChangePercentage24h: number;
  positions: Position[];
  orders: TradeOrder[];
}

export interface Position {
  token: Token;
  balance: string;
  value: string;
  change24h: string;
  changePercentage24h: number;
  chainId: number;
}

// UI State Types
export interface TradingState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  deadline: number;
  isLoading: boolean;
  error: string | null;
  quote: OneInchQuote | null;
  useStateChannel: boolean;
}

export interface PriceState {
  prices: Record<string, PriceUpdate>;
  isConnected: boolean;
  lastUpdate: number;
  error: string | null;
}

export interface ChannelState {
  channels: StateChannel[];
  activeChannel: StateChannel | null;
  isCreating: boolean;
  error: string | null;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'price_update' | 'order_update' | 'channel_update' | 'arbitrage_alert';
  data: any;
  timestamp: number;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Advanced Trading Types
export interface TWAPOrder {
  baseOrder: LimitOrder;
  totalAmount: string;
  numberOfTrades: number;
  timeInterval: number; // in seconds
  startTime: number;
  endTime: number;
  executedTrades: number;
  remainingAmount: string;
}

export interface OptionsOrder {
  baseOrder: LimitOrder;
  strikePrice: string;
  expirationTime: number;
  optionType: 'call' | 'put';
  premium: string;
  isExercised: boolean;
}

// Cross-chain Types
export interface CrossChainSwap {
  id: string;
  fromChain: ChainInfo;
  toChain: ChainInfo;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  escrowAddress: string;
  hashlock: string;
  timelock: number;
  status: 'pending' | 'locked' | 'completed' | 'refunded';
  createdAt: number;
  completedAt?: number;
}

// Bitcoin Integration Types
export interface BitcoinTransaction {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: string;
  confirmations: number;
}

export interface BitcoinEscrow {
  address: string;
  redeemScript: string;
  hashlock: string;
  timelock: number;
  amount: number;
  status: 'created' | 'funded' | 'claimed' | 'refunded';
}

// Hook Types
export interface UseTradeReturn {
  trade: (params: TradeParams) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  quote: OneInchQuote | null;
  getQuote: (params: QuoteParams) => Promise<OneInchQuote>;
}

export interface TradeParams {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  slippage: number;
  useStateChannel?: boolean;
}

export interface QuoteParams {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  protocols?: string[];
}

// Constants
export const SUPPORTED_CHAINS: Record<number, ChainInfo> = {
  1: {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  10: {
    id: 10,
    name: 'Optimism',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
  },
  137: {
    id: 137,
    name: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
};

// Pyth Price Feed IDs
export const PYTH_PRICE_FEEDS = {
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'USDC/USD': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT/USD': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca5ce25b84adede0919f5cdfb79',
}; 