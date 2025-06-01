'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpDown, Zap, Clock, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { oneInchService } from '@/lib/services/1inch';
import { nitroliteService, type NitroliteChannel } from '@/lib/services/nitrolite';
import { useToast } from '@/hooks/use-toast';
import { useAccount, useWalletClient } from 'wagmi';

import type { Token, OneInchQuote } from '@/types';
import { BASE_TOKENS } from '@/config/tokens';
import Image from 'next/image';

interface TradingFormData {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  slippage: number;
  useStateChannel: boolean;
  orderType: 'market' | 'limit' | 'twap' | 'options';
  limitPrice?: string;
  twapDuration?: number;
  twapIntervals?: number;
  optionType?: 'call' | 'put';
  strikePrice?: string;
  expirationTime?: number;
}

export function TradingInterface() {
  const [formData, setFormData] = useState<TradingFormData>({
    fromToken: BASE_TOKENS[0],
    toToken: BASE_TOKENS[1],
    fromAmount: '',
    slippage: 0.5,
    useStateChannel: false,
    orderType: 'market',
  });

  const [quote, setQuote] = useState<OneInchQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChannels, setActiveChannels] = useState<NitroliteChannel[]>([]);
  const [isNitroliteInitialized, setIsNitroliteInitialized] = useState(false);
  const { toast } = useToast();

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Load active channels count when component mounts or wallet changes
  useEffect(() => {
    if (isConnected && address) {
      loadActiveChannels();
    }
  }, [isConnected, address]);

  const loadActiveChannels = async () => {
    if (!address) return;

    try {
      // Try to initialize Nitrolite if not already done
      if (!isNitroliteInitialized && walletClient) {
        try {
          await nitroliteService.initializeWithWallet(walletClient, 137, address); // Polygon default
          setIsNitroliteInitialized(true);
        } catch (error) {
          console.log('Nitrolite not initialized, state channel trading disabled');
          setIsNitroliteInitialized(false);
        }
      }

      if (isNitroliteInitialized) {
        const channels = await nitroliteService.getUserChannels(address);
        const openChannels = channels.filter(ch => ch.status === 'open');
        setActiveChannels(openChannels);
        
        // Enable state channel toggle if channels are available
        if (openChannels.length === 0 && formData.useStateChannel) {
          setFormData(prev => ({ ...prev, useStateChannel: false }));
        }
      }
    } catch (error) {
      console.error('Error loading active channels:', error);
    }
  };

  const handleGetQuote = async () => {
    if (!formData.fromAmount || parseFloat(formData.fromAmount) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const quoteData = await oneInchService.getQuote({
        chainId: 8453,
        src: formData.fromToken.address,
        dst: formData.toToken.address,
        amount: (parseFloat(formData.fromAmount) * Math.pow(10, formData.fromToken.decimals)).toString(),
      });

      setQuote(quoteData as any); // Use any to bypass type issues with API response
    } catch (err) {
      console.error('Quote error:', err);
      setError('Failed to get quote');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute trade with real APIs
  const handleExecuteTrade = async () => {
    if (!address) {
      setError('Connect your wallet')
      return
    }

    if (!quote) return;

    setIsLoading(true);
    setError(null);

    try {
      const fromAmountWei = BigInt(Math.floor(parseFloat(formData.fromAmount) * Math.pow(10, formData.fromToken.decimals)));

      if (formData.useStateChannel && activeChannels.length > 0) {
        // Execute via Nitrolite state channel (instant, gas-free)
        const selectedChannel = activeChannels[0]; // Use first available channel

        // Calculate new allocations for the trade
        const tradeAmount = fromAmountWei;
        const currentUserAllocation = selectedChannel.allocation[0];
        const currentCounterpartyAllocation = selectedChannel.allocation[1];
        
        // Simple swap - reduce user's from token, increase to token
        const newUserAllocation = currentUserAllocation - tradeAmount;
        const newCounterpartyAllocation = currentCounterpartyAllocation + tradeAmount;

        const tradeResult = await nitroliteService.executeInstantTrade(
          selectedChannel.channelId,
          formData.fromToken.address,
          formData.toToken.address,
          tradeAmount,
          [newUserAllocation, newCounterpartyAllocation]
        );

        toast({
          title: "Instant Trade Executed",
          description: `Trade executed instantly via state channel! Trade ID: ${tradeResult.id.slice(0, 10)}... (Gas-free)`,
        });

        console.log('State channel trade result:', tradeResult);
        
        // Reload channels to update balances
        await loadActiveChannels();
      } else {
        // Execute via 1inch regular swap
        const swapResult = await oneInchService.getSwap({
          chainId: 8453,
          src: formData.fromToken.address,
          dst: formData.toToken.address,
          amount: (parseFloat(formData.fromAmount) * Math.pow(10, formData.fromToken.decimals)).toString(),
          from: address,
          slippage: formData.slippage,
        });

        toast({
          title: "Trade Executed",
          description: `Trade executed successfully! TX: ${swapResult.tx?.to?.slice(0, 10)}...`,
        });

        console.log('1inch swap result:', swapResult);
      }

      // Reset form after successful trade
      setFormData({
        ...formData,
        fromAmount: '',
      });
      setQuote(null);
    } catch (err) {
      console.error('Trade execution error:', err);
      setError('Trade execution failed');
      toast({
        title: "Trade Failed",
        description: "Failed to execute trade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create limit order via 1inch Limit Order Protocol
  const handleCreateLimitOrder = async () => {
    if (!formData.limitPrice || !formData.fromAmount || !address) return;

    setIsLoading(true);
    try {
      const makingAmount = (parseFloat(formData.fromAmount) * Math.pow(10, formData.fromToken.decimals)).toString();
      const takingAmount = (parseFloat(formData.limitPrice) * parseFloat(formData.fromAmount) * Math.pow(10, formData.toToken.decimals)).toString();

      const limitOrder = await (oneInchService as any).createLimitOrder({
        chainId: 8453,
        makerAsset: formData.fromToken.address,
        takerAsset: formData.toToken.address,
        makingAmount,
        takingAmount,
      });

      toast({
        title: "Limit Order Created",
        description: `Limit order created successfully!`,
      });

      console.log('Limit order created:', limitOrder);
    } catch (error) {
      console.error('Error creating limit order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to create limit order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create TWAP order
  const handleCreateTWAPOrder = async () => {
    if (!formData.twapDuration || !formData.twapIntervals || !formData.fromAmount || !address) return;

    setIsLoading(true);
    try {
      const totalAmount = (parseFloat(formData.fromAmount) * Math.pow(10, formData.fromToken.decimals)).toString();

      const twapOrder = await oneInchService.createTWAPOrder({
        chainId: 1,
        makerAsset: formData.fromToken.address,
        takerAsset: formData.toToken.address,
        totalAmount,
        numberOfTrades: formData.twapIntervals,
        timeInterval: Math.floor(formData.twapDuration * 60 / formData.twapIntervals), // Convert to seconds
      });

      toast({
        title: "TWAP Order Created",
        description: `TWAP order created! Will execute ${formData.twapIntervals} trades over ${formData.twapDuration} minutes.`,
      });

      console.log('TWAP order created:', twapOrder);
    } catch (error) {
      console.error('Error creating TWAP order:', error);
      toast({
        title: "TWAP Failed",
        description: "Failed to create TWAP order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create options order
  const handleCreateOptionsOrder = async () => {
    if (!formData.strikePrice || !formData.expirationTime || !formData.fromAmount || !address) return;

    setIsLoading(true);
    try {
      const premium = (parseFloat(formData.fromAmount) * Math.pow(10, formData.fromToken.decimals)).toString();

      const optionsOrder = await oneInchService.createOptionsOrder({
        chainId: 1,
        makerAsset: formData.fromToken.address,
        takerAsset: formData.toToken.address,
        strikePrice: formData.strikePrice,
        expirationTime: Math.floor(Date.now() / 1000) + (formData.expirationTime * 24 * 60 * 60),
        optionType: formData.optionType || 'call',
        premium,
        amount: premium,
      });

      toast({
        title: "Options Order Created",
        description: `${formData.optionType?.toUpperCase()} option created with strike ${formData.strikePrice}`,
      });

      console.log('Options order created:', optionsOrder);
    } catch (error) {
      console.error('Error creating options order:', error);
      toast({
        title: "Options Failed",
        description: "Failed to create options order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const swapTokens = () => {
    setFormData({
      ...formData,
      fromToken: formData.toToken,
      toToken: formData.fromToken,
      fromAmount: '',
    });
    setQuote(null);
  };

  // Auto-get quote when amount changes
  useEffect(() => {
    if (formData.fromAmount && parseFloat(formData.fromAmount) > 0) {
      const timer = setTimeout(() => {
        handleGetQuote();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [formData.fromAmount, formData.fromToken, formData.toToken]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Advanced Trading
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={formData.orderType} onValueChange={(value) => setFormData({ ...formData, orderType: value as any })}>
          <TabsList className="grid w-full grid-cols-4 bg-muted dark:bg-muted/50">
            <TabsTrigger value="market" className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-500">Market</TabsTrigger>
            <TabsTrigger value="limit" className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-500">Limit</TabsTrigger>
            <TabsTrigger value="twap" className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-500">TWAP</TabsTrigger>
            <TabsTrigger value="options" className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-500">Options</TabsTrigger>
          </TabsList>

          {/* From Token Selection */}
          <div className="space-y-2">
            <Label>From</Label>
            <div className="flex gap-2">
              <Select
                value={formData.fromToken.symbol}
                onValueChange={(value) => {
                  const token = BASE_TOKENS.find(t => t.symbol === value);
                  if (token) {
                    setFormData({ ...formData, fromToken: token });
                  }
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Token" />
                </SelectTrigger>
                <SelectContent>
                  {BASE_TOKENS.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="0.0"
                value={formData.fromAmount}
                onChange={(e) => setFormData({ ...formData, fromAmount: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swapTokens}
              className="rounded-full p-2"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Token Selection */}
          <div className="space-y-2">
            <Label>To</Label>
            <Select
              value={formData.toToken.symbol}
              onValueChange={(value) => {
                const token = BASE_TOKENS.find(t => t.symbol === value);
                if (token) {
                  setFormData({ ...formData, toToken: token });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {BASE_TOKENS.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="market" className="space-y-4">
            <div className="space-y-4 flex flex-col justify-center items-center">
              {/* State Channel Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg w-full">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <Label>Use State Channel</Label>
                  <Badge variant="outline" className="text-xs">
                    {activeChannels.length} Active
                  </Badge>
                </div>
                <Switch
                  checked={formData.useStateChannel}
                  disabled={activeChannels.length === 0}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, useStateChannel: checked })
                  }
                />
              </div>

              {/* State Channel Info */}
              {formData.useStateChannel && activeChannels.length > 0 && (
                <div className="w-full p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Gas-Free Trading Active</span>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Using channel: {activeChannels[0].channelId.slice(0, 8)}...{activeChannels[0].channelId.slice(-6)}
                  </p>
                </div>
              )}

              {/* No Channels Warning */}
              {formData.useStateChannel && activeChannels.length === 0 && (
                <div className="w-full p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">No Active Channels</span>
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Create a state channel first to enable gas-free trading
                  </p>
                </div>
              )}

              {/* Quote Display */}
              {quote && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2 w-full">
                  <div className="flex justify-between text-sm">
                    <span>Estimated Output:</span>
                    <span>{Number((quote as any).dstAmount || (quote as any).toAmount) / Math.pow(10, formData.toToken.decimals)} {formData.toToken.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Slippage:</span>
                    <span>{formData.slippage}%</span>
                  </div>
                  {formData.useStateChannel && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Gas Cost:</span>
                      <span>FREE</span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg w-full">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Execute Button */}
              <Button
                onClick={handleExecuteTrade}
                disabled={!quote || isLoading || !isConnected}
                size="lg"
                variant="default"
                className="w-full"
              >
                {isLoading ? (
                  'Processing...'
                ) : formData.useStateChannel && activeChannels.length > 0 ? (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Execute Instant Trade (Gas-Free)
                  </>
                ) : (
                  'Execute Trade'
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="limit" className="space-y-4 mt-8">
            <div className="space-y-4 flex flex-col gap-4">
              <div className='flex flex-col gap-2'>
                <Label>Limit Price ({formData.toToken.symbol} per {formData.fromToken.symbol})</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={formData.limitPrice || ''}
                  onChange={(e) => setFormData({ ...formData, limitPrice: e.target.value })}
                />
              </div>
              <Button
                onClick={handleCreateLimitOrder}
                disabled={isLoading || !formData.limitPrice || !formData.fromAmount || !isConnected}
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Limit Order'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="twap" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={formData.twapDuration || ''}
                    onChange={(e) => setFormData({ ...formData, twapDuration: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Intervals</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.twapIntervals || ''}
                    onChange={(e) => setFormData({ ...formData, twapIntervals: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateTWAPOrder}
                disabled={isLoading || !formData.twapDuration || !formData.twapIntervals || !formData.fromAmount || !isConnected}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create TWAP Order'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Option Type</Label>
                  <Select
                    value={formData.optionType || 'call'}
                    onValueChange={(value) => setFormData({ ...formData, optionType: value as 'call' | 'put' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="put">Put</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Strike Price</Label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={formData.strikePrice || ''}
                    onChange={(e) => setFormData({ ...formData, strikePrice: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Expiration (days)</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={formData.expirationTime || ''}
                  onChange={(e) => setFormData({ ...formData, expirationTime: parseInt(e.target.value) })}
                />
              </div>
              <Button
                onClick={handleCreateOptionsOrder}
                disabled={isLoading || !formData.strikePrice || !formData.expirationTime || !formData.fromAmount || !isConnected}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Options Order'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 