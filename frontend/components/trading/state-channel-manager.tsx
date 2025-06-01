'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Plus, Activity, TrendingUp, Users, ExternalLink } from 'lucide-react';
import { nitroliteService, type NitroliteChannel, type ChannelMetrics, type ChannelCreateParams } from '@/lib/services/nitrolite';
import { useToast } from '@/hooks/use-toast';
import { useAccount, useWalletClient } from 'wagmi';

export function StateChannelManager() {
  const [channels, setChannels] = useState<NitroliteChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [channelMetrics, setChannelMetrics] = useState<Record<string, ChannelMetrics>>({});
  const { toast } = useToast();

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Form state for creating channels with all required parameters
  const [createForm, setCreateForm] = useState<{
    counterpartyAddress: string;
    tokenAddress: string;
    challengePeriod: string;
    initialDeposit: string;
    userAllocation: string;
    network: string;
  }>({
    counterpartyAddress: '',
    tokenAddress: '',
    challengePeriod: '3600', // 1 hour default
    initialDeposit: '',
    userAllocation: '50', // percentage for user
    network: '137' // Polygon default
  });

  // Deposit form
  const [depositForm, setDepositForm] = useState({
    amount: '',
    tokenAddress: ''
  });

  // Initialize Nitrolite service when wallet is connected
  useEffect(() => {
    if (isConnected && address && walletClient && !isInitialized) {
      initializeNitrolite();
    }
  }, [isConnected, address, walletClient, isInitialized]);

  // Load user's channels when initialized
  useEffect(() => {
    if (isInitialized) {
      loadUserChannels();
    }
  }, [isInitialized]);

  const initializeNitrolite = async () => {
    if (!walletClient || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const chainId = parseInt(createForm.network) || 137; // Default to Polygon
      await nitroliteService.initializeWithWallet(walletClient, chainId, address);
      setIsInitialized(true);
      
      toast({
        title: "Success",
        description: "Nitrolite service initialized successfully",
      });
    } catch (error) {
      console.error('Error initializing Nitrolite:', error);
      toast({
        title: "Error",
        description: "Failed to initialize Nitrolite service",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserChannels = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      const userChannels = await nitroliteService.getUserChannels(address);
      setChannels(userChannels);

      // Load metrics for each channel
      const metrics: Record<string, ChannelMetrics> = {};
      for (const channel of userChannels) {
        try {
          metrics[channel.channelId] = await nitroliteService.getChannelMetrics(channel.channelId);
        } catch (error) {
          console.error(`Error loading metrics for channel ${channel.channelId}:`, error);
        }
      }
      setChannelMetrics(metrics);
    } catch (error) {
      console.error('Error loading user channels:', error);
      toast({
        title: "Error",
        description: "Failed to load state channels",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!isInitialized || !address) {
      toast({
        title: "Error",
        description: "Please initialize the service first",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!createForm.counterpartyAddress || !createForm.tokenAddress || !createForm.initialDeposit) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const depositAmount = BigInt(Math.floor(parseFloat(createForm.initialDeposit) * Math.pow(10, 18))); // Convert to wei

      const params: ChannelCreateParams = {
        counterpartyAddress: createForm.counterpartyAddress,
        tokenAddress: createForm.tokenAddress,
        challengePeriod: parseInt(createForm.challengePeriod),
        initialDeposit: depositAmount,
        userAllocationPercent: parseInt(createForm.userAllocation),
      };

      // Create channel with user-specified parameters
      const result = await nitroliteService.depositAndCreateChannel(params);

      toast({
        title: "Success",
        description: `Channel created successfully! Channel ID: ${result.channelId.slice(0, 10)}...`,
      });

      // Reset form
      setCreateForm({
        counterpartyAddress: '',
        tokenAddress: '',
        challengePeriod: '3600',
        initialDeposit: '',
        userAllocation: '50',
        network: createForm.network // Keep selected network
      });

      // Reload channels
      await loadUserChannels();
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create state channel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!isInitialized) {
      toast({
        title: "Error",
        description: "Please initialize the service first",
        variant: "destructive",
      });
      return;
    }

    if (!depositForm.amount) {
      toast({
        title: "Error",
        description: "Please enter a deposit amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('depositForm', depositForm);
      // First approve tokens if needed
      if (depositForm.tokenAddress) {
        const depositAmount = BigInt(Math.floor(parseFloat(depositForm.amount) * Math.pow(10, 18)));
        await nitroliteService.approveTokens(depositForm.tokenAddress, depositAmount);
      }

      const depositAmount = BigInt(Math.floor(parseFloat(depositForm.amount) * Math.pow(10, 18)));
      const txHash = await nitroliteService.deposit(depositAmount);

      toast({
        title: "Success",
        description: `Deposit successful! TX: ${txHash.slice(0, 10)}...`,
      });

      // Reset form
      setDepositForm({ amount: '', tokenAddress: '' });
    } catch (error) {
      console.error('Error depositing:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deposit funds",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseChannel = async (channelId: string) => {
    if (!isInitialized) return;

    try {
      setIsLoading(true);

      // In production, this would involve getting signatures from all participants
      const finalState = {
        channelId,
        isFinal: true,
        allocations: [], // Would be filled with actual final allocations
        timestamp: Date.now()
      };

      const txHash = await nitroliteService.closeChannel(channelId, finalState);

      toast({
        title: "Success",
        description: `Channel closed successfully! TX: ${txHash.slice(0, 10)}...`,
      });

      await loadUserChannels();
    } catch (error) {
      console.error('Error closing channel:', error);
      toast({
        title: "Error",
        description: "Failed to close channel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTradeInChannel = async (channelId: string) => {
    if (!isInitialized) return;

    try {
      // Simulate a trade within the state channel
      const tradeResult = await nitroliteService.executeInstantTrade(
        channelId,
        '0x765DE816845861e75A25fCA122bb6898B8B1282a', // cUSD
        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // native token
        BigInt(1000000000000000000), // 1 token
        [BigInt(500000000000000000), BigInt(500000000000000000)] // New allocations
      );

      toast({
        title: "Trade Executed",
        description: `Instant trade executed! Trade ID: ${tradeResult.id.slice(0, 10)}...`,
      });

      console.log('Trade result:', tradeResult);
    } catch (error) {
      console.error('Error executing trade:', error);
      toast({
        title: "Error",
        description: "Failed to execute trade",
        variant: "destructive",
      });
    }
  };

  const formatBalance = (balance: bigint): string => {
    return (Number(balance) / Math.pow(10, 18)).toFixed(4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'challenged':
        return 'destructive';
      case 'closed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const availableNetworks = nitroliteService.getAvailableNetworks();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          State Channels
          <Badge variant="outline" className="ml-auto">
            {channels.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Connect your wallet to manage state channels</p>
          </div>
        )}

        {isConnected && !isInitialized && (
          <div className="text-center py-4">
            <Button onClick={initializeNitrolite} disabled={isLoading}>
              {isLoading ? 'Initializing...' : 'Initialize Nitrolite Service'}
            </Button>
          </div>
        )}

        {isInitialized && (
          <Tabs defaultValue="channels" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted dark:bg-muted/50">
              <TabsTrigger value="channels" className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-500">Channels</TabsTrigger>
              <TabsTrigger value="create" className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-500">Create</TabsTrigger>
              <TabsTrigger value="deposit" className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-500">Deposit</TabsTrigger>
            </TabsList>

            <div className="h-[400px] overflow-y-auto mt-4">
              <TabsContent value="channels" className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : channels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No state channels found</p>
                    <p className="text-sm">Create your first channel to start trading gas-free</p>
                  </div>
                ) : (
                  channels.map((channel) => {
                    const metrics = channelMetrics[channel.channelId];
                    return (
                      <div key={channel.channelId} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono text-muted-foreground">
                            {channel.channelId.slice(0, 8)}...{channel.channelId.slice(-6)}
                          </span>
                          <Badge variant={getStatusColor(channel.status)}>
                            {channel.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">Balance</Label>
                            <p className="font-semibold">{formatBalance(channel.balance)} ETH</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Participants</Label>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{channel.participants.length}</span>
                            </div>
                          </div>
                        </div>

                        {metrics && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <div className="font-semibold">{metrics.totalTrades}</div>
                              <div className="text-muted-foreground">Trades</div>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <div className="font-semibold">{formatBalance(metrics.totalVolume)}</div>
                              <div className="text-muted-foreground">Volume</div>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <div className="font-semibold">{Number(metrics.gasSaved)}</div>
                              <div className="text-muted-foreground">Gas Saved</div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleTradeInChannel(channel.channelId)}
                            disabled={isLoading}
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            Trade
                          </Button>
                          {channel.status === 'open' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCloseChannel(channel.channelId)}
                              disabled={isLoading}
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="network">Network</Label>
                    <Select
                      value={createForm.network}
                      onValueChange={(value) => setCreateForm(prev => ({ ...prev, network: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableNetworks.map((network) => (
                          <SelectItem key={network.id} value={network.id.toString()}>
                            {network.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="counterparty">Counterparty Address *</Label>
                    <Input
                      id="counterparty"
                      placeholder="0x... (required)"
                      value={createForm.counterpartyAddress}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, counterpartyAddress: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tokenAddress">Token Address *</Label>
                    <Input
                      id="tokenAddress"
                      placeholder="0x... (ERC-20 token)"
                      value={createForm.tokenAddress}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, tokenAddress: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="deposit">Initial Deposit (ETH) or ERC20 Token *</Label>
                    <Input
                      id="deposit"
                      type="number"
                      step="0.001"
                      placeholder="1.0"
                      value={createForm.initialDeposit}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, initialDeposit: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="allocation">Your Allocation (%)</Label>
                      <Input
                        id="allocation"
                        type="number"
                        min="1"
                        max="99"
                        value={createForm.userAllocation}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, userAllocation: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="challengePeriod">Challenge Period (seconds)</Label>
                      <Input
                        id="challengePeriod"
                        type="number"
                        min="300"
                        value={createForm.challengePeriod}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, challengePeriod: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>* Required fields. Make sure you have the correct token address and counterparty address.</p>
                  </div>

                  <Button
                    onClick={handleCreateChannel}
                    disabled={isLoading || !createForm.counterpartyAddress || !createForm.tokenAddress || !createForm.initialDeposit}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isLoading ? 'Creating...' : 'Create Channel'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="deposit" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="depositTokenAddress">Token Address (optional)</Label>
                    <Input
                      id="depositTokenAddress"
                      placeholder="0x... (leave empty for ETH)"
                      value={depositForm.tokenAddress}
                      onChange={(e) => setDepositForm(prev => ({ ...prev, tokenAddress: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="depositAmount">Deposit Amount (ETH)</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      step="0.001"
                      placeholder="1.0"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={isLoading || !depositForm.amount}
                    className="w-full"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {isLoading ? 'Depositing...' : 'Deposit to Custody'}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 