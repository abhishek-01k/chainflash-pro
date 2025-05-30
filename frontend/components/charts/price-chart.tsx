'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock price data
const mockData = [
  { time: '00:00', price: 2000 },
  { time: '04:00', price: 2050 },
  { time: '08:00', price: 1980 },
  { time: '12:00', price: 2100 },
  { time: '16:00', price: 2080 },
  { time: '20:00', price: 2120 },
  { time: '24:00', price: 2150 },
];

export function PriceChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>ETH/USD Price Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 