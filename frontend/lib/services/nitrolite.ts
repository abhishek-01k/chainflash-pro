// Real Nitrolite (ERC-7824) State Channel implementation
// Since @erc7824/nitrolite package doesn't exist, we implement direct API calls

// Nitrolite endpoints and configuration
const NITROLITE_RPC_ENDPOINT = process.env.NEXT_PUBLIC_NITROLITE_RPC_ENDPOINT || 'https://nitrolite.yellow.org/rpc';
const NITROLITE_API_ENDPOINT = process.env.NEXT_PUBLIC_NITROLITE_API_ENDPOINT || 'https://api.nitrolite.yellow.org';

export interface NitroliteStateChannel {
  channelId: string;
  participants: string[];
  status: 'pending' | 'open' | 'closed' | 'disputed';
  balance: string;
  nonce: number;
  lastUpdate: number;
  custodyContract: string;
  adjudicatorContract: string;
  challengePeriod: number;
}

export interface ChannelUpdate {
  channelId: string;
  nonce: number;
  balances: Record<string, string>;
  signatures: string[];
  timestamp: number;
}

export interface TradeExecution {
  id: string;
  channelId: string;
  fromToken: string;
  toToken: string;
  amount: string;
  price: string;
  timestamp: number;
  gasUsed: string;
  fee: string;
}

class NitroliteService {
  private apiKey: string;
  private wsConnection: WebSocket | null = null;
  private channelSubscriptions: Map<string, (update: ChannelUpdate) => void> = new Map();

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_NITROLITE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Nitrolite API key not found. Some features may not work properly.');
    }
  }

  // Create a new state channel
  async createStateChannel(
    participants: string[],
    initialBalance: string,
    custodyContract: string,
    adjudicatorContract: string
  ): Promise<NitroliteStateChannel> {
    try {
      const response = await fetch(`${NITROLITE_API_ENDPOINT}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          participants,
          initialBalance,
          custodyContract,
          adjudicatorContract,
          challengePeriod: 3600, // 1 hour challenge period
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        channelId: data.channelId,
        participants: data.participants,
        status: data.status,
        balance: data.balance,
        nonce: data.nonce || 0,
        lastUpdate: Date.now(),
        custodyContract: data.custodyContract,
        adjudicatorContract: data.adjudicatorContract,
        challengePeriod: data.challengePeriod,
      };
    } catch (error) {
      console.error('Error creating state channel:', error);
      throw error;
    }
  }

  // Get channel information
  async getChannel(channelId: string): Promise<NitroliteStateChannel | null> {
    try {
      const response = await fetch(`${NITROLITE_API_ENDPOINT}/channels/${channelId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        channelId: data.channelId,
        participants: data.participants,
        status: data.status,
        balance: data.balance,
        nonce: data.nonce,
        lastUpdate: data.lastUpdate,
        custodyContract: data.custodyContract,
        adjudicatorContract: data.adjudicatorContract,
        challengePeriod: data.challengePeriod,
      };
    } catch (error) {
      console.error('Error fetching channel:', error);
      throw error;
    }
  }

  // Execute instant trade within state channel
  async executeInstantTrade(
    channelId: string,
    fromToken: string,
    toToken: string,
    amount: string,
    maxSlippage: number = 1
  ): Promise<TradeExecution> {
    try {
      const response = await fetch(`${NITROLITE_API_ENDPOINT}/channels/${channelId}/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          fromToken,
          toToken,
          amount,
          maxSlippage,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: data.tradeId,
        channelId,
        fromToken,
        toToken,
        amount,
        price: data.executionPrice,
        timestamp: data.timestamp,
        gasUsed: '0', // Gas-free within state channel
        fee: data.fee || '0',
      };
    } catch (error) {
      console.error('Error executing instant trade:', error);
      throw error;
    }
  }

  // Update channel state
  async updateChannelState(
    channelId: string,
    newBalances: Record<string, string>,
    signatures: string[]
  ): Promise<ChannelUpdate> {
    try {
      const channel = await this.getChannel(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      const newNonce = channel.nonce + 1;
      
      const response = await fetch(`${NITROLITE_API_ENDPOINT}/channels/${channelId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          nonce: newNonce,
          balances: newBalances,
          signatures,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        channelId,
        nonce: newNonce,
        balances: newBalances,
        signatures,
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error('Error updating channel state:', error);
      throw error;
    }
  }

  // Batch multiple trades for efficiency
  async batchTrades(
    channelId: string,
    trades: Array<{
      fromToken: string;
      toToken: string;
      amount: string;
    }>
  ): Promise<TradeExecution[]> {
    try {
      const response = await fetch(`${NITROLITE_API_ENDPOINT}/channels/${channelId}/batch-trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          trades,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.executions.map((execution: any, index: number) => ({
        id: execution.tradeId,
        channelId,
        fromToken: trades[index].fromToken,
        toToken: trades[index].toToken,
        amount: trades[index].amount,
        price: execution.executionPrice,
        timestamp: execution.timestamp,
        gasUsed: '0', // Gas-free within state channel
        fee: execution.fee || '0',
      }));
    } catch (error) {
      console.error('Error executing batch trades:', error);
      throw error;
    }
  }

  // Subscribe to channel updates via WebSocket
  async subscribeToChannelUpdates(
    channelId: string,
    callback: (update: ChannelUpdate) => void
  ): Promise<void> {
    try {
      this.channelSubscriptions.set(channelId, callback);
      
      if (!this.wsConnection) {
        await this.initializeWebSocketConnection();
      }

      // Subscribe to channel updates
      const subscribeMessage = {
        type: 'subscribe_channel',
        channelId,
      };

      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify(subscribeMessage));
      }
    } catch (error) {
      console.error('Error subscribing to channel updates:', error);
      throw error;
    }
  }

  // Initialize WebSocket connection for real-time updates
  private async initializeWebSocketConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = NITROLITE_RPC_ENDPOINT.replace('http', 'ws').replace('/rpc', '/ws');
        this.wsConnection = new WebSocket(`${wsUrl}?auth=${this.apiKey}`);

        this.wsConnection.onopen = () => {
          console.log('Connected to Nitrolite WebSocket');
          resolve();
        };

        this.wsConnection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'channel_update') {
              const callback = this.channelSubscriptions.get(data.channelId);
              if (callback) {
                callback({
                  channelId: data.channelId,
                  nonce: data.nonce,
                  balances: data.balances,
                  signatures: data.signatures,
                  timestamp: data.timestamp,
                });
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.wsConnection.onerror = (error) => {
          console.error('Nitrolite WebSocket error:', error);
          reject(error);
        };

        this.wsConnection.onclose = () => {
          console.log('Nitrolite WebSocket connection closed');
          // Attempt to reconnect after 5 seconds
          setTimeout(() => this.initializeWebSocketConnection(), 5000);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Close and settle channel on-chain
  async closeChannel(
    channelId: string,
    finalBalances: Record<string, string>,
    signatures: string[]
  ): Promise<string> {
    try {
      const response = await fetch(`${NITROLITE_API_ENDPOINT}/channels/${channelId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          finalBalances,
          signatures,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.transactionHash;
    } catch (error) {
      console.error('Error closing channel:', error);
      throw error;
    }
  }

  // Get channel performance metrics
  async getChannelMetrics(channelId: string): Promise<{
    totalTrades: number;
    totalVolume: string;
    averageExecutionTime: number;
    gasSaved: string;
  }> {
    try {
      const response = await fetch(`${NITROLITE_API_ENDPOINT}/channels/${channelId}/metrics`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        totalTrades: data.totalTrades,
        totalVolume: data.totalVolume,
        averageExecutionTime: data.averageExecutionTime,
        gasSaved: data.gasSaved,
      };
    } catch (error) {
      console.error('Error fetching channel metrics:', error);
      throw error;
    }
  }

  // List user's channels
  async getUserChannels(userAddress: string): Promise<NitroliteStateChannel[]> {
    try {
      const response = await fetch(`${NITROLITE_API_ENDPOINT}/users/${userAddress}/channels`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.channels.map((channel: any) => ({
        channelId: channel.channelId,
        participants: channel.participants,
        status: channel.status,
        balance: channel.balance,
        nonce: channel.nonce,
        lastUpdate: channel.lastUpdate,
        custodyContract: channel.custodyContract,
        adjudicatorContract: channel.adjudicatorContract,
        challengePeriod: channel.challengePeriod,
      }));
    } catch (error) {
      console.error('Error fetching user channels:', error);
      return [];
    }
  }

  // Cleanup WebSocket connection
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.channelSubscriptions.clear();
  }
}

export const nitroliteService = new NitroliteService(); 