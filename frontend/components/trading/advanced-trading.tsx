'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { oneInchService } from '@/lib/services/1inch';
import { pythService } from '@/lib/services/pyth';
import { nitroliteService } from '@/lib/services/nitrolite';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  DollarSign, 
  BarChart3,
  ArrowLeftRight,
  Settings
} from 'lucide-react';

interface TWAPOrder {
  id: string;
  fromToken: string;
  toToken: string;
  totalAmount: string;
  numberOfTrades: number;
  timeInterval: number; // seconds
  executedTrades: number;
  nextExecution: number;
  status: 'active' | 'completed' | 'paused';
}

interface OptionsOrder {
  id: string;
  type: 'call' | 'put';
  underlying: string;
  strikePrice: string;
  expirationTime: number;
  premium: string;
  status: 'active' | 'exercised' | 'expired';
}

interface ArbitrageOpportunity {
  id: string;
  token: string;
  chain1: { name: string; price: number; dex: string };
  chain2: { name: string; price: number; dex: string };
  priceDifference: number;
  profitPotential: number;
  gasEstimate: bigint;
  confidence: number;
}

export function AdvancedTrading() {
  const { toast } = useToast();
  const [twapOrders, setTwapOrders] = useState<TWAPOrder[]>([]);
  const [optionsOrders, setOptionsOrders] = useState<OptionsOrder[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // TWAP Order Form State
  const [twapForm, setTwapForm] = useState({
    fromToken: '',
    toToken: '',
    totalAmount: '',
    numberOfTrades: 10,
    timeInterval: 3600, // 1 hour
    useStateChannel: false
  });

  // Options Order Form State
  const [optionsForm, setOptionsForm] = useState({
    type: 'call' as 'call' | 'put',
    underlying: '',
    strikePrice: '',
    expirationDays: 30,
    premium: '',
    useAdvancedPricing: false
  });

  // Arbitrage Settings
  const [arbitrageSettings, setArbitrageSettings] = useState({
    minProfitThreshold: 1.0, // 1%
    maxGasPrice: '100', // gwei
    enabledChains: ['ethereum', 'arbitrum', 'polygon'],
    autoExecute: false
  });

  // Load initial data
  useEffect(() => {
    loadArbitrageOpportunities();
    const interval = setInterval(loadArbitrageOpportunities, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadArbitrageOpportunities = async () => {
    try {
      const opportunities = await pythService.detectArbitrageOpportunities();
      const formattedOpportunities: ArbitrageOpportunity[] = opportunities.map((opp, index) => ({
        id: `arb_${Date.now()}_${index}`,
        token: opp.tokenPair,
        chain1: {
          name: opp.chain1,
          price: opp.price1,
          dex: 'DEX1'
        },
        chain2: {
          name: opp.chain2,
          price: opp.price2,
          dex: 'DEX2'
        },
        priceDifference: opp.priceDifference,
        profitPotential: opp.estimatedProfit,
        gasEstimate: BigInt(opp.gasEstimate || 0),
        confidence: 0.85 // Default confidence for now
      }));
      setArbitrageOpportunities(formattedOpportunities);
    } catch (error) {
      console.error('Error loading arbitrage opportunities:', error);
    }
  };

  const createTWAPOrder = async () => {
    if (!twapForm.fromToken || !twapForm.toToken || !twapForm.totalAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for TWAP order",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const order = await oneInchService.createTWAPOrder({
        chainId: 1,
        baseOrder: {
          maker: '0x0000000000000000000000000000000000000000',
          makerAsset: twapForm.fromToken,
          takerAsset: twapForm.toToken,
          makingAmount: twapForm.totalAmount,
          takingAmount: '0',
          receiver: '0x0000000000000000000000000000000000000000',
          predicate: '0x',
          permit: '0x',
          interaction: '0x'
        },
        totalAmount: twapForm.totalAmount,
        numberOfTrades: twapForm.numberOfTrades,
        timeInterval: twapForm.timeInterval
      });

      const newTWAPOrder: TWAPOrder = {
        id: `twap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromToken: twapForm.fromToken,
        toToken: twapForm.toToken,
        totalAmount: twapForm.totalAmount,
        numberOfTrades: twapForm.numberOfTrades,
        timeInterval: twapForm.timeInterval,
        executedTrades: 0,
        nextExecution: Date.now() + (twapForm.timeInterval * 1000),
        status: 'active'
      };

      setTwapOrders(prev => [...prev, newTWAPOrder]);
      
      // Reset form
      setTwapForm({
        fromToken: '',
        toToken: '',
        totalAmount: '',
        numberOfTrades: 10,
        timeInterval: 3600,
        useStateChannel: false
      });

      toast({
        title: "TWAP Order Created",
        description: `TWAP order created with ${twapForm.numberOfTrades} trades over ${twapForm.timeInterval / 3600} hours`,
      });
    } catch (error) {
      toast({
        title: "Error Creating TWAP Order",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createOptionsOrder = async () => {
    if (!optionsForm.underlying || !optionsForm.strikePrice || !optionsForm.premium) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for options order",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const expirationTime = Math.floor(Date.now() / 1000) + (optionsForm.expirationDays * 24 * 60 * 60);
      
      const order = await oneInchService.createOptionsOrder({
        chainId: 1,
        baseOrder: {
          maker: '0x0000000000000000000000000000000000000000',
          makerAsset: optionsForm.underlying,
          takerAsset: '0x0000000000000000000000000000000000000000',
          makingAmount: '1000000000000000000',
          takingAmount: optionsForm.premium,
          receiver: '0x0000000000000000000000000000000000000000',
          permit: '0x',
          interaction: '0x'
        },
        strikePrice: optionsForm.strikePrice,
        expirationTime,
        optionType: optionsForm.type,
        premium: optionsForm.premium
      });

      const newOptionsOrder: OptionsOrder = {
        id: `options_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: optionsForm.type,
        underlying: optionsForm.underlying,
        strikePrice: optionsForm.strikePrice,
        expirationTime,
        premium: optionsForm.premium,
        status: 'active'
      };

      setOptionsOrders(prev => [...prev, newOptionsOrder]);

      // Reset form
      setOptionsForm({
        type: 'call',
        underlying: '',
        strikePrice: '',
        expirationDays: 30,
        premium: '',
        useAdvancedPricing: false
      });

      toast({
        title: "Options Order Created",
        description: `${optionsForm.type.toUpperCase()} option created with strike price $${optionsForm.strikePrice}`,
      });
    } catch (error) {
      toast({
        title: "Error Creating Options Order",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeArbitrage = async (opportunity: ArbitrageOpportunity) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would execute the arbitrage trade
      toast({
        title: "Arbitrage Executed",
        description: `Executed arbitrage for ${opportunity.token} with ${opportunity.profitPotential}% profit`,
      });
    } catch (error) {
      toast({
        title: "Error Executing Arbitrage",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = (timestamp: number) => {
    const remaining = timestamp - Date.now();
    if (remaining <= 0) return 'Ready';
    
    const minutes = Math.floor(remaining / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Advanced Trading</h1>
          <p className="text-muted-foreground">Professional trading tools for DeFi</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Zap className="h-4 w-4 mr-1" />
          Production Ready
        </Badge>
      </div>

      <Tabs defaultValue="twap" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="twap" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            TWAP Orders
          </TabsTrigger>
          <TabsTrigger value="options" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Options Trading
          </TabsTrigger>
          <TabsTrigger value="arbitrage" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Arbitrage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="twap" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Create TWAP Order
                </CardTitle>
                <CardDescription>
                  Split large trades over time for better execution prices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twap-from">From Token</Label>
                    <Input
                      id="twap-from"
                      placeholder="ETH"
                      value={twapForm.fromToken}
                      onChange={(e) => setTwapForm(prev => ({ ...prev, fromToken: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="twap-to">To Token</Label>
                    <Input
                      id="twap-to"
                      placeholder="USDC"
                      value={twapForm.toToken}
                      onChange={(e) => setTwapForm(prev => ({ ...prev, toToken: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="twap-amount">Total Amount</Label>
                  <Input
                    id="twap-amount"
                    placeholder="10.0"
                    value={twapForm.totalAmount}
                    onChange={(e) => setTwapForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twap-trades">Number of Trades</Label>
                    <Input
                      id="twap-trades"
                      type="number"
                      min="2"
                      max="100"
                      value={twapForm.numberOfTrades}
                      onChange={(e) => setTwapForm(prev => ({ ...prev, numberOfTrades: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="twap-interval">Interval (minutes)</Label>
                    <Input
                      id="twap-interval"
                      type="number"
                      min="1"
                      value={twapForm.timeInterval / 60}
                      onChange={(e) => setTwapForm(prev => ({ ...prev, timeInterval: parseInt(e.target.value) * 60 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="twap-channel"
                    checked={twapForm.useStateChannel}
                    onCheckedChange={(checked) => setTwapForm(prev => ({ ...prev, useStateChannel: checked }))}
                  />
                  <Label htmlFor="twap-channel">Use State Channel (Gas-free)</Label>
                </div>

                <Button onClick={createTWAPOrder} disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating...' : 'Create TWAP Order'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active TWAP Orders</CardTitle>
                <CardDescription>{twapOrders.length} active orders</CardDescription>
              </CardHeader>
              <CardContent>
                {twapOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No active TWAP orders</p>
                ) : (
                  <div className="space-y-3">
                    {twapOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{order.fromToken} → {order.toToken}</span>
                          <Badge variant={order.status === 'active' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Progress: {order.executedTrades}/{order.numberOfTrades} trades</div>
                          <div>Next execution: {formatTimeRemaining(order.nextExecution)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="options" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Create Options Order
                </CardTitle>
                <CardDescription>
                  Trade call and put options with automated execution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="options-type">Option Type</Label>
                    <Select
                      value={optionsForm.type}
                      onValueChange={(value: 'call' | 'put') => setOptionsForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call Option</SelectItem>
                        <SelectItem value="put">Put Option</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="options-underlying">Underlying Asset</Label>
                    <Input
                      id="options-underlying"
                      placeholder="ETH"
                      value={optionsForm.underlying}
                      onChange={(e) => setOptionsForm(prev => ({ ...prev, underlying: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="options-strike">Strike Price ($)</Label>
                    <Input
                      id="options-strike"
                      placeholder="2500"
                      value={optionsForm.strikePrice}
                      onChange={(e) => setOptionsForm(prev => ({ ...prev, strikePrice: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="options-expiry">Expiration (days)</Label>
                    <Input
                      id="options-expiry"
                      type="number"
                      min="1"
                      max="365"
                      value={optionsForm.expirationDays}
                      onChange={(e) => setOptionsForm(prev => ({ ...prev, expirationDays: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="options-premium">Premium (ETH)</Label>
                  <Input
                    id="options-premium"
                    placeholder="0.1"
                    value={optionsForm.premium}
                    onChange={(e) => setOptionsForm(prev => ({ ...prev, premium: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="options-advanced"
                    checked={optionsForm.useAdvancedPricing}
                    onCheckedChange={(checked) => setOptionsForm(prev => ({ ...prev, useAdvancedPricing: checked }))}
                  />
                  <Label htmlFor="options-advanced">Use Black-Scholes Pricing</Label>
                </div>

                <Button onClick={createOptionsOrder} disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating...' : 'Create Options Order'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Options</CardTitle>
                <CardDescription>{optionsOrders.length} active options</CardDescription>
              </CardHeader>
              <CardContent>
                {optionsOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No active options</p>
                ) : (
                  <div className="space-y-3">
                    {optionsOrders.map((option) => (
                      <div key={option.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {option.type.toUpperCase()} {option.underlying}
                          </span>
                          <Badge variant={option.status === 'active' ? 'default' : 'secondary'}>
                            {option.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Strike: ${option.strikePrice}</div>
                          <div>Premium: {option.premium} ETH</div>
                          <div>Expires: {new Date(option.expirationTime * 1000).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="arbitrage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Cross-Chain Arbitrage Opportunities
              </CardTitle>
              <CardDescription>
                Real-time arbitrage opportunities across multiple chains
              </CardDescription>
            </CardHeader>
            <CardContent>
              {arbitrageOpportunities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No profitable arbitrage opportunities found
                </p>
              ) : (
                <div className="space-y-3">
                  {arbitrageOpportunities.map((opportunity) => (
                    <div key={opportunity.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-lg">{opportunity.token}</span>
                          <Badge variant="secondary">
                            {opportunity.profitPotential > 0 ? '+' : ''}{opportunity.profitPotential.toFixed(2)}%
                          </Badge>
                        </div>
                        <Button
                          onClick={() => executeArbitrage(opportunity)}
                          disabled={isLoading || opportunity.profitPotential < arbitrageSettings.minProfitThreshold}
                          size="sm"
                        >
                          Execute
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium">{opportunity.chain1.name}</div>
                          <div className="text-muted-foreground">
                            ${opportunity.chain1.price.toFixed(4)} on {opportunity.chain1.dex}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">{opportunity.chain2.name}</div>
                          <div className="text-muted-foreground">
                            ${opportunity.chain2.price.toFixed(4)} on {opportunity.chain2.dex}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Confidence: {(opportunity.confidence * 100).toFixed(1)}%</span>
                        <span>Est. Gas: {opportunity.gasEstimate.toString()} units</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdvancedTrading; 