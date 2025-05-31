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
import { useToast } from '@/hooks/use-toast';

interface LimitOrderInterfaceProps {
  className?: string;
}

interface LimitOrder {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
  allowedSender: string;
}

interface OrderData {
  order: LimitOrder;
  signature: string;
  orderHash: string;
  status: 'draft' | 'signing' | 'signed' | 'submitting' | 'submitted' | 'error';
}

interface TokenSelectorProps {
  value: OneInchTokenInfo | null;
  onChange: (token: OneInchTokenInfo) => void;
  label: string;
  tokens: Record<string, OneInchTokenInfo>;
  otherToken?: OneInchTokenInfo | null;
}

function TokenSelector({ value, onChange, label, tokens, otherToken }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const allTokens = Object.values(tokens);
  
  // Filter tokens based on search term
  const filteredTokens = allTokens.filter(token => 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort tokens by popularity and relevance
  const sortedTokens = filteredTokens.sort((a, b) => {
    // Priority tokens appear first
    const priorityTokens = ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'LINK', 'UNI'];
    const aPriority = priorityTokens.indexOf(a.symbol);
    const bPriority = priorityTokens.indexOf(b.symbol);
    
    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority;
    }
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    
    return a.symbol.localeCompare(b.symbol);
  });

  const handleTokenSelect = (token: OneInchTokenInfo) => {
    onChange(token);
    setOpen(false);
    setSearchTerm('');
  };

  const isPriority = (symbol: string) => {
    return ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC'].includes(symbol);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-auto p-4 justify-start hover:bg-accent/50 transition-colors"
        >
          {value ? (
            <div className="flex items-center space-x-3 w-full">
              <div className="relative">
                {value.logoURI ? (
                  <img 
                    src={value.logoURI} 
                    alt={value.symbol}
                    className="w-8 h-8 rounded-full ring-2 ring-background shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {value.symbol.slice(0, 2)}
                    </span>
                  </div>
                )}
                {isPriority(value.symbol) && (
                  <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 fill-current" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-base">{value.symbol}</div>
                <div className="text-sm text-muted-foreground truncate max-w-[140px]">
                  {value.name}
                </div>
              </div>
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Wallet className="w-4 h-4" />
                <span className="text-xs">Select</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 w-full text-muted-foreground">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Select {label} token</div>
                <div className="text-sm">Choose from {allTokens.length} tokens</div>
              </div>
            </div>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[600px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <span>Select {label} token</span>
            <Badge variant="secondary" className="text-xs">
              {filteredTokens.length} available
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, symbol, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-none focus:bg-background transition-colors"
            />
          </div>
        </div>

        {/* Popular Tokens */}
        {!searchTerm && (
          <div className="px-6 pb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular for limit orders
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {sortedTokens.slice(0, 8).filter(token => isPriority(token.symbol)).map((token) => (
                <Button
                  key={token.address}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTokenSelect(token)}
                  disabled={otherToken?.address === token.address}
                  className="flex flex-col items-center p-3 h-auto hover:bg-accent/50 disabled:opacity-50"
                >
                  {token.logoURI ? (
                    <img 
                      src={token.logoURI} 
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full mb-1"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                      <span className="text-xs font-bold text-primary">
                        {token.symbol.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <span className="text-xs font-medium">{token.symbol}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Token List */}
        <div className="flex-1 overflow-y-auto max-h-[300px] border-t">
          {sortedTokens.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No tokens found</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {sortedTokens.slice(0, 50).map((token) => {
                const isDisabled = otherToken?.address === token.address;
                const isSelected = value?.address === token.address;
                
                return (
                  <button
                    key={token.address}
                    onClick={() => !isDisabled && handleTokenSelect(token)}
                    disabled={isDisabled}
                    className={`
                      w-full p-3 rounded-lg flex items-center space-x-3 text-left 
                      transition-all duration-200 hover:bg-accent/50
                      ${isSelected ? 'bg-primary/10 border-2 border-primary/20' : ''}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="relative">
                      {token.logoURI ? (
                        <img 
                          src={token.logoURI} 
                          alt={token.symbol}
                          className="w-10 h-10 rounded-full ring-2 ring-background shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {token.symbol.slice(0, 2)}
                          </span>
                        </div>
                      )}
                      {isPriority(token.symbol) && (
                        <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-base">{token.symbol}</span>
                        {isPriority(token.symbol) && (
                          <Badge variant="secondary" className="text-xs px-2 py-0">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {token.name}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground font-mono">
                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
                      </div>
                      {isDisabled && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Selected above
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {searchTerm ? `${filteredTokens.length} results` : `${Math.min(allTokens.length, 50)} tokens shown`} • 
            Powered by 1inch
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LimitOrderInterface({ className }: LimitOrderInterfaceProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  const { signTypedData, isPending: isSigningPending } = useSignTypedData();

  // State management
  const [tokens, setTokens] = useState<Record<string, OneInchTokenInfo>>({});
  const [makerToken, setMakerToken] = useState<OneInchTokenInfo | null>(null);
  const [takerToken, setTakerToken] = useState<OneInchTokenInfo | null>(null);
  const [makerAmount, setMakerAmount] = useState('');
  const [takerAmount, setTakerAmount] = useState('');
  const [orderType, setOrderType] = useState<'limit' | 'twap' | 'stop'>('limit');
  const [expiration, setExpiration] = useState('3600'); // 1 hour default
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  currentOrder && console.log('currentOrder', currentOrder);
  // Current chain validation
  const currentChainId = chainId as SupportedChainId;
  const isValidChain = currentChainId && oneInchService.isChainSupported(currentChainId);

  // 1inch Limit Order Protocol Contract Addresses
  const LIMIT_ORDER_PROTOCOL_ADDRESS = {
    1: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // Ethereum
    56: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // BSC
    137: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // Polygon
    42161: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // Arbitrum
    10: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // Optimism
    8453: '0x119c71D3BbAC22029622cbaEc24854d3D32D2828', // Base
  };

  // Load supported tokens for current chain
  useEffect(() => {
    async function loadTokens() {
      if (!isValidChain) return;

      try {
        setIsLoading(true);
        setError(null);
        console.log('Loading tokens for limit orders...');
        
        const tokensData = await oneInchService.getTokens(currentChainId);
        const tokens = tokensData.tokens || tokensData;
        
        if (typeof tokens === 'object' && tokens !== null) {
          setTokens(tokens as unknown as Record<string, OneInchTokenInfo>);
        }

        // Set default tokens
        const ethToken = Object.values(tokens).find(t => 
          t.symbol === 'ETH' || t.symbol === 'WETH' || 
          t.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
        );
        const usdcToken = Object.values(tokens).find(t => 
          t.symbol === 'USDC'
        );

        if (ethToken) setMakerToken(ethToken);
        if (usdcToken) setTakerToken(usdcToken);

      } catch (err: any) {
        console.error('Error loading tokens:', err);
        setError(`Failed to load tokens: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadTokens();
  }, [currentChainId, isValidChain]);

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

  // Generate order salt (unique identifier)
  const generateOrderSalt = useCallback(() => {
    const timestamp = Math.floor(Date.now() / 1000);
    const random = Math.floor(Math.random() * 1000000);
    
    // Create a simple hash using timestamp and random number
    const saltString = `${timestamp}-${random}`;
    return keccak256(`0x${Buffer.from(saltString).toString('hex')}` as `0x${string}`);
  }, []);

  // Generate maker traits (order parameters)
  const generateMakerTraits = useCallback((expiration: number) => {
    // MakerTraits encoding for 1inch Limit Order Protocol
    // Bit 0: allowPartialFill
    // Bit 1: allowPriceImprovement  
    // Bit 2-4: expiration type
    // Bit 5-255: expiration timestamp
    
    const allowPartialFill = 1; // Allow partial fills
    const allowPriceImprovement = 1; // Allow price improvement
    const expirationTimestamp = Math.floor(Date.now() / 1000) + expiration;
    
    // Pack traits into a single uint256
    let traits = BigInt(0);
    traits |= BigInt(allowPartialFill);
    traits |= BigInt(allowPriceImprovement) << BigInt(1);
    traits |= BigInt(expirationTimestamp) << BigInt(5);
    
    return `0x${traits.toString(16).padStart(64, '0')}`;
  }, []);

  // Create limit order structure
  const createLimitOrder = useCallback(async () => {
    if (!address || !makerToken || !takerToken || !makerAmount || !takerAmount) {
      throw new Error('Missing required order parameters');
    }

    const salt = generateOrderSalt();
    const makerTraits = generateMakerTraits(parseInt(expiration));
    
    const order: LimitOrder = {
      salt,
      maker: address,
      receiver: "0x0000000000000000000000000000000000000000", // Can be different for advanced use cases
      makerAsset: makerToken.address,
      takerAsset: takerToken.address,
      makingAmount: parseUnits(makerAmount, makerToken.decimals).toString(),
      takingAmount: parseUnits(takerAmount, takerToken.decimals).toString(),
      makerTraits,
      allowedSender: "0x0000000000000000000000000000000000000000"
    };

    return order;
  }, [address, makerToken, takerToken, makerAmount, takerAmount, expiration, generateOrderSalt, generateMakerTraits]);

  // Generate order hash
  const generateOrderHash = useCallback((order: LimitOrder) => {
    // This follows the 1inch Limit Order Protocol hash generation
    const domain = {
      name: '1inch Limit Order Protocol',
      version: '4',
      chainId: currentChainId,
      verifyingContract: LIMIT_ORDER_PROTOCOL_ADDRESS[currentChainId as keyof typeof LIMIT_ORDER_PROTOCOL_ADDRESS] as `0x${string}`,
    };

    const types = {
      Order: [
        { name: 'salt', type: 'uint256' },
        { name: 'maker', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'makerAsset', type: 'address' },
        { name: 'takerAsset', type: 'address' },
        { name: 'makingAmount', type: 'uint256' },
        { name: 'takingAmount', type: 'uint256' },
        { name: 'makerTraits', type: 'uint256' },
      ],
    };

    return { domain, types, order };
  }, [currentChainId]);

  // Sign order
  const handleSignOrder = useCallback(async (order: LimitOrder) => {
    if (!signTypedData) {
      throw new Error('Wallet does not support typed data signing');
    }

    const { domain, types } = generateOrderHash(order);
    
    setCurrentOrder(prev => prev ? { ...prev, status: 'signing' } : null);

    try {
      const signature = await new Promise<string>((resolve, reject) => {
        signTypedData({
          domain,
          types,
          primaryType: 'Order',
          message: order as any,
        }, {
          onSuccess: (data) => resolve(data),
          onError: (error) => reject(error),
        });
      });

      return signature;
    } catch (error) {
      setCurrentOrder(prev => prev ? { ...prev, status: 'error' } : null);
      throw error;
    }
  }, [signTypedData, generateOrderHash]);

  // Submit order to 1inch
  const handleSubmitOrder = useCallback(async (order: LimitOrder, signature: string, orderHash: string) => {
    setCurrentOrder(prev => prev ? { ...prev, status: 'submitting' } : null);

    try {
      const result = await oneInchService.createLimitOrder({
        chainId: currentChainId,
        orderHash,
        signature,
        data: {
          makerAsset: order.makerAsset,
          takerAsset: order.takerAsset,
          maker: order.maker,
          receiver: order.receiver,
          makingAmount: order.makingAmount,
          takingAmount: order.takingAmount,
          salt: order.salt,
          extension: '0x', // Default extension
          makerTraits: order.makerTraits,
          allowedSender: order.allowedSender
        },
      });

      setCurrentOrder(prev => prev ? { ...prev, status: 'submitted' } : null);
      
      toast({
        title: 'Limit Order Created',
        description: `Order submitted successfully!`,
      });

      // Refresh active orders
      const orders = await oneInchService.getActiveOrders(currentChainId, address!);
      setActiveOrders(orders);

      return result;
    } catch (error) {
      setCurrentOrder(prev => prev ? { ...prev, status: 'error' } : null);
      throw error;
    }
  }, [currentChainId, address, toast]);

  // Complete order creation flow
  const handleCreateOrder = useCallback(async () => {
    if (!address || !makerToken || !takerToken) return;

    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Create order structure
      const order = await createLimitOrder();
      console.log('Created order:', order);

      // Step 2: Generate order hash (simplified for now)
      const orderHash = keccak256(`0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}` as `0x${string}`);

      setCurrentOrder({
        order,
        signature: '',
        orderHash,
        status: 'draft',
      });

      // Step 3: Sign order
      const signature = await handleSignOrder(order);
      console.log('Order signed:', signature);

      setCurrentOrder(prev => prev ? { ...prev, signature, status: 'signed' } : null);

      // Step 4: Submit to 1inch
      await handleSubmitOrder(order, signature, orderHash);

    } catch (err: any) {
      console.error('Error creating limit order:', err);
      setError(err.message || 'Failed to create limit order');
      setCurrentOrder(prev => prev ? { ...prev, status: 'error' } : null);
      
      toast({
        title: 'Order Creation Failed',
        description: err.message || 'Failed to create limit order',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, makerToken, takerToken, createLimitOrder, handleSignOrder, handleSubmitOrder, toast]);

  // Cancel order
  const handleCancelOrder = useCallback(async (orderHash: string) => {
    try {
      setIsLoading(true);
      await oneInchService.cancelLimitOrder(currentChainId, orderHash);
      
      toast({
        title: 'Order Cancelled',
        description: 'Limit order has been cancelled successfully',
      });

      // Refresh active orders
      const orders = await oneInchService.getActiveOrders(currentChainId, address!);
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
  }, [currentChainId, address, toast]);

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
                  <SelectTrigger className="h-12 bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limit">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Limit Order</div>
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
                    Balance: 0.00
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
                    Balance: 0.00
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
                              {order.order?.makerAsset} → {order.order?.takerAsset}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Limit
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Pay: {formatUnits(BigInt(order.order?.makingAmount || 0), 18)} • 
                            Receive: {formatUnits(BigInt(order.order?.takingAmount || 0), 18)}
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