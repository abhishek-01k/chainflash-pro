import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Approve API Proxy
 * GET /api/1inch/approve
 * Proxies requests to 1inch Swap API v6.0 for getting approval transaction data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Required parameters
    const chainId = searchParams.get('chainId') || '1';
    const tokenAddress = searchParams.get('tokenAddress');

    // Validate required parameters
    if (!tokenAddress) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          description: 'tokenAddress is required',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Validate chain ID
    const supportedChains = ['1', '56', '137', '10', '42161', '100', '43114', '250', '8217', '1313161554', '8453'];
    if (!supportedChains.includes(chainId)) {
      return NextResponse.json(
        {
          error: 'Unsupported chain',
          description: `Chain ID ${chainId} is not supported`,
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Validate token address
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return NextResponse.json(
        {
          error: 'Invalid token address',
          description: 'Token address must be a valid Ethereum address',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams({ tokenAddress });
    
    // Optional amount parameter
    const amount = searchParams.get('amount');
    if (amount) {
      queryParams.append('amount', amount);
    }

    // Make request to 1inch API
    const apiUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/approve/transaction?${queryParams}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'accept': 'application/json',
        'User-Agent': 'ChainFlash-Pro/1.0',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('1inch Approve API Error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });

      return NextResponse.json(
        {
          error: data.error || 'Approval transaction request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status
        },
        { status: data.statusCode || response.status }
      );
    }

    console.log('Approval transaction prepared:', {
      chainId,
      tokenAddress: `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`,
      amount: amount || 'unlimited'
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Approve API Error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500
      },
      { status: 500 }
    );
  }
} 