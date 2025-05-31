import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Balances API Proxy
 * GET /api/1inch/balances
 * Proxies requests to 1inch Balance API v1.2 for getting wallet token balances
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Required parameters
    const chainId = searchParams.get('chainId') || '1'; // Default to Ethereum
    const walletAddress = searchParams.get('walletAddress');

    // Validate required parameters
    if (!walletAddress) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          description: 'walletAddress is required',
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

    // Validate wallet address format (basic ETH address validation)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        {
          error: 'Invalid wallet address',
          description: 'Wallet address must be a valid Ethereum address',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Make request to 1inch Balance API
    const apiUrl = `https://api.1inch.dev/balance/v1.2/${chainId}/balances/${walletAddress}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'accept': 'application/json',
        'User-Agent': 'ChainFlash-Pro/1.0',
      },
    });

    const data = await response.json();

    console.log("Data", data);;


    // Handle 1inch API errors
    if (!response.ok) {
      console.error('1inch Balances API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        requestUrl: apiUrl
      });

      return NextResponse.json(
        {
          error: data.error || 'Balances request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status,
          meta: data.meta,
          requestId: data.requestId
        },
        { status: data.statusCode || response.status }
      );
    }

    // Log successful balances fetch (for monitoring)
    const tokenCount = Object.keys(data || {}).length;
    console.log('Balances fetched successfully:', {
      chainId,
      walletAddress: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      tokenCount,
      cached: false
    });

    // Add cache headers for balances (short cache since balances change frequently)
    const headers = new Headers({
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=300', // 30 second cache, 5 minute stale
      'Content-Type': 'application/json',
    });

    // Return successful response with cache headers
    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Balances API Error:', error);

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