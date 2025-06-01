'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { pythService } from '@/lib/services/pyth';
import { cn } from '@/lib/utils';

interface ArbitrageOpportunity {
  tokenPair: string;
  chain1: string;
  chain2: string;
  price1: number;
  price2: number;
  priceDifference: number;
  percentageDiff: number;
  estimatedProfit: number;
  gasEstimate: number;
  timestamp: number;
}

export function ArbitrageAlerts() {
  const [alerts, setAlerts] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const findArb = async () => {
    try {
      setIsLoading(true);
      const res = await pythService.detectArbitrageOpportunities();
      setAlerts(res);
      console.log("Res", res);
    } catch (error) {
      console.log("Error", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    findArb();
  }, []);

  return (
    <Card className='h-[600px] relative overflow-auto bg-gradient-to-b from-background to-muted/20 py-0'>
      <CardHeader className='sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10'>
        <CardTitle className="flex items-center justify-between gap-2 pt-4">
          <div className='flex items-center gap-2'>
            <TrendingUp className="h-5 w-5 text-green-500 animate-pulse" />
            <span className='bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent font-bold'>
              Arbitrage Opportunities
            </span>
          </div>
          <Button
            onClick={findArb}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className='hover:bg-green-500/10 transition-colors'
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin text-green-500 mx-auto" />
              <p className="text-muted-foreground">Loading opportunities...</p>
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
              <p className="text-muted-foreground">No arbitrage opportunities found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.tokenPair}
                className="p-4 border rounded-lg space-y-3 bg-card hover:bg-accent/50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-sm">
                      {alert.tokenPair}
                    </Badge>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <Badge variant="secondary" className="text-green-600 font-mono">
                    +${alert.estimatedProfit.toFixed(2)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="font-medium">{alert.chain1}</span>
                  <span className="text-green-500">→</span>
                  <span className="font-medium">{alert.chain2}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 p-2 rounded-md">
                    <span className="font-medium text-muted-foreground">Price 1:</span>
                    <span className="ml-2 font-mono">${alert.price1.toFixed(4)}</span>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-md">
                    <span className="font-medium text-muted-foreground">Price 2:</span>
                    <span className="ml-2 font-mono">${alert.price2.toFixed(4)}</span>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-md">
                    <span className="font-medium text-muted-foreground">Price Diff:</span>
                    <span className="ml-2 font-mono">${alert.priceDifference.toFixed(4)}</span>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-md">
                    <span className="font-medium text-muted-foreground">Percentage:</span>
                    <span className="ml-2 font-mono">{alert.percentageDiff.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Gas Estimate: {alert.gasEstimate} units</span>
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  Execute Arbitrage
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 