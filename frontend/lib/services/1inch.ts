import { ethers } from 'ethers';
import type {
  OneInchQuote,
  OneInchSwap,
  FusionOrder,
  LimitOrder,
  Token,
  TWAPOrder,
  OptionsOrder,
  CrossChainSwap,
  BitcoinEscrow,
  ChainInfo
} from '../../types';

/**
 * Production-ready 1inch Service
 * Uses internal API routes for all 1inch API calls
 * Based on official 1inch API v6.0 documentation
 */

// Supported chain IDs for 1inch (mainnet only as per documentation)
export const SUPPORTED_CHAIN_IDS = {
  ETHEREUM: 1,
  BSC: 56,
  POLYGON: 137,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  GNOSIS: 100,
  AVALANCHE: 43114,
  FANTOM: 250,
  KLAYTN: 8217,
  AURORA: 1313161554,
  BASE: 8453,
} as const;

export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[keyof typeof SUPPORTED_CHAIN_IDS];

// Response interfaces based on 1inch API documentation
export interface OneInchTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

export interface OneInchQuoteResponse {
  fromToken: OneInchTokenInfo;
  toToken: OneInchTokenInfo;
  fromTokenAmount: string;
  toTokenAmount: string;
  protocols?: any[];
  estimatedGas: string;
  gasPrice?: string;
}

export interface OneInchSwapResponse {
  fromToken: OneInchTokenInfo;
  toToken: OneInchTokenInfo;
  fromTokenAmount: string;
  toTokenAmount: string;
  protocols?: any[];
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
}

export interface FusionPlusQuoteResponse {
  fromToken: OneInchTokenInfo;
  toToken: OneInchTokenInfo;
  fromTokenAmount: string;
  toTokenAmount: string;
  preset: string;
  orderHash?: string;
}

export interface FusionPlusOrderResponse {
  orderHash: string;
  order: {
    salt: string;
    maker: string;
    receiver: string;
    makerAsset: string;
    takerAsset: string;
    makingAmount: string;
    takingAmount: string;
    makerTraits: string;
  };
  quoteId: string;
  orderInfo: {
    orderHash: string;
    remaining: string;
    status: number;
  };
}

export interface BalanceResponse {
  [tokenAddress: string]: string;
}

export interface OrderbookOrderResponse {
  success: boolean;
  // The v4.0 API might return additional fields, but 'success' is the primary one
  // based on the documentation showing Code: 201 with success: boolean
}

class OneInchService {
  private baseURL: string;

  constructor() {
    this.baseURL = '/api/1inch';
  }

  /**
   * Make request to our internal API routes
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API Error (${response.status}): ${errorData.error || errorData.description || response.statusText
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error making request to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get supported tokens for a specific chain
   * GET /api/1inch/tokens
   */
  async getTokens(chainId: SupportedChainId): Promise<Record<string, OneInchTokenInfo>> {
    const params = new URLSearchParams({ chainId: chainId.toString() });
    return this.makeRequest(`/tokens?${params}`);
  }

  /**
   * Get allowance for token spending
   * GET /api/1inch/allowance
   */
  async getAllowance(
    chainId: SupportedChainId,
    tokenAddress: string,
    walletAddress: string
  ): Promise<{ allowance: string }> {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      tokenAddress,
      walletAddress,
    });

    return this.makeRequest(`/allowance?${params}`);
  }

  /**
   * Get approval transaction data
   * GET /api/1inch/approve
   */
  async getApprovalTransaction(
    chainId: SupportedChainId,
    tokenAddress: string,
    amount?: string
  ): Promise<{
    data: string;
    gasPrice: string;
    to: string;
    value: string;
  }> {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      tokenAddress
    });
    if (amount) params.append('amount', amount);

    return this.makeRequest(`/approve?${params}`);
  }

  /**
   * Get swap quote
   * GET /api/1inch/quote
   */
  async getQuote(params: {
    chainId: SupportedChainId;
    src: string;
    dst: string;
    amount: string;
    includeTokensInfo?: boolean;
    includeProtocols?: boolean;
    fee?: number;
    gasLimit?: number;
    connectorTokens?: string;
  }): Promise<OneInchQuoteResponse> {
    const searchParams = new URLSearchParams({
      chainId: params.chainId.toString(),
      src: params.src,
      dst: params.dst,
      amount: params.amount,
    });

    if (params.includeTokensInfo) searchParams.append('includeTokensInfo', 'true');
    if (params.includeProtocols) searchParams.append('includeProtocols', 'true');
    if (params.fee) searchParams.append('fee', params.fee.toString());
    if (params.gasLimit) searchParams.append('gasLimit', params.gasLimit.toString());
    if (params.connectorTokens) searchParams.append('connectorTokens', params.connectorTokens);

    return this.makeRequest(`/quote?${searchParams}`);
  }

  /**
   * Get swap transaction data
   * GET /api/1inch/swap
   */
  async getSwap(params: {
    chainId: SupportedChainId;
    src: string;
    dst: string;
    amount: string;
    from: string;
    slippage: number;
    protocols?: string;
    fee?: number;
    gasLimit?: number;
    gasPrice?: string;
    connectorTokens?: string;
    complexityLevel?: number;
    mainRouteParts?: number;
    parts?: number;
    includeTokensInfo?: boolean;
    includeProtocols?: boolean;
    compatibilityMode?: boolean;
    receiver?: string;
    referrer?: string;
    allowPartialFill?: boolean;
    disableEstimate?: boolean;
    usePatching?: boolean;
  }): Promise<OneInchSwapResponse> {
    const searchParams = new URLSearchParams({
      chainId: params.chainId.toString(),
      src: params.src,
      dst: params.dst,
      amount: params.amount,
      from: params.from,
      slippage: params.slippage.toString(),
    });

    // Add optional parameters
    if (params.protocols) searchParams.append('protocols', params.protocols);
    if (params.fee) searchParams.append('fee', params.fee.toString());
    if (params.gasLimit) searchParams.append('gasLimit', params.gasLimit.toString());
    if (params.gasPrice) searchParams.append('gasPrice', params.gasPrice);
    if (params.connectorTokens) searchParams.append('connectorTokens', params.connectorTokens);
    if (params.complexityLevel) searchParams.append('complexityLevel', params.complexityLevel.toString());
    if (params.mainRouteParts) searchParams.append('mainRouteParts', params.mainRouteParts.toString());
    if (params.parts) searchParams.append('parts', params.parts.toString());
    if (params.includeTokensInfo) searchParams.append('includeTokensInfo', 'true');
    if (params.includeProtocols) searchParams.append('includeProtocols', 'true');
    if (params.compatibilityMode) searchParams.append('compatibilityMode', 'true');
    if (params.receiver) searchParams.append('receiver', params.receiver);
    if (params.referrer) searchParams.append('referrer', params.referrer);
    if (params.allowPartialFill) searchParams.append('allowPartialFill', 'true');
    if (params.disableEstimate) searchParams.append('disableEstimate', 'true');
    if (params.usePatching) searchParams.append('usePatching', 'true');

    return this.makeRequest(`/swap?${searchParams}`);
  }

  /**
   * Get Fusion+ quote
   * GET /api/1inch/fusion-plus/quote
   */
  async getFusionPlusQuote(params: {
    chainId: SupportedChainId;
    src: string;
    dst: string;
    amount: string;
    walletAddress: string;
    enableEstimate?: boolean;
    permit?: string;
  }): Promise<FusionPlusQuoteResponse> {
    const searchParams = new URLSearchParams({
      chainId: params.chainId.toString(),
      src: params.src,
      dst: params.dst,
      amount: params.amount,
      walletAddress: params.walletAddress,
    });

    if (params.enableEstimate) searchParams.append('enableEstimate', 'true');
    if (params.permit) searchParams.append('permit', params.permit);

    return this.makeRequest(`/fusion-plus/quote?${searchParams}`);
  }

  /**
   * Submit Fusion+ order
   * POST /api/1inch/fusion-plus/submit
   */
  async submitFusionPlusOrder(params: {
    chainId: SupportedChainId;
    order: string;
    signature: string;
    quoteId: string;
  }): Promise<FusionPlusOrderResponse> {
    const searchParams = new URLSearchParams({
      chainId: params.chainId.toString(),
    });

    return this.makeRequest(`/fusion-plus/submit?${searchParams}`, {
      method: 'POST',
      body: JSON.stringify({
        order: params.order,
        signature: params.signature,
        quoteId: params.quoteId,
      }),
    });
  }

  /**
   * Get Fusion+ order status
   * GET /api/1inch/fusion-plus/status/[orderHash]
   */
  async getFusionPlusOrderStatus(
    chainId: SupportedChainId,
    orderHash: string
  ): Promise<{
    status: 'pending' | 'filled' | 'cancelled' | 'expired';
    fills?: any[];
  }> {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
    });

    return this.makeRequest(`/fusion-plus/status/${orderHash}?${params}`);
  }

  /**
   * Get wallet balances
   * GET /api/1inch/balances
   */
  async getBalances(
    chainId: SupportedChainId,
    walletAddress: string
  ): Promise<BalanceResponse> {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      walletAddress,
    });
    console.log("params", params);

    return this.makeRequest(`/balances?${params}`);
  }

  /**
   * Get current gas price
   * GET /api/1inch/gas-price
   */
  async getGasPrice(chainId: SupportedChainId): Promise<{
    standard: string;
    fast: string;
    instant: string;
  }> {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
    });

    return this.makeRequest(`/gas-price?${params}`);
  }

  /**
   * Get spot prices for tokens
   * GET /api/1inch/prices
   */
  async getSpotPrices(
    chainId: SupportedChainId,
    addresses: string[],
    currency: string = 'USD'
  ): Promise<Record<string, string>> {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      addresses: addresses.join(','),
      currency,
    });

    return this.makeRequest(`/prices?${params}`);
  }

  /**
   * Create limit order (Orderbook API)
   * POST /api/1inch/orderbook/v4.0/{chainId}
   */
  async createLimitOrder(params: {
    chainId: SupportedChainId;
    orderHash: string;
    signature: string;
    data: {
      makerAsset: string;
      takerAsset: string;
      maker: string;
      receiver: string;
      makingAmount: string;
      takingAmount: string;
      salt: string;
      extension: string;
      makerTraits: string;
      allowedSender: string;
    };
  }): Promise<OrderbookOrderResponse> {
    console.log('Creating limit order:', {
      chainId: params.chainId,
      orderHash: params.orderHash,
      data: params.data,
      url: `${this.baseURL}/orderbook/v4.0/${params.chainId}`,
    });

    return this.makeRequest(`/orderbook/v4.0/${params.chainId}`, {
      method: 'POST',
      body: JSON.stringify({
        orderHash: params.orderHash,
        signature: params.signature,
        data: params.data,
      }),
    });
  }

  /**
   * Get active orders for maker
   * GET /api/1inch/orderbook/orders/[maker]
   */
  async getActiveOrders(
    chainId: SupportedChainId,
    maker: string,
    page?: number,
    limit?: number
  ): Promise<OrderbookOrderResponse[]> {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
    });
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    return this.makeRequest(`/orderbook/orders/${maker}?${params}`);
  }

  /**
   * Cancel limit order
   * DELETE /api/1inch/orderbook/cancel/[orderHash]
   */
  async cancelLimitOrder(
    chainId: SupportedChainId,
    orderHash: string
  ): Promise<{ success: boolean }> {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
    });

    return this.makeRequest(`/orderbook/cancel/${orderHash}?${params}`, {
      method: 'DELETE',
    });
  }

  /**
   * Advanced TWAP Order Creation
   * Uses limit order protocol with time-based predicates
   */
  async createTWAPOrder(params: {
    chainId: SupportedChainId;
    makerAsset: string;
    takerAsset: string;
    totalAmount: string;
    numberOfTrades: number;
    timeInterval: number; // seconds between trades
    startTime?: number;
    slippage?: number;
  }): Promise<TWAPOrder> {
    const startTime = params.startTime || Math.floor(Date.now() / 1000);
    const endTime = startTime + (params.numberOfTrades * params.timeInterval);
    const amountPerTrade = (BigInt(params.totalAmount) / BigInt(params.numberOfTrades)).toString();

    // Generate TWAP predicate
    const predicate = this.encodeTWAPPredicate({
      startTime,
      timeInterval: params.timeInterval,
      numberOfTrades: params.numberOfTrades,
    });

    // Create base order structure
    const salt = ethers.randomBytes(32);
    const baseOrder: LimitOrder = {
      salt: ethers.hexlify(salt),
      maker: '', // Will be set by caller
      receiver: '', // Will be set by caller
      makerAsset: params.makerAsset,
      takerAsset: params.takerAsset,
      makingAmount: amountPerTrade,
      takingAmount: '0', // Will be calculated based on market price
      predicate,
      permit: '0x',
      interaction: '0x',
    };

    return {
      baseOrder,
      totalAmount: params.totalAmount,
      numberOfTrades: params.numberOfTrades,
      timeInterval: params.timeInterval,
      startTime,
      endTime,
      executedTrades: 0,
      remainingAmount: params.totalAmount,
    };
  }

  /**
   * Advanced Options Order Creation
   */
  async createOptionsOrder(params: {
    chainId: SupportedChainId;
    makerAsset: string;
    takerAsset: string;
    strikePrice: string;
    expirationTime: number;
    optionType: 'call' | 'put';
    premium: string;
    amount: string;
  }): Promise<OptionsOrder> {
    const predicate = this.encodeOptionsPredicate({
      strikePrice: params.strikePrice,
      expirationTime: params.expirationTime,
      optionType: params.optionType,
    });

    const salt = ethers.randomBytes(32);
    const baseOrder: LimitOrder = {
      salt: ethers.hexlify(salt),
      maker: '', // Will be set by caller
      receiver: '', // Will be set by caller
      makerAsset: params.makerAsset,
      takerAsset: params.takerAsset,
      makingAmount: params.amount,
      takingAmount: params.premium,
      predicate,
      permit: '0x',
      interaction: '0x',
    };

    return {
      baseOrder,
      strikePrice: params.strikePrice,
      expirationTime: params.expirationTime,
      optionType: params.optionType,
      premium: params.premium,
      isExercised: false,
    };
  }

  /**
   * Cross-chain Bitcoin-Ethereum swap implementation
   */
  async createBitcoinEthereumSwap(params: {
    bitcoinAmount: number;
    ethereumAddress: string;
    bitcoinAddress: string;
    ethereumTokenAddress?: string;
  }): Promise<CrossChainSwap> {
    // Generate swap parameters
    const swapId = ethers.hexlify(this.generateSwapId());
    const hashlock = ethers.hexlify(this.generateHashLock());
    const timelock = Math.floor(Date.now() / 1000) + 24 * 3600; // 24 hours

    // Create Bitcoin escrow
    const bitcoinEscrow = await this.createBitcoinEscrow({
      hashlock,
      timelock,
      amount: params.bitcoinAmount,
      recipientAddress: params.ethereumAddress,
      senderAddress: params.bitcoinAddress,
    });

    // Create chain info objects
    const fromChain: ChainInfo = {
      id: 0, // Bitcoin doesn't have a chain ID in EVM terms
      name: 'Bitcoin',
      nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
      rpcUrls: ['https://blockstream.info/api'],
      blockExplorerUrls: ['https://blockstream.info'],
    };

    const toChain: ChainInfo = {
      id: SUPPORTED_CHAIN_IDS.ETHEREUM,
      name: 'Ethereum',
      nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.infura.io'],
      blockExplorerUrls: ['https://etherscan.io'],
    };

    const fromToken: Token = {
      symbol: 'BTC',
      address: 'bitcoin',
      decimals: 8,
      name: 'Bitcoin',
      chainId: 0,
    };

    const toToken: Token = {
      symbol: 'ETH',
      address: params.ethereumTokenAddress || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
      name: 'Ethereum',
      chainId: SUPPORTED_CHAIN_IDS.ETHEREUM,
    };

    return {
      id: swapId,
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount: params.bitcoinAmount.toString(),
      toAmount: '0', // Will be calculated
      escrowAddress: bitcoinEscrow.address,
      hashlock,
      timelock,
      status: 'pending',
      createdAt: Date.now(),
    };
  }

  /**
   * Private helper methods
   */
  private encodeTWAPPredicate(params: {
    startTime: number;
    timeInterval: number;
    numberOfTrades: number;
  }): string {
    // Encode time-based predicate for TWAP execution
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'uint256', 'uint256'],
      [params.startTime, params.timeInterval, params.numberOfTrades]
    );
  }

  private encodeOptionsPredicate(params: {
    strikePrice: string;
    expirationTime: number;
    optionType: 'call' | 'put';
  }): string {
    // Encode options predicate with strike price and expiration
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'uint256', 'bool'],
      [params.strikePrice, params.expirationTime, params.optionType === 'call']
    );
  }

  private generateHashLock(): Uint8Array {
    return ethers.randomBytes(32);
  }

  private generateSwapId(): Uint8Array {
    return ethers.randomBytes(32);
  }

  private async createBitcoinEscrow(params: {
    hashlock: string;
    timelock: number;
    amount: number;
    recipientAddress: string;
    senderAddress: string;
  }): Promise<BitcoinEscrow> {
    // This would integrate with a Bitcoin testnet API
    // For now, return a mock structure
    return {
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', // Example Bitcoin address
      redeemScript: `OP_IF OP_SHA256 ${params.hashlock} OP_EQUALVERIFY OP_DUP OP_HASH160 ${params.recipientAddress} OP_ELSE ${params.timelock} OP_CHECKLOCKTIMEVERIFY OP_DROP OP_DUP OP_HASH160 ${params.senderAddress} OP_ENDIF OP_EQUALVERIFY OP_CHECKSIG`,
      hashlock: params.hashlock,
      timelock: params.timelock,
      amount: params.amount,
      status: 'created',
    };
  }

  /**
   * Utility method to check if chain is supported
   */
  isChainSupported(chainId: number): chainId is SupportedChainId {
    return Object.values(SUPPORTED_CHAIN_IDS).includes(chainId as SupportedChainId);
  }

  /**
   * Get chain name from chain ID
   */
  getChainName(chainId: SupportedChainId): string {
    const chains: Record<SupportedChainId, string> = {
      [SUPPORTED_CHAIN_IDS.ETHEREUM]: 'Ethereum',
      [SUPPORTED_CHAIN_IDS.BSC]: 'BNB Smart Chain',
      [SUPPORTED_CHAIN_IDS.POLYGON]: 'Polygon',
      [SUPPORTED_CHAIN_IDS.OPTIMISM]: 'Optimism',
      [SUPPORTED_CHAIN_IDS.ARBITRUM]: 'Arbitrum',
      [SUPPORTED_CHAIN_IDS.GNOSIS]: 'Gnosis',
      [SUPPORTED_CHAIN_IDS.AVALANCHE]: 'Avalanche',
      [SUPPORTED_CHAIN_IDS.FANTOM]: 'Fantom',
      [SUPPORTED_CHAIN_IDS.KLAYTN]: 'Klaytn',
      [SUPPORTED_CHAIN_IDS.AURORA]: 'Aurora',
      [SUPPORTED_CHAIN_IDS.BASE]: 'Base',
    };

    return chains[chainId] || 'Unknown';
  }
}

// Export singleton instance
export const oneInchService = new OneInchService();
export default oneInchService; 