import { SwapInterface } from '@/components/1inch/SwapInterface';
import { LimitOrderInterface } from '@/components/1inch/LimitOrderInterface';

export default function TradingPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Professional Trading</h1>
        <p className="text-muted-foreground">
          Advanced trading with 1inch integration - Market swaps, Limit orders, and Fusion+ gasless trading
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Market Swaps */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Market Swaps</h2>
          <SwapInterface />
        </div>
        
        {/* Limit Orders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Limit Orders</h2>
          <LimitOrderInterface />
        </div>
      </div>
    </div>
  );
}