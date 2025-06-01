import oneInchService, { OneInchTokenInfo, SupportedChainId } from '@/lib/services/1inch';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Loader2, Plus, RefreshCw, Target } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatUnits } from 'viem';
import { cn } from '@/lib/utils';


type MyOrderProps = {
    isLoading: boolean
    tokens: Record<string, OneInchTokenInfo>
}
const MyOrders = ({
    isLoading,
    tokens
}: MyOrderProps) => {
    console.log('MyOrders component rendered');

    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const hasMounted = useRef(false);

    const [activeOrders, setActiveOrders] = useState<any[]>([]);

    const currentChainId = chainId as SupportedChainId;
    const isValidChain = currentChainId && oneInchService.isChainSupported(currentChainId);

    // Helper function to refresh active orders
    const refreshActiveOrders = async () => {
        if (!address || !currentChainId) return;

        try {
            const response = await fetch(`/api/1inch/limit-orders/active?address=${address}&chainId=${currentChainId}`);

            if (response.ok) {
                const data = await response.json();
                console.log("data >>", data);

                setActiveOrders(data || []);
            }
        } catch (error) {
            console.error('Error refreshing active orders:', error);
        }
    };

    // Load active orders for current user
    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            refreshActiveOrders();
        }
    }, []);

    const getTokenName = (tokenAddress: string, tokens: Record<string, OneInchTokenInfo>): string => {
        const token = tokens[tokenAddress.toLowerCase()];
        return token ? token.symbol : tokenAddress;
    };

    const getTokenDecimals = (tokenAddress: string, tokens: Record<string, OneInchTokenInfo>): number => {
        const token = tokens[tokenAddress.toLowerCase()];
        return token ? token.decimals : 18;
    };

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between space-x-2">
                    <div>
                        <Clock className="h-5 w-5" />
                        <span>My Active Orders</span>
                        <Badge variant="outline" className="text-xs">
                            {activeOrders.length} orders
                        </Badge>
                    </div>

                    <Button
                        onClick={refreshActiveOrders}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className='hover:bg-gray-500/10 transition-colors'
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </Button>
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
                                                {getTokenName(order.data?.makerAsset, tokens)} → {getTokenName(order.data?.takerAsset, tokens)}
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                Limit
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Pay: {formatUnits(BigInt(order.data?.makingAmount || 0), getTokenDecimals(order.data?.makerAsset, tokens))} {getTokenName(order.data?.makerAsset, tokens)} •
                                            Receive: {formatUnits(BigInt(order.data?.takingAmount || 0), getTokenDecimals(order.data?.takerAsset, tokens))} {getTokenName(order.data?.takerAsset, tokens)}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            Hash: {order.orderHash?.slice(0, 20)}...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MyOrders;