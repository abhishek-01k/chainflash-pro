"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BASE_TOKENS, ETH_TOKENS } from '@/config/tokens';
import { useTrading } from '@/contexts/TradingContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const LimitOrder: React.FC = () => {
    const { formData, setFormData, quote, setQuote, fetchQuote, isLoading, error } = useTrading();

    const handleTokenChange = (address: string, isFromToken: boolean) => {
        const token = Object.values(BASE_TOKENS).find(t => t.address === address);
        if (token) {
            setFormData({
                ...formData,
                [isFromToken ? 'fromToken' : 'toToken']: token
            });
        }
    };

    const swapTokens = () => {
        setFormData({
            ...formData,
            fromToken: formData.toToken,
            toToken: formData.fromToken,
            fromAmount: quote ? (Number(quote.toTokenAmount) / Math.pow(10, formData.toToken.decimals)).toString() : '',
        });
        setQuote(null);
    };


    // Auto-quote on amount/token changes
    useEffect(() => {
        if (formData.fromAmount && formData.fromToken && formData.toToken && formData.orderType === 'market') {
            const debounceTimer = setTimeout(() => {
                fetchQuote();
            }, 500);
            return () => clearTimeout(debounceTimer);
        }
    }, [formData.fromAmount, formData.fromToken, formData.toToken, formData.orderType]);




    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-1"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Trade</h2>
                <div className="flex">
                    <button className="px-3 py-1 text-sm font-medium bg-green-500/10 text-green-500 rounded-l-md">Buy</button>
                    <button className="px-3 py-1 text-sm font-medium bg-dark-800 text-dark-400 rounded-r-md">Sell</button>
                </div>
            </div>

            <div className="space-y-6">
                <div className='flex gap-4'>
                    <Select
                        value={formData.fromToken.address}
                        onValueChange={(address) => handleTokenChange(address, true)}
                    >
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select from token" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(BASE_TOKENS).map((token) => (
                                <SelectItem key={token.address} value={token.address}>
                                    {token.symbol}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="number"
                        placeholder="0.0"
                        className='flex-3'
                        value={formData.fromAmount}
                        onChange={(e) =>
                            setFormData({ ...formData, fromAmount: e.target.value })
                        }
                    />

                </div>

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

                <div className='flex gap-4'>
                    <Select
                        value={formData.toToken.address}
                        onValueChange={(address) => handleTokenChange(address, false)}
                    >
                        <SelectTrigger className='flex-1'>
                            <SelectValue placeholder="Select to token" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(BASE_TOKENS).map((token) => (
                                <SelectItem key={token.address} value={token.address}>
                                    {token.symbol}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {isLoading ? (
                        <>
                            loading...
                        </>
                    ) : (
                        <Input
                            type="text"
                            placeholder="0.0"
                            value={quote ? (Number(quote.toTokenAmount) / Math.pow(10, formData.toToken.decimals)).toFixed(6) : ''}
                            readOnly
                            className="bg-muted/50 flex-3"
                        />
                    )}


                </div>
            </div>
        </motion.div>
    );
};

export default LimitOrder;