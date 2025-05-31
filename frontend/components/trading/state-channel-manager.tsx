'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Plus, Activity, TrendingUp, Users } from 'lucide-react';
import { nitroliteService, type NitroliteChannel, type ChannelMetrics } from '@/lib/services/nitrolite';
import { useToast } from '@/hooks/use-toast';

export function StateChannelManager() {
  const [channels, setChannels] = useState<NitroliteChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [channelMetrics, setChannelMetrics] = useState<Record<string, ChannelMetrics>>({});
  const { toast } = useToast();

  // Form state for creating channels
  const [createForm, setCreateForm] = useState({
    initialDeposit: '',
    counterpartyAddress: '',
    initialAllocation: '50', // percentage for user
  });

  // Load user's channels on component mount
  useEffect(() => {
    loadUserChannels();
  }, []);

  const loadUserChannels = async () => {
    try {
      setIsLoading(true);
      // In production, this would get the user's address from wallet connection
      const mockUserAddress = '0x1234567890123456789012345678901234567890';
      const userChannels = await nitroliteService.getUserChannels(mockUserAddress);
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
    try {
      setIsLoading(true);

      const depositAmount = BigInt(Math.floor(parseFloat(createForm.initialDeposit) * Math.pow(10, 18))); // Convert to wei
      const userAllocationPercent = BigInt(createForm.initialAllocation);
      const userAllocation = (userAllocationPercent * depositAmount) / BigInt(100);
      const counterpartyAllocation = depositAmount - userAllocation;

      // First, deposit and create channel
      const result = await nitroliteService.depositAndCreateChannel(
        depositAmount,
        [userAllocation, counterpartyAllocation],
        '0x' // Initial state data
      );

      toast({
        title: "Success",
        description: `Channel created successfully! Channel ID: ${result.channelId.slice(0, 10)}...`,
      });

      // Reset form and close dialog
      setCreateForm({
        initialDeposit: '',
        counterpartyAddress: '',
        initialAllocation: '50',
      });
      setIsCreateDialogOpen(false);

      // Reload channels
      await loadUserChannels();
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: "Error",
        description: "Failed to create state channel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async (amount: string) => {
    try {
      setIsLoading(true);
      const depositAmount = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, 18)));
      const txHash = await nitroliteService.deposit(depositAmount);

      toast({
        title: "Success",
        description: `Deposit successful! TX: ${txHash.slice(0, 10)}...`,
      });
    } catch (error) {
      console.error('Error depositing:', error);
      toast({
        title: "Error",
        description: "Failed to deposit funds",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseChannel = async (channelId: string) => {
    try {
      setIsLoading(true);

      // In production, this would involve getting signatures from all participants
      const finalState = {
        // Final state would be constructed based on current channel state
        channelId,
        isFinal: true,
        allocations: [], // Would be filled with actual final allocations
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
        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted dark:bg-muted/50">
            <TabsTrigger value="channels" className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-500">Channels</TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-500">Create</TabsTrigger>
            <TabsTrigger value="deposit" className="data-[state=active]:bg-blue-500 dark:data-[state=active]:bg-blue-500">Deposit</TabsTrigger>
          </TabsList>

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
                        onClick={() => setSelectedChannel(channel.channelId)}
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
                <Label htmlFor="deposit">Initial Deposit (ETH)</Label>
                <Input
                  id="deposit"
                  type="number"
                  step="0.01"
                  placeholder="1.0"
                  value={createForm.initialDeposit}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, initialDeposit: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="counterparty">Counterparty Address</Label>
                <Input
                  id="counterparty"
                  placeholder="0x..."
                  value={createForm.counterpartyAddress}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, counterpartyAddress: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="allocation">Your Allocation (%)</Label>
                <Input
                  id="allocation"
                  type="number"
                  min="1"
                  max="99"
                  value={createForm.initialAllocation}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, initialAllocation: e.target.value }))}
                />
              </div>

              <Button
                onClick={handleCreateChannel}
                disabled={isLoading || !createForm.initialDeposit || !createForm.counterpartyAddress}
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
                <Label htmlFor="depositAmount">Deposit Amount (ETH)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  placeholder="1.0"
                />
              </div>

              <Button
                onClick={() => {
                  const input = document.getElementById('depositAmount') as HTMLInputElement;
                  if (input.value) {
                    handleDeposit(input.value);
                  }
                }}
                disabled={isLoading}
                className="w-full"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {isLoading ? 'Depositing...' : 'Deposit to Custody'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 