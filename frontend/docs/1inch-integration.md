# 1inch Integration Guide

## Overview

This document provides a comprehensive guide to the production-ready 1inch integration in ChainFlash Pro. Our integration uses a secure API proxy architecture where all 1inch API calls go through our internal API routes, ensuring:

- **API Key Security** - Keys are kept server-side only
- **Rate Limiting** - Controlled through our backend
- **Error Handling** - Centralized error management
- **Caching** - Intelligent caching for better performance
- **Monitoring** - Complete request/response logging

## Architecture

```
Frontend Components
       ↓
1inch Service (frontend/lib/services/1inch.ts)
       ↓
Internal API Routes (/api/1inch/*)
       ↓
1inch API (api.1inch.dev)
```

## API Integration Includes

- **Swap API v6.0** - Token swaps with best prices
- **Fusion+ API v1.0** - Gasless cross-chain swaps 
- **Orderbook API v4.0** - Limit orders and advanced trading
- **Balance API v1.2** - Wallet balance tracking
- **Price API v1.1** - Real-time token pricing
- **Gas Price API v1.5** - Current gas price data

## Features

### ✅ Standard Swaps
- Multi-chain support (Ethereum, Arbitrum, Polygon, BSC, etc.)
- Best price aggregation across DEXs
- Slippage protection
- Gas optimization

### ✅ Fusion+ Gasless Swaps
- Zero gas fee swaps
- Cross-chain swapping capabilities
- Intent-based execution
- MEV protection

### ✅ Advanced Trading
- Limit orders with custom predicates
- TWAP (Time-Weighted Average Price) strategies
- Options trading integration
- Concentrated liquidity support

### ✅ Cross-Chain Features
- Bitcoin-Ethereum atomic swaps
- Multi-chain balance tracking
- Cross-chain arbitrage detection

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# Required - Get from https://portal.1inch.dev
NEXT_PUBLIC_1INCH_API_KEY=your-1inch-api-key-here

# Optional - for enhanced features
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id
NEXT_PUBLIC_ALCHEMY_API_KEY=your-alchemy-key
```

**Important**: The API key is used server-side only in our API routes. It's never exposed to the client.

### 2. Import the Service

```typescript
import { oneInchService, SUPPORTED_CHAIN_IDS } from '@/lib/services/1inch';
```

## Usage Examples

### Basic Token Swap

```typescript
// Get quote (uses /api/1inch/quote internally)
const quote = await oneInchService.getQuote({
  chainId: 1, // Ethereum
  src: '0xA0b86a33E6417c5C6C02A5B63c0aA94c0CCC7c9d', // WETH
  dst: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b', // USDC  
  amount: '1000000000000000000', // 1 ETH in wei
  includeTokensInfo: true,
  includeProtocols: true
});

// Execute swap (uses /api/1inch/swap internally)
const swapData = await oneInchService.getSwap({
  chainId: 1,
  src: '0xA0b86a33E6417c5C6C02A5B63c0aA94c0CCC7c9d',
  dst: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b',
  amount: '1000000000000000000',
  from: '0x...', // User wallet address
  slippage: 1, // 1%
  allowPartialFill: true
});

// Execute the transaction using the returned tx data
```

### Gasless Fusion+ Swap

```typescript
// Get Fusion+ quote (uses /api/1inch/fusion-plus/quote internally)
const fusionQuote = await oneInchService.getFusionPlusQuote({
  chainId: 1,
  src: '0xA0b86a33E6417c5C6C02A5B63c0aA94c0CCC7c9d',
  dst: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b',
  amount: '1000000000000000000',
  walletAddress: '0x...', // User address
  enableEstimate: true
});

// Submit order (uses /api/1inch/fusion-plus/submit internally)
const order = await oneInchService.submitFusionPlusOrder({
  chainId: 1,
  order: signedOrder, // Generated and signed order
  signature: orderSignature,
  quoteId: fusionQuote.quoteId
});

// Check order status (uses /api/1inch/fusion-plus/status/[orderHash] internally)
const status = await oneInchService.getFusionPlusOrderStatus(1, order.orderHash);
```

### Advanced TWAP Order

```typescript
// Create TWAP order for large trades
const twapOrder = await oneInchService.createTWAPOrder({
  chainId: 1,
  makerAsset: '0xA0b86a33E6417c5C6C02A5B63c0aA94c0CCC7c9d', // WETH
  takerAsset: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b', // USDC
  totalAmount: '10000000000000000000', // 10 ETH
  numberOfTrades: 10, // Split into 10 trades
  timeInterval: 3600, // 1 hour between trades
  slippage: 0.5
});
```

### Options Trading

```typescript
// Create options order
const optionsOrder = await oneInchService.createOptionsOrder({
  chainId: 1,
  makerAsset: '0xA0b86a33E6417c5C6C02A5B63c0aA94c0CCC7c9d',
  takerAsset: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b',
  strikePrice: '2000000000', // $2000 in USDC
  expirationTime: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
  optionType: 'call',
  premium: '50000000', // 50 USDC premium
  amount: '1000000000000000000' // 1 ETH
});
```

### Cross-Chain Bitcoin Swap

```typescript
// Create Bitcoin-Ethereum atomic swap
const crossChainSwap = await oneInchService.createBitcoinEthereumSwap({
  bitcoinAmount: 0.1, // 0.1 BTC
  ethereumAddress: '0x...', // Ethereum recipient
  bitcoinAddress: 'bc1...', // Bitcoin sender
  ethereumTokenAddress: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b' // USDC
});
```

### Balance & Data Tracking

```typescript
// Get wallet balances (uses /api/1inch/balances internally)
const balances = await oneInchService.getBalances(1, '0x...');

// Get supported tokens (uses /api/1inch/tokens internally)
const tokens = await oneInchService.getTokens(1);

// Get current gas prices (uses /api/1inch/gas-price internally)
const gasPrice = await oneInchService.getGasPrice(1);

// Get token spot prices (uses /api/1inch/prices internally)
const prices = await oneInchService.getSpotPrices(
  1, 
  ['0xA0b86a33E6417c5C6C02A5B63c0aA94c0CCC7c9d'], 
  'USD'
);
```

## API Routes

Our secure proxy API routes handle all 1inch communication:

### Swap & Quote Routes
- `GET /api/1inch/quote` - Get swap quotes
- `GET /api/1inch/swap` - Get swap transaction data
- `GET /api/1inch/tokens` - Get supported tokens
- `GET /api/1inch/allowance` - Check token allowances
- `GET /api/1inch/approve` - Get approval transaction data

### Fusion+ Routes
- `GET /api/1inch/fusion-plus/quote` - Get Fusion+ quotes
- `POST /api/1inch/fusion-plus/submit` - Submit Fusion+ orders
- `GET /api/1inch/fusion-plus/status/[orderHash]` - Check order status

### Orderbook Routes
- `POST /api/1inch/orderbook` - Create limit orders
- `GET /api/1inch/orderbook/orders/[maker]` - Get active orders
- `DELETE /api/1inch/orderbook/cancel/[orderHash]` - Cancel orders

### Data Routes
- `GET /api/1inch/balances` - Get wallet balances
- `GET /api/1inch/gas-price` - Get current gas prices
- `GET /api/1inch/prices` - Get token spot prices

## React Component Integration

### Swap Interface Component

```typescript
import { SwapInterface } from '@/components/1inch/SwapInterface';

function TradingPage() {
  return (
    <div className="container mx-auto py-8">
      <SwapInterface className="max-w-md mx-auto" />
    </div>
  );
}
```

### Custom Hook Example

```typescript
import { useState, useCallback } from 'react';
import { oneInchService } from '@/lib/services/1inch';

export function useOneInchSwap() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async (params: QuoteParams) => {
    try {
      setIsLoading(true);
      setError(null);
      return await oneInchService.getQuote(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quote failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeSwap = useCallback(async (params: SwapParams) => {
    try {
      setIsLoading(true);
      setError(null);
      return await oneInchService.getSwap(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getQuote, executeSwap, isLoading, error };
}
```

## Supported Networks

The service supports all 1inch mainnet chains:

- **Ethereum** (1)
- **Binance Smart Chain** (56)
- **Polygon** (137)
- **Optimism** (10)
- **Arbitrum** (42161)
- **Gnosis** (100)
- **Avalanche** (43114)
- **Fantom** (250)
- **Klaytn** (8217)
- **Aurora** (1313161554)
- **Base** (8453)

## Security Features

### API Key Management
- API keys are stored server-side only
- Never exposed to client-side code
- Environment variable based configuration
- Secure Bearer token authentication

### Request Validation
- Comprehensive parameter validation
- Address format verification
- Chain ID validation
- Rate limiting and error handling

### Caching Strategy
- Token lists: 1 hour cache
- Balances: 30 seconds cache
- Gas prices: 15 seconds cache
- Spot prices: 1 minute cache
- Orders: 10 seconds cache

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const quote = await oneInchService.getQuote(params);
} catch (error) {
  if (error.message.includes('Insufficient liquidity')) {
    // Handle liquidity issues
  } else if (error.message.includes('Unsupported chain')) {
    // Handle chain validation
  } else {
    // Handle general errors
  }
}
```

## Rate Limiting

Our API routes respect 1inch API rate limits:
- **Dev Plan**: 100,000 calls/month, 1 RPS
- **Start-Up**: 1M calls/month, 10 RPS  
- **Professional**: 3M calls/month, 20 RPS
- **Business**: 7M calls/month, 40 RPS

## Best Practices

### 1. Caching
- Leverage built-in caching for frequently accessed data
- Token lists and gas prices are automatically cached
- Balances are cached briefly to balance freshness and performance

### 2. Error Recovery
- Implement retry logic for network failures
- Provide fallback UI states
- Use toast notifications for user feedback

### 3. Performance
- Use debounced quote requests (implemented in SwapInterface)
- Lazy load token lists
- Implement proper loading states

### 4. Security
- All API communication is server-side
- User inputs are validated on both client and server
- No sensitive data exposed to client

## Monitoring & Debugging

### Server-Side Logging
All API routes include comprehensive logging:

```javascript
// Quote requests
console.log('Quote generated successfully:', {
  chainId,
  from: data.fromToken?.symbol,
  to: data.toToken?.symbol,
  amount: data.fromTokenAmount
});

// Error logging
console.error('1inch API Error:', {
  status: response.status,
  statusText: response.statusText,
  data
});
```

### Client-Side Error Handling
The service provides detailed error messages for debugging:

```typescript
// Service automatically logs errors
catch (error) {
  console.error(`Error making request to ${endpoint}:`, error);
  throw error;
}
```

## Testing

### Development Setup
1. Get a free API key from [1inch Portal](https://portal.1inch.dev)
2. Set `NEXT_PUBLIC_1INCH_API_KEY` in your environment
3. Test with small amounts on testnets first
4. Monitor API usage in 1inch developer portal

### Production Checklist
- [ ] Valid 1inch API key with sufficient quota
- [ ] Environment variables properly configured
- [ ] Error monitoring (Sentry) configured
- [ ] Rate limiting working correctly
- [ ] User feedback systems in place
- [ ] Gas price estimation working
- [ ] Slippage protection enabled
- [ ] API route authentication working
- [ ] Caching headers properly set

## Troubleshooting

### Common Issues

**"API Error (400): Missing required parameters"**
- Check that all required parameters are provided
- Verify parameter types match expected formats

**"API Error (400): Unsupported chain"**
- Check if chain is in `SUPPORTED_CHAIN_IDS`
- Verify user is connected to supported network

**"API Error (401): Unauthorized"**
- Verify `NEXT_PUBLIC_1INCH_API_KEY` is set correctly
- Check API key is valid in 1inch portal

**"API Error (429): Rate limit exceeded"**
- Monitor your API usage in 1inch portal
- Consider upgrading API plan
- Implement request debouncing

**"Internal server error"**
- Check server logs for detailed error messages
- Verify all required environment variables are set
- Check network connectivity from server

### Debugging Steps
1. Check browser console for detailed error messages
2. Verify API key and network settings
3. Check server logs for backend errors
4. Test individual API routes directly
5. Review the 1inch API documentation

## Support

For issues specific to this integration:
1. Check the browser console and server logs for detailed error messages
2. Verify API key and network settings
3. Test API routes individually using tools like Postman
4. Review the 1inch API documentation
5. Contact the development team

For 1inch API issues:
- Visit [1inch Support](https://portal.1inch.dev/support)
- Check [1inch Documentation](https://portal.1inch.dev/documentation)
- Join the 1inch Discord community 