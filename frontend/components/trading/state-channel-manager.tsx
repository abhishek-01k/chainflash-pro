'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus } from 'lucide-react';

export function StateChannelManager() {
  const [channels] = useState([
    {
      id: '0x1234...5678',
      status: 'active',
      balance: '10.5 ETH',
      trades: 156,
    },
    {
      id: '0x8765...4321',
      status: 'pending',
      balance: '5.2 ETH',
      trades: 23,
    },
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          State Channels
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Channel
        </Button>
        
        <div className="space-y-3">
          {channels.map((channel) => (
            <div key={channel.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">{channel.id}</span>
                <Badge variant={channel.status === 'active' ? 'default' : 'secondary'}>
                  {channel.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Balance: {channel.balance}</span>
                <span>{channel.trades} trades</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 