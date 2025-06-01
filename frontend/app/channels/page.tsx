import { ArbitrageAlerts } from '@/components/trading/arbitrage-alerts';
import { OrderBook } from '@/components/trading/order-book';
import { Portfolio } from '@/components/trading/portfolio';
import { StateChannelManager } from '@/components/trading/state-channel-manager';
import React from 'react';

const ChannelPage = () => {
    return (
        <div className="flex flex-col gap-4 sm:gap-6 max-w-[1200px] mx-auto mt-12 sm:mt-16 md:mt-24 px-3 sm:px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <StateChannelManager />
                <ArbitrageAlerts />
            </div>

            <div className="flex flex-col gap-4 sm:gap-6">
                <OrderBook />
                <Portfolio />
            </div>
        </div>
    );
};

export default ChannelPage;