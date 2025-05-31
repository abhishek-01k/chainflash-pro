'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowDownUp, Zap, Settings, Search, Wallet, Star, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { oneInchService, SUPPORTED_CHAIN_IDS, type SupportedChainId, type OneInchTokenInfo } from '@/lib/services/1inch';
import { useToast } from '@/hooks/use-toast';

interface SwapInterfaceProps {
  className?: string;
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
                <Search className="w-4 h-4" />
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
              Popular tokens
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
              {sortedTokens.map((token) => {
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
            {searchTerm ? `${filteredTokens.length} results` : `${allTokens.length} tokens available`} • 
            Powered by 1inch
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SwapInterface({ className }: SwapInterfaceProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();

  // State management
  const [tokens, setTokens] = useState<Record<string, OneInchTokenInfo>>({});
  const [fromToken, setFromToken] = useState<OneInchTokenInfo | null>(null);
  const [toToken, setToToken] = useState<OneInchTokenInfo | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(1);
  const [useGasless, setUseGasless] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Current chain validation
  const currentChainId = chainId as SupportedChainId;
  const isValidChain = currentChainId && oneInchService.isChainSupported(currentChainId);

  // Load supported tokens for current chain
  useEffect(() => {
    async function loadTokens() {
      if (!isValidChain) return;

      try {
        setIsLoading(true);
        setError(null);
        console.log('Loading tokens for chain:', currentChainId);
        
        const tokensData = await oneInchService.getTokens(currentChainId);
        console.log('Tokens loaded:', Object.keys(tokensData.tokens || tokensData || {}).length);
        
        // Handle both possible response formats - the API returns { tokens: {...} }
        const tokens = tokensData.tokens || tokensData;
        
        // Ensure tokens is a proper Record<string, OneInchTokenInfo>
        if (typeof tokens === 'object' && tokens !== null) {
          setTokens(tokens as unknown as Record<string, OneInchTokenInfo>);
        } else {
          throw new Error('Invalid tokens data format');
        }

        // Set default tokens (ETH and USDC if available)
        const ethToken = Object.values(tokens).find(t => 
          t.symbol === 'ETH' || t.symbol === 'WETH' || 
          t.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
        );
        const usdcToken = Object.values(tokens).find(t => 
          t.symbol === 'USDC'
        );

        if (ethToken) {
          setFromToken(ethToken);
          console.log('Set default from token:', ethToken.symbol);
        }
        if (usdcToken) {
          setToToken(usdcToken);
          console.log('Set default to token:', usdcToken.symbol);
        }

        // If no default tokens found, use first available tokens
        if (!ethToken && !usdcToken) {
          const availableTokens = Object.values(tokens);
          if (availableTokens.length >= 2) {
            setFromToken(availableTokens[0]);
            setToToken(availableTokens[1]);
            console.log('Set fallback tokens:', availableTokens[0].symbol, availableTokens[1].symbol);
          }
        }

      } catch (err: any) {
        console.error('Error loading tokens:', err);
        if (err.message?.includes('Configuration error')) {
          setError('API key not configured. Please check environment variables.');
        } else if (err.message?.includes('Unauthorized')) {
          setError('Invalid API key. Please check your 1inch API key configuration.');
        } else {
          setError(`Failed to load supported tokens: ${err.message || 'Unknown error'}`);
        }
        
        // Load some default tokens as fallback
        const fallbackTokens: Record<string, OneInchTokenInfo> = {
          // Ethereum mainnet defaults
          '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': {
            address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
          },
          '0xA0b86a33E6417c5C6C02A5B63c0aA94c0CCC7c9d': {
            address: '0xA0b86a33E6417c5C6C02A5B63c0aA94c0CCC7c9d',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
          },
        };

        // Chain-specific fallback tokens
        if (currentChainId === 137) { // Polygon
          fallbackTokens['0x0000000000000000000000000000000000001010'] = {
            address: '0x0000000000000000000000000000000000001010',
            symbol: 'MATIC',
            name: 'Polygon',
            decimals: 18,
          };
          fallbackTokens['0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'] = {
            address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            symbol: 'USDC',
            name: 'USD Coin (PoS)',
            decimals: 6,
          };
          fallbackTokens['0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'] = {
            address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
          };
          // Add USDT for better liquidity options
          fallbackTokens['0xc2132D05D31c914a87C6611C10748AEb04B58e8F'] = {
            address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            symbol: 'USDT',
            name: 'Tether USD (PoS)',
            decimals: 6,
          };
        } else if (currentChainId === 8453) { // Base
          fallbackTokens['0x4200000000000000000000000000000000000006'] = {
            address: '0x4200000000000000000000000000000000000006',
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
          };
          fallbackTokens['0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'] = {
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
          };
        }

        setTokens(fallbackTokens);
        
        // Set appropriate default tokens based on chain
        const tokensList = Object.values(fallbackTokens);
        if (tokensList.length >= 2) {
          // For Polygon, default to WETH -> USDC
          if (currentChainId === 137) {
            const wethToken = fallbackTokens['0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'];
            const usdcToken = fallbackTokens['0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'];
            if (wethToken && usdcToken) {
              setFromToken(wethToken);
              setToToken(usdcToken);
            }
          } 
          // For Base, default to WETH -> USDC
          else if (currentChainId === 8453) {
            const wethToken = fallbackTokens['0x4200000000000000000000000000000000000006'];
            const usdcToken = fallbackTokens['0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'];
            if (wethToken && usdcToken) {
              setFromToken(wethToken);
              setToToken(usdcToken);
            }
          }
          // For Ethereum mainnet, default to ETH -> USDC
          else {
            setFromToken(tokensList[0]);
            setToToken(tokensList[1]);
          }
        }

      } finally {
        setIsLoading(false);
      }
    }

    loadTokens();
  }, [currentChainId, isValidChain]);

  // Get quote when inputs change
  const getQuote = useCallback(async () => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      setToAmount('');
      return;
    }

    // Validate token decimals to prevent BigInt conversion errors
    if (typeof fromToken.decimals !== 'number' || fromToken.decimals < 0) {
      console.error('Invalid fromToken decimals:', fromToken.decimals);
      setError('Invalid token configuration: missing decimals');
      return;
    }

    if (typeof toToken.decimals !== 'number' || toToken.decimals < 0) {
      console.error('Invalid toToken decimals:', toToken.decimals);
      setError('Invalid token configuration: missing decimals');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const amount = parseUnits(fromAmount, fromToken.decimals).toString();

      console.log('Getting quote with params:', {
        chainId: currentChainId,
        fromToken: `${fromToken.symbol} (${fromToken.address})`,
        toToken: `${toToken.symbol} (${toToken.address})`,
        amount,
        fromAmount,
        decimals: fromToken.decimals
      });

      let quoteResponse;
      
      if (useGasless && address) {
        // Use Fusion+ for gasless swaps
        quoteResponse = await oneInchService.getFusionPlusQuote({
          chainId: currentChainId,
          src: fromToken.address,
          dst: toToken.address,
          amount,
          walletAddress: address,
          enableEstimate: true,
        });
      } else {
        // Use regular swap quote
        quoteResponse = await oneInchService.getQuote({
          chainId: currentChainId,
          src: fromToken.address,
          dst: toToken.address,
          amount,
          includeTokensInfo: true,
          includeProtocols: true,
        });
      }

      console.log('Raw quote response:', quoteResponse);

      // Handle different possible response formats
      let actualQuoteData: any = quoteResponse;
      
      // If response is wrapped in a data property
      if (quoteResponse && (quoteResponse as any).data && !(quoteResponse as any).toTokenAmount) {
        actualQuoteData = (quoteResponse as any).data;
        console.log('Using nested data response:', actualQuoteData);
      }

      // Check for various possible field names for output amount
      const possibleAmountFields = [
        'toTokenAmount', 
        'toAmount', 
        'dstAmount', 
        'returnAmount',
        'outputAmount',
        'estimatedAmount'
      ];

      let outputAmount = null;
      let outputField = null;

      for (const field of possibleAmountFields) {
        if (actualQuoteData && actualQuoteData[field]) {
          outputAmount = actualQuoteData[field];
          outputField = field;
          break;
        }
      }

      if (!outputAmount) {
        console.error('Quote response missing output amount. Available fields:', Object.keys(actualQuoteData || {}));
        
        // Check if this is an error response
        if (actualQuoteData && actualQuoteData.error) {
          throw new Error(actualQuoteData.error.message || actualQuoteData.error || 'API returned error');
        }
        
        // Check for insufficient liquidity
        if (actualQuoteData && actualQuoteData.message && actualQuoteData.message.includes('liquidity')) {
          throw new Error('Insufficient liquidity for this token pair. Try a different amount or token pair.');
        }

        throw new Error('Invalid quote response: no output amount found. This may be due to insufficient liquidity or an unsupported token pair.');
      }

      console.log(`Found output amount in field '${outputField}':`, outputAmount);

      setQuote(actualQuoteData);

      // Calculate and set the output amount with proper validation
      const formattedAmount = formatUnits(
        BigInt(outputAmount), 
        toToken.decimals
      );
      setToAmount(formattedAmount);

      console.log('Quote processed successfully:', {
        inputAmount: fromAmount,
        outputAmount: formattedAmount,
        field: outputField
      });

    } catch (err: any) {
      console.error('Error getting quote:', err);
      
      // Enhanced error handling based on 1inch documentation
      if (err.message?.includes('Cannot convert') && err.message?.includes('BigInt')) {
        setError('Invalid token amount or configuration. Please check your input.');
      } else if (err.message?.includes('liquidity')) {
        setError('Insufficient liquidity for this token pair. Try a smaller amount or different tokens.');
      } else if (err.message?.includes('rate limit') || err.message?.includes('429')) {
        setError('API rate limit exceeded. Please wait a moment and try again.');
      } else if (err.message?.includes('Cannot sync token')) {
        setError('Invalid token selected. The token may not exist on this network.');
      } else if (err.message?.includes('Amount is not set')) {
        setError('Please enter a valid amount to swap.');
      } else {
        setError(err.message || 'Failed to get swap quote');
      }
      setToAmount('');
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [fromToken, toToken, fromAmount, useGasless, address, currentChainId]);

  // Debounced quote fetching
  useEffect(() => {
    const timeoutId = setTimeout(getQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [getQuote]);

  // Execute swap
  const handleSwap = async () => {
    if (!address || !fromToken || !toToken || !fromAmount) return;

    // Validate token decimals to prevent BigInt conversion errors
    if (typeof fromToken.decimals !== 'number' || fromToken.decimals < 0) {
      console.error('Invalid fromToken decimals:', fromToken.decimals);
      setError('Invalid token configuration: missing decimals');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const amount = parseUnits(fromAmount, fromToken.decimals).toString();

      if (useGasless) {
        // Execute Fusion+ gasless swap
        toast({
          title: 'Gasless Swap Initiated',
          description: 'Your Fusion+ swap is being processed...',
        });
        
        // In a real implementation, you would:
        // 1. Get the quote with a specific quoteId
        // 2. Sign the order
        // 3. Submit the order
        console.log('Fusion+ swap would be executed here');
        
      } else {
        // Execute regular swap
        const swapData = await oneInchService.getSwap({
          chainId: currentChainId,
          src: fromToken.address,
          dst: toToken.address,
          amount,
          from: address,
          slippage,
          includeTokensInfo: true,
          disableEstimate: false,
          allowPartialFill: true,
        });

        // In a real implementation, you would execute the transaction here
        console.log('Swap transaction data:', swapData.tx);
        
        toast({
          title: 'Swap Prepared',
          description: 'Transaction data ready for execution',
        });
      }

    } catch (err: any) {
      console.error('Error executing swap:', err);
      if (err.message?.includes('Cannot convert') && err.message?.includes('BigInt')) {
        setError('Invalid token amount or configuration. Please check your input.');
      } else {
        setError(err.message || 'Failed to execute swap');
      }
      toast({
        title: 'Swap Failed',
        description: err.message || 'Failed to execute swap',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Swap token positions
  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount('');
    setQuote(null);
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to use the swap interface.
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
              Please switch to a supported network: {Object.entries(SUPPORTED_CHAIN_IDS)
                .map(([key, id]) => oneInchService.getChainName(id))
                .join(', ')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Swap Tokens</span>
            <Badge variant="outline" className="text-xs">
              {oneInchService.getChainName(currentChainId)}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={useGasless ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseGasless(!useGasless)}
              className="transition-all"
            >
              <Zap className={`h-4 w-4 mr-1 ${useGasless ? 'text-yellow-400' : ''}`} />
              {useGasless ? 'Gasless' : 'Regular'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* From Token */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">From</label>
            <div className="flex items-center text-xs text-muted-foreground">
              <Wallet className="w-3 h-3 mr-1" />
              Balance: 0.00
            </div>
          </div>
          <TokenSelector
            value={fromToken}
            onChange={setFromToken}
            label="source"
            tokens={tokens}
            otherToken={toToken}
          />
          <Input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => {
              const value = e.target.value;
              // Validate input to prevent BigInt conversion errors
              if (value === '' || value === '0' || /^\d*\.?\d*$/.test(value)) {
                // Only allow valid decimal numbers
                setFromAmount(value);
              }
            }}
            className="text-lg h-12 text-right bg-muted/30 border-muted"
            step="any"
            min="0"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-px bg-border"></div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapTokens}
            disabled={isLoading}
            className="relative bg-background hover:bg-accent border-2 shadow-sm"
          >
            <ArrowDownUp className={`h-4 w-4 transition-transform ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">To</label>
            <div className="flex items-center text-xs text-muted-foreground">
              <Wallet className="w-3 h-3 mr-1" />
              Balance: 0.00
            </div>
          </div>
          <TokenSelector
            value={toToken}
            onChange={setToToken}
            label="destination"
            tokens={tokens}
            otherToken={fromToken}
          />
          <Input
            type="number"
            placeholder="0.0"
            value={toAmount}
            readOnly
            className="text-lg h-12 text-right bg-muted/50 border-muted cursor-not-allowed"
          />
        </div>

        {/* Slippage Settings */}
        {!useGasless && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Slippage Tolerance</label>
            <div className="flex space-x-2">
              {[0.5, 1, 2, 5].map((value) => (
                <Button
                  key={value}
                  variant={slippage === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSlippage(value)}
                  className="flex-1"
                >
                  {value}%
                </Button>
              ))}
              <div className="flex items-center space-x-1">
                <Input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 1)}
                  className="w-16 h-8 text-sm"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        )}

        {/* Quote Information */}
        {quote && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3 border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Exchange Rate:</span>
              <span className="font-medium">
                1 {fromToken?.symbol} = {
                  (parseFloat(toAmount) / parseFloat(fromAmount || '1')).toFixed(6)
                } {toToken?.symbol}
              </span>
            </div>
            {!useGasless && quote.estimatedGas && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Gas:</span>
                <span className="font-medium">{parseInt(quote.estimatedGas).toLocaleString()}</span>
              </div>
            )}
            {useGasless && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Gas Fee:</span>
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-green-500" />
                  <span className="font-medium text-green-600">FREE (Gasless)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={!fromToken || !toToken || !fromAmount || !toAmount || isLoading}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          ) : useGasless ? (
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Swap (Gasless)</span>
            </div>
          ) : (
            'Swap'
          )}
        </Button>

        {/* Footer Information */}
        {useGasless && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-green-600 bg-green-50 dark:bg-green-950 px-3 py-2 rounded-full">
              <Zap className="w-4 h-4" />
              <span>Gasless swap powered by 1inch Fusion+</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 