'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp } from 'lucide-react';

export function ArbitrageAlerts() {
  const [alerts] = useState([
    {
      id: '1',
      token: 'ETH',
      fromChain: 'Ethereum',
      toChain: 'Arbitrum',
      priceDiff: '0.52%',
      profit: '+$45.32',
      timestamp: '2 min ago',
    },
    {
      id: '2',
      token: 'USDC',
      fromChain: 'Polygon',
      toChain: 'Optimism',
      priceDiff: '0.23%',
      profit: '+$18.90',
      timestamp: '5 min ago',
    },
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Arbitrage Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No arbitrage opportunities found
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{alert.token}</Badge>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <Badge variant="secondary" className="text-green-600">
                    {alert.profit}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {alert.fromChain} → {alert.toChain}
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price diff: {alert.priceDiff}</span>
                  <span>{alert.timestamp}</span>
                </div>
                <Button size="sm" className="w-full">
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