"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Token, OneInchQuote } from '@/types';
import { BASE_TOKENS, ETH_TOKENS } from '@/config/tokens';
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

interface TradingContextType {
    formData: TradingFormData;
    setFormData: (data: TradingFormData) => void;
    quote: OneInchQuote | null;
    setQuote: (quote: OneInchQuote | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    createOrder: (orderData: any) => Promise<any>;
    getOrders: (maker: string, limit?: number, offset?: number) => Promise<any>;
    deleteOrder: (orderHash: string) => Promise<any>;
    fetchQuote: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider = ({ children }: { children: ReactNode }) => {
    const [formData, setFormData] = useState<TradingFormData>({
        fromToken: BASE_TOKENS['0x4200000000000000000000000000000000000006'],
        toToken: BASE_TOKENS['0x50c5725949a6f0c72e6c4a641f24049a917db0cb'],
        fromAmount: '',
        slippage: 0.5,
        useStateChannel: true,
        orderType: 'market',
    });
    const [quote, setQuote] = useState<OneInchQuote | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { address } = useAccount();

    const createOrder = async (orderData: any) => {
        const response = await fetch('/api/1inch/limitOrder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        return response.json();
    };

    const getOrders = async (maker: string, limit = 20, offset = 0) => {
        const response = await fetch(`/api/1inch/limitOrder/get?maker=${maker}&limit=${limit}&offset=${offset}`);
        return response.json();
    };

    const deleteOrder = async (orderHash: string) => {
        const response = await fetch(`/api/1inch/limitOrder/delete?orderHash=${orderHash}`, {
            method: 'DELETE'
        });
        return response.json();
    };

    const fetchQuote = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { fromToken, toToken, fromAmount } = formData;

            if (!fromAmount || parseFloat(fromAmount) <= 0) {
                setError('Please enter a valid amount');
                return;
            }

            if (!address) {
                setError('Connect your wallet');
                return;
            }

            // Convert amount to wei (assuming 18 decimals)
            const amountInWei = (parseFloat(fromAmount) * 1e18).toString();

            const response = await fetch(
                `/api/1inch/quote?fromTokenAddress=${fromToken.address}&toTokenAddress=${toToken.address}&amount=${amountInWei}&walletAddress=${address}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch quote');
            }

            const quoteData = await response.json();
            setQuote(quoteData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch quote');
            setQuote(null);
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        formData,
        setFormData,
        quote,
        setQuote,
        isLoading,
        setIsLoading,
        error,
        setError,
        createOrder,
        getOrders,
        deleteOrder,
        fetchQuote
    };

    return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};

export const useTrading = () => {
    const context = useContext(TradingContext);
    if (context === undefined) {
        throw new Error('useTrading must be used within a TradingProvider');
    }
    return context;
}; 