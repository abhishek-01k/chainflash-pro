import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Allowance API Proxy
 * GET /api/1inch/allowance
 * Proxies requests to 1inch Swap API v6.0 for getting token allowances
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Required parameters
    const chainId = searchParams.get('chainId') || '1';
    const tokenAddress = searchParams.get('tokenAddress');
    const walletAddress = searchParams.get('walletAddress');

    // Validate required parameters
    if (!tokenAddress || !walletAddress) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          description: 'tokenAddress and walletAddress are required',
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

    // Validate addresses
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress) || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        {
          error: 'Invalid address format',
          description: 'Addresses must be valid Ethereum addresses',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      tokenAddress,
      walletAddress,
    });

    // Make request to 1inch API
    const apiUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/approve/allowance?${queryParams}`;
    
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
      console.error('1inch Allowance API Error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });

      return NextResponse.json(
        {
          error: data.error || 'Allowance request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status
        },
        { status: data.statusCode || response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Allowance API Error:', error);
    
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