'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

export function Portfolio() {
  const holdings = [
    { token: 'ETH', amount: '10.5', value: '$22,575', change: '+5.2%', positive: true },
    { token: 'USDC', amount: '5,000', value: '$5,000', change: '0.0%', positive: true },
    { token: 'WBTC', amount: '0.25', value: '$10,750', change: '-2.1%', positive: false },
  ];

  const totalValue = '$38,325';
  const totalChange = '+3.8%';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Portfolio
          <Badge variant="secondary" className="ml-auto">
            {totalValue}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Value</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{totalValue}</span>
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                {totalChange}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            {holdings.map((holding) => (
              <div key={holding.token} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{holding.token}</span>
                    <span className="text-sm text-muted-foreground">{holding.amount}</span>
                  </div>
                  <span className="text-sm">{holding.value}</span>
                </div>
                <Badge variant={holding.positive ? 'default' : 'destructive'} className="text-xs">
                  {holding.positive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {holding.change}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 