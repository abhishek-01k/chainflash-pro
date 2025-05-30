"use client";

import LimitOrder from '@/components/trading/limitOrder/LimitOrder';
import { TradingInterface } from '@/components/trading/trading-interface';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTrading } from '@/contexts/TradingContext';
import React from 'react';

const TradingPage = () => {
    // Create a limit order
    const createOrder = async (orderData: any) => {
        const response = await fetch('/api/1inch/limitOrder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        return response.json();
    };

    // Get limit orders
    const getOrders = async (maker: string, limit = 20, offset = 0) => {
        const response = await fetch(`/api/1inch/limitOrder/get?maker=${maker}&limit=${limit}&offset=${offset}`);
        return response.json();
    };

    // Delete a limit order
    const deleteOrder = async (orderHash: string) => {
        const response = await fetch(`/api/1inch/limitOrder/delete?orderHash=${orderHash}`, {
            method: 'DELETE'
        });
        return response.json();
    };

    return (
        <div className="space-y-4 p-4">
            <TradingInterface />
        </div>
    );
};

export default TradingPage;