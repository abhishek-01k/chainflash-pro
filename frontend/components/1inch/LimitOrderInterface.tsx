'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useSignTypedData } from 'wagmi';
import { parseUnits, formatUnits, keccak256, encodeAbiParameters } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Target, Settings, CheckCircle, Loader2, Search, Wallet, Star, TrendingUp, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { oneInchService, SUPPORTED_CHAIN_IDS, type SupportedChainId, type OneInchTokenInfo } from '@/lib/services/1inch';
import { getOneInchLimitOrderSDK, resetOneInchLimitOrderSDK, type CreateOrderParams, type LimitOrderSDKConfig } from '@/lib/services/1inch-limit-order-sdk';
import { useToast } from '@/hooks/use-toast';
import { TokenSelector } from './TokenSelector';
import { PriceChart } from '@/components/charts/price-chart';

interface LimitOrderInterfaceProps {
  className?: string;
  tokens: Record<string, OneInchTokenInfo>;
  setTokens: (tokens: Record<string, OneInchTokenInfo>) => void;
  makerToken: OneInchTokenInfo;
  setMakerToken: (makerToken: OneInchTokenInfo) => void;
  takerToken: OneInchTokenInfo;
  setTakerToken: (takerToken: OneInchTokenInfo) => void;
  balances: Record<string, string>;
}

// Helper function to get token name from address
const getTokenName = (tokenAddress: string, tokens: Record<string, OneInchTokenInfo>): string => {
  const token = tokens[tokenAddress.toLowerCase()];
  return token ? token.symbol : tokenAddress;
};

interface LimitOrderData {
  order: any;
  signature: string;
  orderHash: string;
  status: 'draft' | 'signing' | 'signed' | 'submitting' | 'submitted' | 'error';
  typedData?: any;
}

interface ChartDataPoint {
  time: number;
  value: number;
}

interface ChartData {
  data: ChartDataPoint[];
}

export function LimitOrderInterface({ className, makerToken, takerToken, setMakerToken, setTakerToken, tokens, setTokens, balances }: LimitOrderInterfaceProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  const { signTypedData, isPending: isSigningPending } = useSignTypedData();

  // State management
  const [makerAmount, setMakerAmount] = useState('');
  const [takerAmount, setTakerAmount] = useState('');
  const [orderType, setOrderType] = useState<'limit' | 'twap' | 'stop'>('limit');
  const [expiration, setExpiration] = useState('3600'); // 1 hour default
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<LimitOrderData | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartData | undefined>();
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  currentOrder && console.log('currentOrder', currentOrder);
  // Current chain validation
  const currentChainId = chainId as SupportedChainId;
  const isValidChain = currentChainId && oneInchService.isChainSupported(currentChainId);

  // Get 1inch API key from environment
  const oneInchApiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY || process.env.NEXT_PUBLIC_ONEINCH_API_KEY;

  // 1inch Limit Order Protocol Contract Addresses
  const LIMIT_ORDER_PROTOCOL_ADDRESS = {
    1: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // Ethereum
    56: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // BSC
    137: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // Polygon
    42161: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // Arbitrum
    10: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // Optimism
    8453: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // Base
  };

  // Load active orders for current user
  useEffect(() => {
    async function loadActiveOrders() {
      if (!address || !isValidChain) return;

      try {
        const orders = await oneInchService.getActiveOrders(currentChainId, address);
        setActiveOrders(orders);
      } catch (err) {
        console.error('Error loading active orders:', err);
      }
    }

    loadActiveOrders();
  }, [address, currentChainId, isValidChain]);

  // Fetch chart data when tokens change
  useEffect(() => {
    const fetchChartData = async () => {
      if (!makerToken || !takerToken) return;

      setIsChartLoading(true);
      setChartError(null);

      console.log("fetcing chart data");
      try {
        const response = await fetch(`/api/1inch/charts?fromToken=${makerToken.address}&toToken=${takerToken.address}&chainId=${currentChainId}`);
        if (!response.ok) throw new Error('Failed to fetch chart data');

        const data = await response.json();
        setChartData(data);
      } catch (error) {
        setChartError(error instanceof Error ? error.message : 'Failed to load chart data');
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchChartData();
  }, [makerToken, takerToken]);

  // Reset SDK instance when chain changes
  useEffect(() => {
    if (isValidChain) {
      resetOneInchLimitOrderSDK();
    }
  }, [currentChainId, isValidChain]);

  // Complete order creation flow
  const handleCreateOrder = useCallback(async () => {
    console.log('handleCreateOrder called');
    console.log('Current state:', {
      address,
      makerToken: makerToken?.symbol,
      takerToken: takerToken?.symbol,
      makerAmount,
      takerAmount,
      oneInchApiKey: !!oneInchApiKey,
      chainId: currentChainId
    });

    if (!address || !makerToken || !takerToken || !oneInchApiKey) {
      console.log('Early return - missing required data');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting order creation...');

      // Validate input amounts
      if (!makerAmount || !takerAmount) {
        throw new Error('Please enter both maker and taker amounts');
      }

      const makingAmountBigInt = parseUnits(makerAmount, makerToken.decimals);
      const takingAmountBigInt = parseUnits(takerAmount, takerToken.decimals);

      console.log('Parsed amounts:', {
        makingAmountBigInt: makingAmountBigInt.toString(),
        takingAmountBigInt: takingAmountBigInt.toString()
      });

      // Initialize SDK
      const sdkConfig: LimitOrderSDKConfig = {
        authKey: oneInchApiKey,
        networkId: currentChainId
      };
      
      console.log('Initializing SDK with config:', sdkConfig);
      const sdk = getOneInchLimitOrderSDK(sdkConfig);

      // Validate order parameters
      const orderParams: CreateOrderParams = {
        makerAsset: makerToken.address,
        takerAsset: takerToken.address,
        makingAmount: makingAmountBigInt,
        takingAmount: takingAmountBigInt,
        maker: address,
        expiration: parseInt(expiration),
        allowPartialFill: true,
        allowPriceImprovement: true,
      };

      console.log('Order parameters:', orderParams);

      const validation = sdk.validateOrderParams(orderParams);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      console.log('Order parameters validated successfully');

      // Step 1: Create order structure
      console.log('Creating limit order...');
      const order = await sdk.createLimitOrder(orderParams);
      console.log('Created order:', order);

      // Step 2: Get typed data for signing
      console.log('Getting typed data...');
      const typedData = sdk.getOrderTypedData(order);
      const orderHash = sdk.getOrderHash(order);

      console.log('Order hash:', orderHash);

      setCurrentOrder({
        order,
        signature: '',
        orderHash,
        status: 'draft',
        typedData,
      });

      // Step 3: Sign order
      setCurrentOrder((prev: LimitOrderData | null) => prev ? { ...prev, status: 'signing' } : null);

      console.log('Starting order signing...');
      const signature = await new Promise<string>((resolve, reject) => {
        signTypedData({
          domain: typedData.domain,
          types: { Order: typedData.types.Order },
          primaryType: 'Order',
          message: typedData.message,
        }, {
          onSuccess: (data) => {
            console.log('Order signed successfully');
            resolve(data);
          },
          onError: (error) => {
            console.error('Error signing order:', error);
            reject(error);
          },
        });
      });

      console.log('Order signed:', signature);

      setCurrentOrder((prev: LimitOrderData | null) => prev ? { ...prev, signature, status: 'signed' } : null);

      // Step 4: Submit to 1inch
      setCurrentOrder((prev: LimitOrderData | null) => prev ? { ...prev, status: 'submitting' } : null);

      console.log('Submitting order to 1inch...');
      await sdk.submitOrder(order, signature);

      setCurrentOrder((prev: LimitOrderData | null) => prev ? { ...prev, status: 'submitted' } : null);
      
      toast({
        title: 'Limit Order Created',
        description: `Order submitted successfully!`,
      });

      // Refresh active orders
      console.log('Refreshing active orders...');
      const orders = await sdk.getActiveOrders(address);
      setActiveOrders(orders);

      // Reset form
      setMakerAmount('');
      setTakerAmount('');
      setTimeout(() => setCurrentOrder(null), 3000);

    } catch (err: any) {
      console.error('Error creating limit order:', err);
      setError(err.message || 'Failed to create limit order');
      setCurrentOrder((prev: LimitOrderData | null) => prev ? { ...prev, status: 'error' } : null);
      
      toast({
        title: 'Order Creation Failed',
        description: err.message || 'Failed to create limit order',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, makerToken, takerToken, makerAmount, takerAmount, expiration, currentChainId, oneInchApiKey, signTypedData, toast]);

  // Cancel order
  const handleCancelOrder = useCallback(async (orderHash: string) => {
    if (!oneInchApiKey) return;

    try {
      setIsLoading(true);
      
      const sdkConfig: LimitOrderSDKConfig = {
        authKey: oneInchApiKey,
        networkId: currentChainId
      };
      
      const sdk = getOneInchLimitOrderSDK(sdkConfig);
      await sdk.cancelOrder(orderHash);
      
      toast({
        title: 'Order Cancelled',
        description: 'Limit order has been cancelled successfully',
      });

      // Refresh active orders
      const orders = await sdk.getActiveOrders(address!);
      setActiveOrders(orders);
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'Failed to cancel order',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentChainId, address, oneInchApiKey, toast]);

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to create limit orders.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isValidChain) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please switch to a supported network for limit orders.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!oneInchApiKey) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              1inch API key is required. Please set NEXT_PUBLIC_1INCH_API_KEY or NEXT_PUBLIC_ONEINCH_API_KEY in your environment variables.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Create Order</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>My Orders ({activeOrders.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Chart Section */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>Price Chart</span>
                  {makerToken && takerToken && (
                    <Badge variant="outline" className="text-xs">
                      {makerToken.symbol}/{takerToken.symbol}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isChartLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : chartError ? (
                  <div className="h-full flex items-center justify-center">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{chartError}</AlertDescription>
                    </Alert>
                  </div>
                ) : !makerToken || !takerToken ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Select tokens to view price chart</p>
                  </div>
                ) : (
                  <PriceChart data={chartData} fromToken={makerToken.symbol} toToken={takerToken.symbol} />
                )}
              </CardContent>
            </Card>

            {/* Order Creation Form */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>Create Limit Order</span>
                    <Badge variant="outline" className="text-xs">
                      {oneInchService.getChainName(currentChainId)}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Target className="h-3 w-3" />
                    <span>{orderType.toUpperCase()}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Order Type Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Order Type</Label>
                  <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue className='flex gap-4' />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="limit">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4" />
                          <div>
                            <div className="font-medium text-left">Limit Order</div>
                            <div className="text-xs text-muted-foreground">Execute at specific price</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="twap">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <div>
                            <div className="font-medium">TWAP Order</div>
                            <div className="text-xs text-muted-foreground">Time-weighted average price</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="stop">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4" />
                          <div>
                            <div className="font-medium">Stop Loss</div>
                            <div className="text-xs text-muted-foreground">Trigger at stop price</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Maker Token */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">You Pay (Maker Asset)</Label>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Wallet className="w-3 h-3 mr-1" />
                      Balance: {balances[makerToken.address] || '0.00'}
                    </div>
                  </div>
                  <TokenSelector
                    value={makerToken}
                    onChange={setMakerToken}
                    label="maker"
                    tokens={tokens}
                    otherToken={takerToken}
                  />
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={makerAmount}
                    onChange={(e) => setMakerAmount(e.target.value)}
                    className="text-lg h-12 text-right bg-muted/30 border-muted"
                    step="any"
                  />
                </div>

                {/* Taker Token */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">You Receive (Taker Asset)</Label>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Wallet className="w-3 h-3 mr-1" />
                      Balance: {balances[takerToken.address] || '0.00'}
                    </div>
                  </div>
                  <TokenSelector
                    value={takerToken}
                    onChange={setTakerToken}
                    label="taker"
                    tokens={tokens}
                    otherToken={makerToken}
                  />
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={takerAmount}
                    onChange={(e) => setTakerAmount(e.target.value)}
                    className="text-lg h-12 text-right bg-muted/30 border-muted"
                    step="any"
                  />
                </div>

                {/* Expiration */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Expiration</Label>
                  <Select value={expiration} onValueChange={setExpiration}>
                    <SelectTrigger className="h-12 bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>1 Hour</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="86400">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>1 Day</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="604800">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>1 Week</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="2592000">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>1 Month</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Status */}
                {currentOrder && (
                  <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Order Status:</span>
                      <Badge variant={currentOrder.status === 'submitted' ? 'default' : 'secondary'} className="flex items-center space-x-1">
                        {currentOrder.status === 'signing' && <Loader2 className="h-3 w-3 animate-spin" />}
                        {currentOrder.status === 'submitting' && <Loader2 className="h-3 w-3 animate-spin" />}
                        {currentOrder.status === 'submitted' && <CheckCircle className="h-3 w-3" />}
                        <span>{currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}</span>
                      </Badge>
                    </div>
                    {currentOrder.orderHash && (
                      <div className="text-sm text-muted-foreground font-mono">
                        Order Hash: {currentOrder.orderHash.slice(0, 20)}...
                      </div>
                    )}
                  </div>
                )}

                {/* Create Order Button */}
                <Button
                  onClick={handleCreateOrder}
                  disabled={!makerToken || !takerToken || !makerAmount || !takerAmount || isLoading || isSigningPending}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  {isLoading || isSigningPending ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isSigningPending ? 'Sign in Wallet...' : 'Creating Order...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Create Limit Order</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>My Active Orders</span>
                <Badge variant="outline" className="text-xs">
                  {activeOrders.length} orders
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground mb-2">No active orders</p>
                  <p className="text-sm text-muted-foreground mb-4">Create your first limit order to get started</p>
                  <Button
                    onClick={() => {
                      const tabs = document.querySelector('[value="create"]') as HTMLElement;
                      tabs?.click();
                    }}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Order</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-accent/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-base">
                              {getTokenName(order.data?.makerAsset, tokens)} → {getTokenName(order.data?.takerAsset, tokens)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Limit
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Pay: {formatUnits(BigInt(order.data?.makingAmount || 0), 18)} {getTokenName(order.data?.makerAsset, tokens)} •
                            Receive: {formatUnits(BigInt(order.data?.takingAmount || 0), 18)} {getTokenName(order.data?.takerAsset, tokens)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            Hash: {order.orderHash?.slice(0, 20)}...
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOrder(order.orderHash)}
                          disabled={isLoading}
                          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Cancel'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 