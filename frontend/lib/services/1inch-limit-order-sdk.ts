import {
  LimitOrder,
  MakerTraits,
  Address,
  Sdk,
  randBigInt,
  Api,
  RfqOrder
} from '@1inch/limit-order-sdk';
import { UINT_40_MAX } from '@1inch/byte-utils';
import type { SupportedChainId } from './1inch';

// Simple HTTP provider implementation using fetch
class FetchProviderConnector {
  async get<T>(url: string, headers: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async post<T>(url: string, data: unknown, headers: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

export interface LimitOrderSDKConfig {
  authKey: string;
  networkId: SupportedChainId;
}

export interface CreateOrderParams {
  makerAsset: string;
  takerAsset: string;
  makingAmount: bigint;
  takingAmount: bigint;
  maker: string;
  receiver?: string;
  salt?: bigint;
  expiration?: number; // seconds from now
  allowPartialFill?: boolean;
  allowPriceImprovement?: boolean;
}

export interface CreateRfqOrderParams {
  makerAsset: string;
  takerAsset: string;
  makingAmount: bigint;
  takingAmount: bigint;
  maker: string;
  allowedSender?: string;
  expiration?: number; // seconds from now
}

export interface OrderWithSignature {
  order: LimitOrder;
  signature: string;
  orderHash: string;
  typedData: any;
}

export interface RfqOrderWithSignature {
  order: RfqOrder;
  signature: string;
  orderHash: string;
  typedData: any;
}

/**
 * Production-ready 1inch Limit Order SDK Service
 * Uses the official @1inch/limit-order-sdk for proper order creation
 */
export class OneInchLimitOrderSDK {
  private sdk: Sdk;
  private api: Api;
  private authKey: string;
  private networkId: SupportedChainId;
  private httpConnector: FetchProviderConnector;

  constructor(config: LimitOrderSDKConfig) {
    this.authKey = config.authKey;
    this.networkId = config.networkId;
    this.httpConnector = new FetchProviderConnector();

    // Initialize SDK with fetch provider
    this.sdk = new Sdk({
      authKey: this.authKey,
      networkId: this.networkId,
      httpConnector: this.httpConnector
    });

    // Initialize API client
    this.api = new Api({
      networkId: this.networkId,
      authKey: this.authKey,
      httpConnector: this.httpConnector
    });
  }

  /**
   * Get fee information for creating orders
   */
  async getFeeInfo(makerAsset: string, takerAsset: string, makingAmount: bigint, takingAmount: bigint): Promise<any> {
    try {
      const url = `https://api.1inch.dev/orderbook/v4.0/${this.networkId}/fee-info?makerAsset=${makerAsset}&takerAsset=${takerAsset}&makerAmount=${makingAmount.toString()}&takerAmount=${takingAmount.toString()}`;

      const feeInfo = await this.httpConnector.get(url, {
        'Authorization': `Bearer ${this.authKey}`,
        'Accept': 'application/json',
      }) as any;

      // Ensure whitelist is an array
      if (feeInfo && typeof feeInfo === 'object') {
        if (!feeInfo.whitelist) {
          feeInfo.whitelist = [];
        } else if (!Array.isArray(feeInfo.whitelist)) {
          feeInfo.whitelist = [];
        }
      }

      return feeInfo;
    } catch (error) {
      console.warn('Failed to fetch fee info, using defaults:', error);
      // Return default fee info structure
      return {
        whitelist: [],
        fees: {},
        resolverFee: '0',
        integrator: '0x0000000000000000000000000000000000000000'
      };
    }
  }

  /**
   * Create a limit order using the official SDK
   */
  async createLimitOrder(params: CreateOrderParams): Promise<LimitOrder> {
    try {
      console.log('Attempting to create limit order with fee info...');

      const expiresIn = BigInt(params.expiration || 3600); // 1 hour default
      const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;

      // Try to fetch fee information first
      console.log('Fetching fee information...');
      const feeInfo = await this.getFeeInfo(
        params.makerAsset,
        params.takerAsset,
        params.makingAmount,
        params.takingAmount
      );
      console.log('Fee info received:', feeInfo);

      // Generate proper maker traits using SDK
      const makerTraits = MakerTraits.default()
        .withExpiration(expiration)
        .withNonce(params.salt || randBigInt(UINT_40_MAX));

      // Enable partial fills if requested (this is the correct method name)
      if (params.allowPartialFill) {
        makerTraits.allowPartialFills();
      }

      // Enable multiple fills for better liquidity
      if (params.allowPriceImprovement) {
        makerTraits.allowMultipleFills();
      }

      // Create order using SDK with proper parameters
      const orderData = {
        makerAsset: new Address(params.makerAsset),
        takerAsset: new Address(params.takerAsset),
        makingAmount: params.makingAmount,
        takingAmount: params.takingAmount,
        maker: new Address(params.maker),
        salt: params.salt,
        receiver: params.receiver ? new Address(params.receiver) : undefined,
      };

      console.log('Creating order with data:', orderData);
      const order = await this.sdk.createOrder(orderData, makerTraits);

      return order;
    } catch (error: any) {
      console.error('Error in createLimitOrder with fee info:', error);

      // If the error is related to fee params or whitelist, use direct method
      if (error.message && (
        error.message.includes('feeParams') ||
        error.message.includes('whitelist') ||
        error.message.includes('map is not a function')
      )) {
        console.log('Fee-related error detected, using direct order creation...');
        return await this.createLimitOrderDirect(params);
      }

      // For other errors, try the direct method as well
      console.log('Using direct order creation as fallback...');
      try {
        return await this.createLimitOrderDirect(params);
      } catch (fallbackError) {
        console.error('Direct method also failed:', fallbackError);
        // If both methods fail, throw the original error
        throw error;
      }
    }
  }

  /**
   * Create an RFQ order (lighter version for market makers)
   */
  async createRfqOrder(params: CreateRfqOrderParams): Promise<RfqOrder> {
    const expiresIn = BigInt(params.expiration || 3600); // 1 hour default
    const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;

    const order = new RfqOrder({
      makerAsset: new Address(params.makerAsset),
      takerAsset: new Address(params.takerAsset),
      makingAmount: params.makingAmount,
      takingAmount: params.takingAmount,
      maker: new Address(params.maker)
    }, {
      allowedSender: params.allowedSender ? new Address(params.allowedSender) : undefined,
      expiration,
      nonce: randBigInt(UINT_40_MAX),
    });

    return order;
  }

  /**
   * Get typed data for order signing
   */
  getOrderTypedData(order: LimitOrder | RfqOrder) {
    return order.getTypedData(this.networkId);
  }

  /**
   * Get order hash
   */
  getOrderHash(order: LimitOrder | RfqOrder): string {
    return order.getOrderHash(this.networkId);
  }

  /**
   * Submit signed order to 1inch
   */
  async submitOrder(order: LimitOrder, signature: string): Promise<any> {
    try {
      const result = await this.api.submitOrder(order, signature);
      return result;
    } catch (error) {
      console.error('Error submitting order via API:', error);
      throw error;
    }
  }

  /**
   * Submit RFQ order
   */
  async submitRfqOrder(order: RfqOrder, signature: string): Promise<any> {
    return await this.api.submitOrder(order, signature);
  }

  /**
   * Get order by hash
   */
  async getOrderByHash(orderHash: string): Promise<any> {
    return await this.api.getOrderByHash(orderHash);
  }

  /**
   * Get orders by maker address
   */
  async getOrdersByMaker(maker: string): Promise<any> {
    return await this.api.getOrdersByMaker(new Address(maker));
  }

  /**
   * Cancel order by hash
   */
  async cancelOrder(orderHash: string): Promise<any> {
    // Note: SDK might not have cancel method, so we'll use API
    const response = await fetch(`/api/1inch/orderbook/cancel/${orderHash}?chainId=${this.networkId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.authKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel order: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get all active orders for a maker
   */
  async getActiveOrders(maker: string): Promise<any[]> {
    try {
      const orders = await this.getOrdersByMaker(maker);

      // Filter only active orders
      return Array.isArray(orders) ? orders.filter((order: any) =>
        order.status === 'active' || order.status === 'pending'
      ) : [];
    } catch (error) {
      console.error('Error fetching active orders:', error);
      return [];
    }
  }

  /**
   * Create TWAP order strategy
   * This uses extensions to create time-weighted average price orders
   */
  async createTWAPOrder(params: {
    makerAsset: string;
    takerAsset: string;
    totalAmount: bigint;
    numberOfChunks: number;
    timeInterval: number; // seconds between chunks
    maker: string;
  }): Promise<LimitOrder[]> {
    const orders: LimitOrder[] = [];
    const amountPerChunk = params.totalAmount / BigInt(params.numberOfChunks);
    const startTime = Math.floor(Date.now() / 1000);

    for (let i = 0; i < params.numberOfChunks; i++) {
      const chunkStartTime = startTime + (i * params.timeInterval);
      const expiration = chunkStartTime + params.timeInterval;

      const order = await this.createLimitOrder({
        makerAsset: params.makerAsset,
        takerAsset: params.takerAsset,
        makingAmount: amountPerChunk,
        takingAmount: amountPerChunk, // This should be calculated based on market price
        maker: params.maker,
        expiration: expiration - Math.floor(Date.now() / 1000),
        allowPartialFill: true,
        allowPriceImprovement: true,
      });

      orders.push(order);
    }

    return orders;
  }

  /**
   * Update network ID and reinitialize SDK
   */
  updateNetwork(networkId: SupportedChainId) {
    this.networkId = networkId;

    this.sdk = new Sdk({
      authKey: this.authKey,
      networkId: this.networkId,
      httpConnector: this.httpConnector
    });

    this.api = new Api({
      networkId: this.networkId,
      authKey: this.authKey,
      httpConnector: this.httpConnector
    });
  }

  /**
   * Validate order parameters
   */
  validateOrderParams(params: CreateOrderParams): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.makerAsset || params.makerAsset === '0x0000000000000000000000000000000000000000') {
      errors.push('Maker asset address is required');
    }

    if (!params.takerAsset || params.takerAsset === '0x0000000000000000000000000000000000000000') {
      errors.push('Taker asset address is required');
    }

    if (params.makerAsset === params.takerAsset) {
      errors.push('Maker and taker assets must be different');
    }

    if (params.makingAmount <= 0n) {
      errors.push('Making amount must be greater than 0');
    }

    if (params.takingAmount <= 0n) {
      errors.push('Taking amount must be greater than 0');
    }

    if (!params.maker || params.maker === '0x0000000000000000000000000000000000000000') {
      errors.push('Maker address is required');
    }

    if (params.expiration && params.expiration < 60) {
      errors.push('Expiration must be at least 60 seconds');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get current network ID
   */
  getNetworkId(): SupportedChainId {
    return this.networkId;
  }

  /**
   * Get auth key (for debugging purposes only)
   */
  getAuthKey(): string {
    return this.authKey.slice(0, 8) + '...'; // Don't expose full key
  }

  /**
   * Create a limit order directly without fee fetching (fallback method)
   */
  async createLimitOrderDirect(params: CreateOrderParams): Promise<LimitOrder> {
    try {
      console.log('Creating limit order directly without fee info...');

      const expiresIn = BigInt(params.expiration || 3600); // 1 hour default
      const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;

      // Generate proper maker traits using SDK
      const makerTraits = MakerTraits.default()
        .withExpiration(expiration)
        .withNonce(params.salt || randBigInt(UINT_40_MAX));

      // Enable partial fills if requested
      if (params.allowPartialFill) {
        makerTraits.allowPartialFills();
      }

      // Enable multiple fills for better liquidity
      if (params.allowPriceImprovement) {
        makerTraits.allowMultipleFills();
      }

      // Create order directly using SDK constructor or builder
      // This bypasses any fee fetching logic
      const orderData = {
        makerAsset: new Address(params.makerAsset),
        takerAsset: new Address(params.takerAsset),
        makingAmount: params.makingAmount,
        takingAmount: params.takingAmount,
        maker: new Address(params.maker),
        salt: params.salt || randBigInt(UINT_40_MAX),
        receiver: params.receiver ? new Address(params.receiver) : new Address('0x0000000000000000000000000000000000000000'),
      };

      console.log('Creating order with direct method:', orderData);

      // Create order with minimal SDK usage to avoid fee issues
      const order = new LimitOrder(orderData, makerTraits);

      console.log('Order created successfully with direct method');
      return order;
    } catch (error: any) {
      console.error('Error in createLimitOrderDirect:', error);
      throw error;
    }
  }
}

// Singleton instance
let sdkInstance: OneInchLimitOrderSDK | null = null;

/**
 * Get SDK instance (creates one if it doesn't exist)
 */
export function getOneInchLimitOrderSDK(config?: LimitOrderSDKConfig): OneInchLimitOrderSDK {
  if (!sdkInstance || (config && (config.networkId !== sdkInstance.getNetworkId()))) {
    if (!config) {
      throw new Error('SDK config is required for first initialization');
    }
    sdkInstance = new OneInchLimitOrderSDK(config);
  }
  return sdkInstance;
}

/**
 * Reset SDK instance (useful for network changes)
 */
export function resetOneInchLimitOrderSDK(): void {
  sdkInstance = null;
} 