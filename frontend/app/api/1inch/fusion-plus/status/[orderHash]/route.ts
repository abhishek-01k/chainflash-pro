import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Fusion+ Order Status API Proxy
 * GET /api/1inch/fusion-plus/status/[orderHash]
 * Proxies requests to 1inch Fusion+ API v1.0 for checking order status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderHash: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId') || '1';
    const orderHash = (await params).orderHash;

    // Validate chain ID
    const supportedChains = ['1', '56', '137', '10', '42161', '8453']; // Limited chains for Fusion+
    if (!supportedChains.includes(chainId)) {
      return NextResponse.json(
        {
          error: 'Unsupported chain for Fusion+',
          description: `Chain ID ${chainId} is not supported for Fusion+ swaps`,
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Validate order hash
    if (!orderHash || !/^0x[a-fA-F0-9]{64}$/.test(orderHash)) {
      return NextResponse.json(
        {
          error: 'Invalid order hash',
          description: 'Order hash must be a valid 64-character hex string',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Make request to 1inch Fusion+ API
    const apiUrl = `https://api.1inch.dev/fusion-plus/v1.0/${chainId}/order/status/${orderHash}`;
    
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
      console.error('1inch Fusion+ Status API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        orderHash
      });

      return NextResponse.json(
        {
          error: data.error || 'Fusion+ order status request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status
        },
        { status: data.statusCode || response.status }
      );
    }

    console.log('Fusion+ order status retrieved:', {
      chainId,
      orderHash: `${orderHash.slice(0, 10)}...${orderHash.slice(-6)}`,
      status: data.status
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Fusion+ Status API Error:', error);
    
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