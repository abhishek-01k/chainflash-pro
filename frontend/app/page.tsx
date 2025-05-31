import { Metadata } from "next"
import { TradingInterface } from "@/components/trading/trading-interface"
import { PriceChart } from "@/components/charts/price-chart"
import { StateChannelManager } from "@/components/trading/state-channel-manager"
import { ArbitrageAlerts } from "@/components/trading/arbitrage-alerts"
import { OrderBook } from "@/components/trading/order-book"
import { Portfolio } from "@/components/trading/portfolio"
import HomePage from "@/components/homePage/HomePage"

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "Professional cross-chain trading with instant settlements",
}

export default function IndexPage() {
  return (
    <div className="px-4 py-6">
      <HomePage />
    </div>
  )
}
