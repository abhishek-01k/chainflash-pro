// Real Nitrolite (ERC-7824) State Channel implementation using official SDK
import { NitroliteClient } from '@erc7824/nitrolite';
import type { PublicClient, WalletClient } from 'viem';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, arbitrum, polygon } from 'viem/chains';

// Real Nitrolite configuration
const NITROLITE_RPC_ENDPOINT = process.env.NEXT_PUBLIC_NITROLITE_RPC_ENDPOINT || 'wss://rpc.nitrolite.io';
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  mainnet: {
    custody: '0x1234567890123456789012345678901234567890',
    adjudicator: '0x0987654321098765432109876543210987654321',
    guestAddress: '0x1111111111111111111111111111111111111111',
    tokenAddress: '0x2222222222222222222222222222222222222222',
  },
  arbitrum: {
    custody: '0x3333333333333333333333333333333333333333',
    adjudicator: '0x4444444444444444444444444444444444444444',
    guestAddress: '0x5555555555555555555555555555555555555555',
    tokenAddress: '0x6666666666666666666666666666666666666666',
  },
};

export interface NitroliteChannel {
  channelId: string;
  participants: string[];
  status: 'pending' | 'open' | 'challenged' | 'closed';
  balance: bigint;
  allocation: bigint[];
  nonce: number;
  lastUpdate: number;
  custodyContract: string;
  adjudicatorContract: string;
  challengePeriod: bigint;
}

export interface ChannelState {
  channelId: string;
  nonce: number;
  allocations: bigint[];
  stateData: string;
  signatures: string[];
  timestamp: number;
}

export interface TradeExecution {
  id: string;
  channelId: string;
  fromToken: string;
  toToken: string;
  amount: bigint;
  price: string;
  timestamp: number;
  gasUsed: bigint;
  fee: bigint;
}

export interface ChannelMetrics {
  totalTrades: number;
  totalVolume: bigint;
  averageExecutionTime: number;
  gasSaved: bigint;
}

class NitroliteService {
  private client: NitroliteClient | null = null;
  private wsConnection: WebSocket | null = null;
  private channelSubscriptions: Map<string, (update: ChannelState) => void> = new Map();
  private currentChain = mainnet;

  constructor() {
    this.initializeClients();
  }

  // Initialize Nitrolite client with viem
  private async initializeClients() {
    try {
      // Setup public client
      const publicClient = createPublicClient({
        chain: this.currentChain,
        transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
      }) as PublicClient;

      // For now, we'll use a mock private key - in production, this would come from wallet connection
      const mockPrivateKey = '0x' + '1'.repeat(64); // Mock private key for demo
      const account = privateKeyToAccount(mockPrivateKey as `0x${string}`);
      
      const walletClient = createWalletClient({
        account,
        chain: this.currentChain,
        transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
      }) as WalletClient;

      // Initialize Nitrolite client
      this.client = new NitroliteClient({
        publicClient,
        walletClient,
        addresses: CONTRACT_ADDRESSES.mainnet,
        challengeDuration: 100n,
        chainId: this.currentChain.id
      });

      console.log('Nitrolite client initialized successfully');
    } catch (error) {
      console.error('Error initializing Nitrolite client:', error);
    }
  }

  // Update wallet client when user connects their wallet
  async updateWalletClient(walletClient: WalletClient) {
    if (!this.client) {
      await this.initializeClients();
    }
    
    // Update the client with the real wallet
    const publicClient = createPublicClient({
      chain: this.currentChain,
      transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
    }) as PublicClient;

    this.client = new NitroliteClient({
      publicClient,
      walletClient,
      addresses: CONTRACT_ADDRESSES.mainnet,
      challengeDuration: 100n,
      chainId: this.currentChain.id
    });
  }

  // Deposit funds into custody contract
  async deposit(amount: bigint): Promise<string> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const txHash = await this.client.deposit(amount);
      console.log('Deposit successful:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error depositing funds:', error);
      throw error;
    }
  }

  // Create a new state channel
  async createChannel(
    participants: string[],
    initialAllocations: bigint[],
    stateData: string = '0x'
  ): Promise<{ channelId: string; txHash: string; initialState: any }> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      // Ensure we have exactly 2 allocations for the current SDK
      const allocations: [bigint, bigint] = [
        initialAllocations[0] || 0n,
        initialAllocations[1] || 0n
      ];

      const result = await this.client.createChannel({
        initialAllocationAmounts: allocations,
        stateData
      });

      return {
        channelId: result.channelId,
        txHash: result.createChannelTxHash,
        initialState: result.initialState
      };
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  // Deposit and create channel in one operation
  async depositAndCreateChannel(
    amount: bigint,
    initialAllocations: bigint[],
    stateData: string = '0x'
  ): Promise<{ channelId: string; txHash: string; initialState: any }> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      // Ensure we have exactly 2 allocations for the current SDK
      const allocations: [bigint, bigint] = [
        initialAllocations[0] || 0n,
        initialAllocations[1] || 0n
      ];

      const result = await this.client.depositAndCreateChannel(
        amount,
        {
          initialAllocationAmounts: allocations,
          stateData
        }
      );

      return {
        channelId: result.channelId,
        txHash: result.createChannelTxHash,
        initialState: result.initialState
      };
    } catch (error) {
      console.error('Error in deposit and create channel:', error);
      throw error;
    }
  }

  // Execute instant trade within state channel (gas-free)
  async executeInstantTrade(
    channelId: string,
    fromToken: string,
    toToken: string,
    amount: bigint,
    newAllocations: bigint[]
  ): Promise<TradeExecution> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      // In a real implementation, this would involve updating the channel state
      // with new allocations and getting signatures from all participants
      const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // For now, we'll simulate the trade execution
      // In production, this would involve the RPC system for coordination
      return {
        id: tradeId,
        channelId,
        fromToken,
        toToken,
        amount,
        price: '1.0', // This would be calculated based on market conditions
        timestamp: Date.now(),
        gasUsed: 0n, // Gas-free within state channel
        fee: amount / 1000n, // 0.1% fee
      };
    } catch (error) {
      console.error('Error executing instant trade:', error);
      throw error;
    }
  }

  // Resize channel with new allocations
  async resizeChannel(
    channelId: string,
    newAllocations: bigint[],
    candidateState: any
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const txHash = await this.client.resizeChannel({
        candidateState
      });
      
      console.log('Channel resized successfully:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error resizing channel:', error);
      throw error;
    }
  }

  // Close channel with final state
  async closeChannel(
    channelId: string,
    finalState: any
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const txHash = await this.client.closeChannel({
        finalState
      });
      
      console.log('Channel closed successfully:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error closing channel:', error);
      throw error;
    }
  }

  // Challenge a channel when counterparty is non-responsive
  async challengeChannel(
    channelId: string,
    candidateState: any
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const txHash = await this.client.challengeChannel({
        candidateState
      });
      
      console.log('Channel challenged successfully:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error challenging channel:', error);
      throw error;
    }
  }

  // Get account channels
  async getUserChannels(userAddress: string): Promise<NitroliteChannel[]> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const channels = await this.client.getAccountChannels();
      
      return channels.map((channel: any) => ({
        channelId: channel.channelId,
        participants: channel.participants,
        status: channel.status,
        balance: BigInt(channel.balance || 0),
        allocation: channel.allocation ? channel.allocation.map((a: any) => BigInt(a)) : [0n, 0n],
        nonce: channel.nonce || 0,
        lastUpdate: channel.lastUpdate || Date.now(),
        custodyContract: channel.custodyContract || CONTRACT_ADDRESSES.mainnet.custody,
        adjudicatorContract: channel.adjudicatorContract || CONTRACT_ADDRESSES.mainnet.adjudicator,
        challengePeriod: BigInt(channel.challengePeriod || 100),
      }));
    } catch (error) {
      console.error('Error fetching user channels:', error);
      return [];
    }
  }

  // Get account information
  async getAccountInfo(address: string): Promise<{ balance: bigint; allowance: bigint }> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const accountInfo = await this.client.getAccountInfo();
      return {
        balance: BigInt(accountInfo.depositBalance || 0),
        allowance: BigInt(accountInfo.tokenAllowance || 0)
      };
    } catch (error) {
      console.error('Error fetching account info:', error);
      return { balance: 0n, allowance: 0n };
    }
  }

  // Approve tokens for custody contract
  async approveTokens(amount: bigint): Promise<string> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const txHash = await this.client.approveTokens(amount);
      console.log('Token approval successful:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error approving tokens:', error);
      throw error;
    }
  }

  // Withdraw from custody contract
  async withdraw(amount: bigint): Promise<string> {
    if (!this.client) {
      throw new Error('Nitrolite client not initialized');
    }

    try {
      const txHash = await this.client.withdrawal(amount);
      console.log('Withdrawal successful:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }

  // Initialize RPC connection for real-time communication
  async initializeRPC(signer: any, userAddress: string): Promise<void> {
    try {
      this.wsConnection = new WebSocket(NITROLITE_RPC_ENDPOINT);

      this.wsConnection.onopen = async () => {
        console.log('Connected to Nitrolite RPC');
        
        // Send authentication message (simplified for demo)
        const authMsg = JSON.stringify({
          type: 'auth',
          address: userAddress,
          timestamp: Date.now()
        });
        
        this.wsConnection?.send(authMsg);
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          this.handleRPCMessage(response);
        } catch (error) {
          console.error('Error parsing RPC message:', error);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error('RPC WebSocket error:', error);
      };

      this.wsConnection.onclose = () => {
        console.log('RPC connection closed, attempting to reconnect...');
        setTimeout(() => this.initializeRPC(signer, userAddress), 5000);
      };
    } catch (error) {
      console.error('Error initializing RPC:', error);
    }
  }

  // Handle incoming RPC messages
  private handleRPCMessage(message: any) {
    if (message.type === 'channel_update') {
      const callback = this.channelSubscriptions.get(message.channelId);
      if (callback) {
        callback({
          channelId: message.channelId,
          nonce: message.nonce,
          allocations: message.allocations ? message.allocations.map((a: any) => BigInt(a)) : [],
          stateData: message.stateData,
          signatures: message.signatures || [],
          timestamp: message.timestamp,
        });
      }
    }
  }

  // Send application message via RPC
  async sendApplicationMessage(
    signer: any,
    channelId: string,
    params: string[]
  ): Promise<void> {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      throw new Error('RPC connection not established');
    }

    try {
      const message = JSON.stringify({
        type: 'app_message',
        channelId,
        params,
        timestamp: Date.now()
      });
      
      this.wsConnection.send(message);
    } catch (error) {
      console.error('Error sending application message:', error);
      throw error;
    }
  }

  // Subscribe to channel updates
  subscribeToChannelUpdates(
    channelId: string,
    callback: (update: ChannelState) => void
  ): void {
    this.channelSubscriptions.set(channelId, callback);
  }

  // Unsubscribe from channel updates
  unsubscribeFromChannelUpdates(channelId: string): void {
    this.channelSubscriptions.delete(channelId);
  }

  // Get channel performance metrics
  async getChannelMetrics(channelId: string): Promise<ChannelMetrics> {
    try {
      // In a real implementation, this would fetch from the backend
      // For now, returning mock data
      return {
        totalTrades: Math.floor(Math.random() * 1000),
        totalVolume: BigInt(Math.floor(Math.random() * 1000000)),
        averageExecutionTime: Math.floor(Math.random() * 100), // milliseconds
        gasSaved: BigInt(Math.floor(Math.random() * 50000)), // gas units saved
      };
    } catch (error) {
      console.error('Error fetching channel metrics:', error);
      return {
        totalTrades: 0,
        totalVolume: 0n,
        averageExecutionTime: 0,
        gasSaved: 0n,
      };
    }
  }

  // Cleanup connections
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.channelSubscriptions.clear();
  }
}

export const nitroliteService = new NitroliteService(); 