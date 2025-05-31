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
import MyOrders from './MyOrders';
import { fetchChartData } from '@/lib/api/1inch/charts';

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

  const fetchChart = async () => {
    if (!makerToken?.address || !takerToken?.address || !currentChainId) {
      setChartError('Missing parameter i.e, fromtoken, toToken, chainId')
      return;
    };

    setIsChartLoading(true);
    setChartError(null);

    try {
      const response = await fetch(`/api/1inch/charts?fromToken=${makerToken.address}&toToken=${takerToken.address}&period=24H&chainId=${currentChainId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || errorData.error || 'Failed to fetch chart data');
      }

      const data = await response.json();
      console.log("Chart Data:", data);

      setChartData(data);
    } catch (error) {
      setChartError(error instanceof Error ? error.message : 'Failed to fetch chart data');
      setChartData(undefined);
    } finally {
      setIsChartLoading(false);
    }
  };

  useEffect(() => {
    if (isValidChain) {
      fetchChart();
    }
  }, [makerToken, takerToken, isValidChain])

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

      // const makingAmountBigInt = parseUnits(makerAmount, makerToken.decimals);
      const makingAmountBigInt = makerAmount
      const takingAmountBigInt = takerAmount
      // const takingAmountBigInt = parseUnits(takerAmount, takerToken.decimals);

      console.log('Parsed amounts:', {
        makingAmountBigInt: makingAmountBigInt.toString(),
        takingAmountBigInt: takingAmountBigInt.toString()
      });

      // Step 1: Create order via API route
      console.log('Creating limit order via API...');
      const createResponse = await fetch('/api/1inch/limit-orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          makerAsset: makerToken.address,
          takerAsset: takerToken.address,
          makingAmount: makingAmountBigInt.toString(),
          takingAmount: takingAmountBigInt.toString(),
          maker: address,
          chainId: currentChainId,
          expiration: parseInt(expiration),
          allowPartialFill: true,
          allowPriceImprovement: true,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const { order, typedData, orderHash } = await createResponse.json();
      console.log('Order created successfully:', { orderHash });

      setCurrentOrder({
        order,
        signature: '',
        orderHash,
        status: 'draft',
        typedData,
      });

      // Step 2: Sign order
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

      // Step 3: Submit to 1inch via API route
      setCurrentOrder((prev: LimitOrderData | null) => prev ? { ...prev, status: 'submitting' } : null);

      console.log('Submitting order to 1inch via API...');
      const submitResponse = await fetch('/api/1inch/limit-orders/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData: {
            ...order,
            orderHash,
          },
          signature,
          chainId: currentChainId,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || 'Failed to submit order');
      }

      const submitResult = await submitResponse.json();
      console.log('Order submitted successfully:', submitResult);

      setCurrentOrder((prev: LimitOrderData | null) => prev ? { ...prev, status: 'submitted' } : null);

      toast({
        title: 'Limit Order Created',
        description: `Order submitted successfully!`,
      });

      // Refresh active orders
      if (address && currentChainId) {
        try {
          const response = await fetch(`/api/1inch/limit-orders/active?maker=${address}&chainId=${currentChainId}`);
          if (response.ok) {
            const { orders } = await response.json();
            setActiveOrders(orders || []);
          }
        } catch (error) {
          console.error('Error refreshing active orders after order creation:', error);
        }
      }

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

      const response = await fetch('/api/1inch/limit-orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderHash,
          chainId: currentChainId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      toast({
        title: 'Order Cancelled',
        description: 'Limit order has been cancelled successfully',
      });

      // Refresh active orders
      if (address && currentChainId) {
        try {
          const response = await fetch(`/api/1inch/limit-orders/active?maker=${address}&chainId=${currentChainId}`);
          if (response.ok) {
            const { orders } = await response.json();
            setActiveOrders(orders || []);
          }
        } catch (error) {
          console.error('Error refreshing active orders after cancellation:', error);
        }
      }
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'Failed to cancel order',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentChainId, oneInchApiKey, toast, address]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="create" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-lg">
          <TabsTrigger
            value="create"
            className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all duration-200 rounded-md py-2.5"
          >
            <Target className="w-4 h-4" />
            <span>Create Order</span>
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all duration-200 rounded-md py-2.5"
          >
            <Clock className="w-4 h-4" />
            <span>My Orders</span>
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
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium text-muted-foreground">Order Type</Label>
                  <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                    <SelectTrigger className="bg-muted/30 h-[50px]">
                      <SelectValue className='flex space-x-4' />
                    </SelectTrigger>
                    <SelectContent className='bg-white dark:bg-black'>
                      <SelectItem value="limit">
                        <div className="flex items-center space-x-4">
                          <Target className="w-4 h-4" />
                          <div>
                            <div className="font-medium text-left">Limit Order</div>
                            <div className="text-xs text-muted-foreground">Execute at specific price</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="twap">
                        <div className="flex items-center space-x-4">
                          <TrendingUp className="w-4 h-4" />
                          <div>
                            <div className="font-medium">TWAP Order</div>
                            <div className="text-xs text-muted-foreground">Time-weighted average price</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="stop">
                        <div className="flex items-center space-x-4">
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
                    className="text-xl h-12 text-right bg-muted/30 border-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    className="text-xl h-12 text-right bg-muted/30 border-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    step="any"
                  />
                </div>

                {/* Expiration */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Expiration</Label>
                  <Select value={expiration} onValueChange={setExpiration}>
                    <SelectTrigger className="h-12 bg-black dark:bg-black text-white dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-white dark:bg-black text-black dark:text-white'>
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
          <MyOrders
            handleCancelOrder={handleCancelOrder}
            tokens={tokens}
            isLoading={isLoading}
          />


        </TabsContent>
      </Tabs>
    </div>
  );
} 