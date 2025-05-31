import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Orderbook Active Orders API Proxy
 * GET /api/1inch/orderbook/orders/[maker]
 * Proxies requests to 1inch Orderbook API v4.0 for getting active orders by maker
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ maker: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId') || '1';
    const maker = (await params).maker;

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

    // Validate maker address
    if (!maker || !/^0x[a-fA-F0-9]{40}$/.test(maker)) {
      return NextResponse.json(
        {
          error: 'Invalid maker address',
          description: 'Maker address must be a valid Ethereum address',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Optional pagination parameters
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);

    const query = queryParams.toString() ? `?${queryParams}` : '';

    // Make request to 1inch Orderbook API
    const apiUrl = `https://api.1inch.dev/orderbook/v4.0/${chainId}/address/${maker}/orders${query}`;
    
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
      console.error('1inch Orderbook Orders API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        maker
      });

      return NextResponse.json(
        {
          error: data.error || 'Active orders request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status
        },
        { status: data.statusCode || response.status }
      );
    }

    console.log('Active orders retrieved:', {
      chainId,
      maker: `${maker.slice(0, 6)}...${maker.slice(-4)}`,
      orderCount: Array.isArray(data) ? data.length : 0,
      page,
      limit
    });

    // Add cache headers for orders (short cache since orders can change)
    const headers = new Headers({
      'Cache-Control': 'public, max-age=10, stale-while-revalidate=60', // 10 second cache, 1 minute stale
      'Content-Type': 'application/json',
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Orderbook Orders API Error:', error);
    
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