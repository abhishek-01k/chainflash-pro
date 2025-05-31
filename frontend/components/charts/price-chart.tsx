'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Chart data type
interface ChartDataPoint {
  time: number;
  value: number;
}

interface ChartData {
  data: ChartDataPoint[];
}

interface PriceChartProps {
  data?: ChartData;
  fromToken?: string;
  toToken?: string;
}

// Format timestamp to readable date and time
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format price to USD
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export function PriceChart({ data, fromToken = 'ETH', toToken = 'USD' }: PriceChartProps) {
  // Add validation for data
  if (!data?.data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{fromToken}/{toToken} Price Chart</CardTitle>
          <p className="text-sm text-muted-foreground">
            No data available for {fromToken} denominated in {toToken}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No chart data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fromToken}/{toToken} Price Chart</CardTitle>
        <p className="text-sm text-muted-foreground">
          Historical price data for {fromToken} denominated in {toToken}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                tickCount={6}
                minTickGap={50}
              />
              <YAxis
                tickFormatter={formatPrice}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                domain={['auto', 'auto']}
                width={80}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), 'Price']}
                labelFormatter={(label) => `Time: ${formatTime(label)}`}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#8884d8', stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 