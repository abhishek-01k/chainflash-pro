"use client";

import { SwapInterface } from '@/components/1inch/SwapInterface';
import { LimitOrderInterface } from '@/components/1inch/LimitOrderInterface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useCallback } from 'react';
import oneInchService, { OneInchTokenInfo, SupportedChainId } from '@/lib/services/1inch';
import { useChainId, useAccount } from 'wagmi';
import { formatUnits } from 'viem';

export default function TradingPage() {
  const chainId = useChainId();
  const { address } = useAccount();

  const [tokens, setTokens] = useState<Record<string, OneInchTokenInfo>>({});
  const [balances, setBalances] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromToken, setFromToken] = useState<OneInchTokenInfo | null>(null);
  const [toToken, setToToken] = useState<OneInchTokenInfo | null>(null);

  // Current chain validation
  const currentChainId = chainId as SupportedChainId;
  const isValidChain = currentChainId && oneInchService.isChainSupported(currentChainId);

  // Function to fetch balances
  const fetchBalances = async () => {
    if (!address || !currentChainId || !tokens) return;

    try {
      const balanceResponse = await oneInchService.getBalances(currentChainId, address);
      console.log("balanceResponse", balanceResponse);
      const formattedBalances: Record<string, string> = {};

      // Format balances for each token
      Object.entries(balanceResponse).forEach(([tokenAddress, balance]) => {
        const token = tokens[tokenAddress];
        if (token) {
          // Format the balance using the token's decimals and limit to 3 decimal places
          const formattedBalance = formatUnits(BigInt(balance), token.decimals);
          formattedBalances[tokenAddress] = Number(formattedBalance).toFixed(3);
        }
      });

      setBalances(formattedBalances);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to fetch token balances');
    }
  };

  // Fetch balances when tokens or address changes
  useEffect(() => {
    if (Object.keys(tokens).length > 0 && address) {
      fetchBalances();
    }
  }, [tokens, address]);

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

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Professional Trading</h1>
        <p className="text-muted-foreground">
          Advanced trading with 1inch integration - Market swaps, Limit orders, and Fusion+ gasless trading
        </p>
      </div>

      <Tabs defaultValue="market">
        <div className="">
          <TabsList className="grid w-[250px] grid-cols-2">
            <TabsTrigger value="market" className="data-[state=active]:bg-gradient-to-r  dark:data-[state=active]:bg-gradient-to-r from-teal-500 to-purple-600 rounded-lg ">Market Swaps</TabsTrigger>
            <TabsTrigger value="limit" className="data-[state=active]:bg-gradient-to-r dark:data-[state=active]:bg-gradient-to-r from-teal-500 to-purple-600 rounded-lg">Limit Orders</TabsTrigger>
          </TabsList>
        </div>
        {isLoading || !fromToken || !toToken ? (
          <>
            Loading...
          </>
        ) : (
          <>
            <TabsContent value="market" className="mt-6 max-w-[650px] mx-auto">
              <SwapInterface
                fromToken={fromToken}
                toToken={toToken}
                setFromToken={setFromToken}
                setToToken={setToToken}
                tokens={tokens}
                setTokens={setTokens}
                balances={balances}
              />
            </TabsContent>
            <TabsContent value="limit" className="mt-6">
              <LimitOrderInterface
                tokens={tokens}
                setTokens={setTokens}
                makerToken={fromToken}
                takerToken={toToken}
                setMakerToken={setFromToken}
                setTakerToken={setToToken}
                balances={balances}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}