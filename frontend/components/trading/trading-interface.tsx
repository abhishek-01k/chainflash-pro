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
import { nitroliteService } from '@/lib/services/nitrolite';
import { useToast } from '@/hooks/use-toast';

import type { Token, OneInchQuote } from '@/types';
import { BASE_TOKENS } from '@/config/tokens';
import Image from 'next/image';
import { useAccount } from 'wagmi';

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
    useStateChannel: true,
    orderType: 'market',
  });

  const [quote, setQuote] = useState<OneInchQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChannels, setActiveChannels] = useState(0);
  const { toast } = useToast();

  const { address, isConnected } = useAccount();

  // Load active channels count
  useEffect(() => {
    const loadChannelCount = async () => {
      try {
        const mockUserAddress = '0x1234567890123456789012345678901234567890';
        const channels = await nitroliteService.getUserChannels(mockUserAddress);
        setActiveChannels(channels.length);
      } catch (error) {
        console.error('Error loading channel count:', error);
      }
    };
    loadChannelCount();
  }, []);

  // Get real quote from 1inch API
  const handleGetQuote = async () => {
    if (!formData.fromToken || !formData.toToken || !formData.fromAmount) {
      return;
    }

    if (!address) {
      setError('Connect your wallet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fromAmountWei = (parseFloat(formData.fromAmount) * Math.pow(10, formData.fromToken.decimals)).toString();

      const quoteData = await oneInchService.getQuote({
        chainId: 8453,
        src: formData.fromToken.address,
        dst: formData.toToken.address,
        amount: fromAmountWei,
        includeTokensInfo: true,
        includeProtocols: true,
        walletAddress: address
      });

      console.log("Quote data", quoteData);

      setQuote(quoteData);
    } catch (err) {
      console.error('Quote error:', err);
      setError('Failed to get quote from 1inch API');
      toast({
        title: "Quote Error",
        description: "Failed to fetch price quote. Please try again.",
        variant: "destructive",
      });
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

      if (formData.useStateChannel && activeChannels > 0) {
        // Execute via Nitrolite state channel (instant, gas-free)
        const channelId = 'active-channel-id'; // Would get from active channels

        const tradeResult = await nitroliteService.executeInstantTrade(
          channelId,
          formData.fromToken.address,
          formData.toToken.address,
          fromAmountWei,
          [] // New allocations would be calculated
        );

        toast({
          title: "Instant Trade Executed",
          description: `Trade executed instantly via state channel! Trade ID: ${tradeResult.id.slice(0, 10)}...`,
        });

        console.log('State channel trade result:', tradeResult);
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
    if (!formData.limitPrice || !formData.fromAmount) return;

    setIsLoading(true);
    try {
      const mockUserAddress = '0x1234567890123456789012345678901234567890';
      const makingAmount = (parseFloat(formData.fromAmount) * Math.pow(10, formData.fromToken.decimals)).toString();
      const takingAmount = (parseFloat(formData.limitPrice) * parseFloat(formData.fromAmount) * Math.pow(10, formData.toToken.decimals)).toString();

      const limitOrder = await oneInchService.createLimitOrder({
        chainId: 8453,
        makerAsset: formData.fromToken.address,
        takerAsset: formData.toToken.address,
        makingAmount,
        takingAmount,
        maker: mockUserAddress,
      });

      toast({
        title: "Limit Order Created",
        description: `Limit order created successfully! Order: ${limitOrder.salt.slice(0, 10)}...`,
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
    if (!formData.twapDuration || !formData.twapIntervals || !formData.fromAmount) return;

    setIsLoading(true);
    try {
      const mockUserAddress = '0x1234567890123456789012345678901234567890';
      const totalAmount = (parseFloat(formData.fromAmount) * Math.pow(10, formData.fromToken.decimals)).toString();

      const twapOrder = await oneInchService.createTWAPOrder({
        chainId: 1,
        baseOrder: {
          maker: mockUserAddress,
          receiver: mockUserAddress,
          makerAsset: formData.fromToken.address,
          takerAsset: formData.toToken.address,
          makingAmount: '0', // Will be calculated per trade
          takingAmount: '0', // Will be calculated per trade
          predicate: '0x',
          permit: '0x',
          interaction: '0x',
        },
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
    if (!formData.strikePrice || !formData.expirationTime || !formData.fromAmount) return;

    setIsLoading(true);
    try {
      const mockUserAddress = '0x1234567890123456789012345678901234567890';
      const premium = (parseFloat(formData.fromAmount) * Math.pow(10, formData.fromToken.decimals)).toString();

      const optionsOrder = await oneInchService.createOptionsOrder({
        chainId: 1,
        baseOrder: {
          maker: mockUserAddress,
          receiver: mockUserAddress,
          makerAsset: formData.fromToken.address,
          takerAsset: formData.toToken.address,
          makingAmount: premium,
          takingAmount: (parseFloat(formData.strikePrice) * Math.pow(10, formData.toToken.decimals)).toString(),
          permit: '0x',
          interaction: '0x',
        },
        strikePrice: formData.strikePrice,
        expirationTime: Math.floor(Date.now() / 1000) + (formData.expirationTime * 24 * 60 * 60),
        optionType: formData.optionType || 'call',
        premium,
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
    });
    setQuote(null);
  };

  // Auto-quote on amount/token changes
  useEffect(() => {
    if (formData.fromAmount && formData.fromToken && formData.toToken && formData.orderType === 'market') {
      const debounceTimer = setTimeout(() => {
        handleGetQuote();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [formData.fromAmount, formData.fromToken, formData.toToken, formData.orderType]);

  return (
    <Card className="max-w-[500px] mx-auto mt-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Professional Trading
          <Badge variant="outline" className="ml-auto">
            1inch + Nitrolite
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>

        <div className='flex flex-col gap-4'>
          {/* From Token */}
          <div className="space-y-2">
            <Label>From</Label>
            <div className="flex gap-2">
              <Select
                value={formData.fromToken.address}
                onValueChange={(address) => {
                  const token = BASE_TOKENS.find(t => t.address === address);
                  if (token) setFormData({ ...formData, fromToken: token });
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-gray-800 text-white' >
                  {BASE_TOKENS.map((token) => (
                    <SelectItem
                      className='py-2 hover:bg-gray-700 transition-colors duration-200 cursor-pointer'
                      key={token.address}
                      value={token.address}
                    >
                      <Image src={token.logoURI} width={20} height={20} alt={token.name} />
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                className='flex-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                placeholder="0.0"
                value={formData.fromAmount}
                onChange={(e) =>
                  setFormData({ ...formData, fromAmount: e.target.value })
                }
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={swapTokens}
              className="rounded-full"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <Label>To</Label>
            <div className="flex gap-2">
              <Select
                value={formData.toToken.address}
                onValueChange={(address) => {
                  const token = BASE_TOKENS.find(t => t.address === address);
                  if (token) setFormData({ ...formData, toToken: token });
                }}
              >
                <SelectTrigger className="flex-1 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-gray-800 text-white' >
                  {BASE_TOKENS.map((token) => (
                    <SelectItem
                      key={token.address}
                      value={token.address}
                      className="flex items-center gap-2 focus:bg-accent focus:text-accent-foreground py-2 hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={token.logoURI}
                          width={24}
                          height={24}
                          alt={token.name}
                          className="rounded-full"
                        />
                        <span>{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="0.0"
                value={quote ? (Number(quote.dstAmount) / Math.pow(10, formData.toToken.decimals)).toFixed(6) : ''}
                readOnly
                className='flex-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
              />
            </div>
          </div>
        </div>
        <Tabs
          value={formData.orderType}
          onValueChange={(value) => setFormData({
            ...formData,
            orderType: value as any
          })}
        >
          <TabsList className="mt-8 grid w-full grid-cols-4 p-1 backdrop-blur-sm">
            <TabsTrigger
              value="market"
              className="relative data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-md transition-all duration-200 hover:bg-muted/50 dark:hover:bg-gray-700/50 backdrop-blur-sm"
            >
              <span className="relative z-10">Market</span>
            </TabsTrigger>
            <TabsTrigger
              value="limit"
              className="relative data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-md transition-all duration-200 hover:bg-muted/50 dark:hover:bg-gray-700/50 backdrop-blur-sm"
            >
              <span className="relative z-10">Limit</span>
            </TabsTrigger>
            <TabsTrigger
              value="twap"
              className="relative data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-md transition-all duration-200 hover:bg-muted/50 dark:hover:bg-gray-700/50 backdrop-blur-sm"
            >
              <span className="relative z-10">TWAP</span>
            </TabsTrigger>
            <TabsTrigger
              value="options"
              className="relative data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-md transition-all duration-200 hover:bg-muted/50 dark:hover:bg-gray-700/50 backdrop-blur-sm"
            >
              <span className="relative z-10">Options</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="space-y-4">
            <div className="space-y-4 flex flex-col justify-center items-center">
              {/* State Channel Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <Label>Use State Channel</Label>
                  <Badge variant="outline" className="text-xs">
                    {activeChannels} Active
                  </Badge>
                </div>
                <Switch
                  checked={formData.useStateChannel}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, useStateChannel: checked })
                  }
                />
              </div>

              {/* Quote Display */}
              {quote && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Slippage:</span>
                    <span>{formData.slippage}%</span>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Execute Button */}
              <Button
                onClick={handleExecuteTrade}
                disabled={!quote || isLoading}
                size="lg"
                variant="default"
              >
                {isLoading ? (
                  'Processing...'
                ) : formData.useStateChannel ? (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Execute Instant Trade
                  </>
                ) : (
                  'Execute Trade'
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="limit" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Limit Price ({formData.toToken.symbol})</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={formData.limitPrice || ''}
                  onChange={(e) => setFormData({ ...formData, limitPrice: e.target.value })}
                />
              </div>
              <div>
                <Label>Amount ({formData.fromToken.symbol})</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={formData.fromAmount}
                  onChange={(e) => setFormData({ ...formData, fromAmount: e.target.value })}
                />
              </div>
              <Button
                onClick={handleCreateLimitOrder}
                disabled={isLoading || !formData.limitPrice || !formData.fromAmount}
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Limit Order'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="twap" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Total Amount ({formData.fromToken.symbol})</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={formData.fromAmount}
                  onChange={(e) => setFormData({ ...formData, fromAmount: e.target.value })}
                />
              </div>
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
                <Label>Number of Trades</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={formData.twapIntervals || ''}
                  onChange={(e) => setFormData({ ...formData, twapIntervals: parseInt(e.target.value) })}
                />
              </div>
              <Button
                onClick={handleCreateTWAPOrder}
                disabled={isLoading || !formData.fromAmount || !formData.twapDuration || !formData.twapIntervals}
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create TWAP Order'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Option Type</Label>
                <Select
                  value={formData.optionType || 'call'}
                  onValueChange={(value) => setFormData({ ...formData, optionType: value as 'call' | 'put' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call Option</SelectItem>
                    <SelectItem value="put">Put Option</SelectItem>
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
              <div>
                <Label>Premium ({formData.fromToken.symbol})</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={formData.fromAmount}
                  onChange={(e) => setFormData({ ...formData, fromAmount: e.target.value })}
                />
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
                disabled={isLoading || !formData.strikePrice || !formData.fromAmount || !formData.expirationTime}
                className="w-full"
              >
                {isLoading ? 'Creating...' : `Create ${formData.optionType?.toUpperCase()} Option`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 