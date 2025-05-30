'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

export function OrderBook() {
  const orders = [
    { price: '2150.50', amount: '0.5', side: 'buy' },
    { price: '2149.75', amount: '1.2', side: 'buy' },
    { price: '2151.25', amount: '0.8', side: 'sell' },
    { price: '2152.00', amount: '2.1', side: 'sell' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Order Book
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
          <span>Price</span>
          <span>Amount</span>
          <span>Side</span>
        </div>
        {orders.map((order, index) => (
          <div key={index} className="grid grid-cols-3 gap-2 text-sm">
            <span className={order.side === 'buy' ? 'text-green-600' : 'text-red-600'}>
              ${order.price}
            </span>
            <span>{order.amount} ETH</span>
            <Badge variant={order.side === 'buy' ? 'default' : 'destructive'} className="text-xs">
              {order.side}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 