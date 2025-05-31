import { Metadata } from "next"
import { TradingInterface } from "@/components/trading/trading-interface"
import { PriceChart } from "@/components/charts/price-chart"
import { StateChannelManager } from "@/components/trading/state-channel-manager"
import { ArbitrageAlerts } from "@/components/trading/arbitrage-alerts"
import { OrderBook } from "@/components/trading/order-book"
import { Portfolio } from "@/components/trading/portfolio"

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "Professional cross-chain trading with instant settlements",
}

export default function IndexPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Header Section */}
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

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="space-y-6">
            {/* State Channel Manager */}
            <StateChannelManager />

            {/* Order Book */}
            <OrderBook />

            {/* Arbitrage Alerts */}
            <ArbitrageAlerts />
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="lg:col-span-12">
          <Portfolio />
        </div>
      </div>
    </div>
  )
}
