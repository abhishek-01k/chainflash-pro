'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowDownUp, Zap, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { oneInchService, SUPPORTED_CHAIN_IDS, type SupportedChainId, type OneInchTokenInfo } from '@/lib/services/1inch';
import { useToast } from '@/hooks/use-toast';

interface SwapInterfaceProps {
  className?: string;
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
        setTokens(fallbackTokens);
        setFromToken(fallbackTokens['0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE']);
        setToToken(fallbackTokens['0xA0b86a33E6417c5C6C02A5B63c0aA94c0CCC7c9d']);
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

    try {
      setIsLoading(true);
      setError(null);

      const amount = parseUnits(fromAmount, fromToken.decimals).toString();

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

      setQuote(quoteResponse);
      
      // Calculate and set the output amount
      const outputAmount = formatUnits(
        BigInt(quoteResponse.toTokenAmount), 
        toToken.decimals
      );
      setToAmount(outputAmount);

    } catch (err: any) {
      console.error('Error getting quote:', err);
      setError(err.message || 'Failed to get swap quote');
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
      setError(err.message || 'Failed to execute swap');
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

  // Render token selector
  const renderTokenSelector = (
    value: OneInchTokenInfo | null,
    onChange: (token: OneInchTokenInfo) => void,
    label: string
  ) => (
    <Select
      value={value?.address || ''}
      onValueChange={(address) => {
        const token = tokens[address];
        if (token) onChange(token);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={`Select ${label} token`} />
      </SelectTrigger>
      <SelectContent>
        {Object.values(tokens).slice(0, 20).map((token) => (
          <SelectItem key={token.address} value={token.address}>
            <div className="flex items-center space-x-2">
              {token.logoURI && (
                <img 
                  src={token.logoURI} 
                  alt={token.symbol}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span>{token.symbol}</span>
              <span className="text-sm text-muted-foreground">{token.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Swap Tokens</span>
          <div className="flex items-center space-x-2">
            <Badge variant={useGasless ? 'default' : 'secondary'}>
              {useGasless ? 'Gasless' : 'Regular'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseGasless(!useGasless)}
            >
              <Zap className="h-4 w-4 mr-1" />
              {useGasless ? 'Disable' : 'Enable'} Gasless
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* From Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
          {renderTokenSelector(fromToken, setFromToken, 'source')}
          <Input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapTokens}
            disabled={isLoading}
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium">To</label>
          {renderTokenSelector(toToken, setToToken, 'destination')}
          <Input
            type="number"
            placeholder="0.0"
            value={toAmount}
            readOnly
            className="text-lg bg-muted"
          />
        </div>

        {/* Slippage Settings */}
        {!useGasless && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Slippage Tolerance</label>
            <div className="flex space-x-2">
              {[0.5, 1, 2, 5].map((value) => (
                <Button
                  key={value}
                  variant={slippage === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSlippage(value)}
                >
                  {value}%
                </Button>
              ))}
              <Input
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 1)}
                className="w-20"
              />
            </div>
          </div>
        )}

        {/* Quote Information */}
        {quote && (
          <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Exchange Rate:</span>
              <span>
                1 {fromToken?.symbol} = {
                  (parseFloat(toAmount) / parseFloat(fromAmount || '1')).toFixed(6)
                } {toToken?.symbol}
              </span>
            </div>
            {!useGasless && quote.estimatedGas && (
              <div className="flex justify-between">
                <span>Estimated Gas:</span>
                <span>{parseInt(quote.estimatedGas).toLocaleString()}</span>
              </div>
            )}
            {useGasless && (
              <div className="flex justify-between">
                <span>Gas Fee:</span>
                <span className="text-green-600">FREE (Gasless)</span>
              </div>
            )}
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={!fromToken || !toToken || !fromAmount || !toAmount || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Loading...' : useGasless ? 'Swap (Gasless)' : 'Swap'}
        </Button>

        {/* Chain Information */}
        <div className="text-center text-sm text-muted-foreground">
          Trading on {oneInchService.getChainName(currentChainId)}
          {useGasless && (
            <div className="text-green-600 mt-1">
              ⚡ Gasless swap powered by 1inch Fusion+
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 