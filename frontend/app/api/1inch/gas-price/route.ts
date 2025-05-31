import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Gas Price API Proxy
 * GET /api/1inch/gas-price
 * Proxies requests to 1inch Gas Price API v1.5 for getting current gas prices
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Required parameters
    const chainId = searchParams.get('chainId') || '1';

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

    // Make request to 1inch Gas Price API
    const apiUrl = `https://api.1inch.dev/gas-price/v1.5/${chainId}`;
    
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
      console.error('1inch Gas Price API Error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });

      return NextResponse.json(
        {
          error: data.error || 'Gas price request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status
        },
        { status: data.statusCode || response.status }
      );
    }

    console.log('Gas prices retrieved:', {
      chainId,
      standard: data.standard,
      fast: data.fast,
      instant: data.instant
    });

    // Add cache headers for gas prices (short cache since they change frequently)
    const headers = new Headers({
      'Cache-Control': 'public, max-age=15, stale-while-revalidate=60', // 15 second cache, 1 minute stale
      'Content-Type': 'application/json',
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Gas Price API Error:', error);
    
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