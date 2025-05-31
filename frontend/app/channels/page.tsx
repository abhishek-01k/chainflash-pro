import { ArbitrageAlerts } from '@/components/trading/arbitrage-alerts';
import { OrderBook } from '@/components/trading/order-book';
import { Portfolio } from '@/components/trading/portfolio';
import { StateChannelManager } from '@/components/trading/state-channel-manager';
import React from 'react';

const ChannelPage = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        ChainFlash Pro
                    </h1>
                    <p className="text-muted-foreground">
                        Cross-chain state channel trading with instant settlements
                    </p>
                </div>
            </div>

            <div className="lg:col-span-4">
                <div className="space-y-6">
                    <StateChannelManager />

                    <OrderBook />

                    <ArbitrageAlerts />
                </div>
            </div>

            <div className="lg:col-span-12">
                <Portfolio />
            </div>
        </div>
    );
};

export default ChannelPage;