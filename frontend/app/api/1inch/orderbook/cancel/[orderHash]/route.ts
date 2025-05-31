import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Orderbook Cancel Order API Proxy
 * DELETE /api/1inch/orderbook/cancel/[orderHash]
 * Proxies requests to 1inch Orderbook API v4.0 for canceling limit orders
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderHash: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId') || '1';
    const orderHash = (await params).orderHash;

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

    // Make request to 1inch Orderbook API
    const apiUrl = `https://api.1inch.dev/orderbook/v4.0/${chainId}/order/${orderHash}`;
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'accept': 'application/json',
        'User-Agent': 'ChainFlash-Pro/1.0',
      },
    });

    // Handle different response types for DELETE
    let data;
    try {
      data = await response.json();
    } catch {
      // Some DELETE endpoints might return empty body
      data = { success: response.ok };
    }

    if (!response.ok) {
      console.error('1inch Orderbook Cancel API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        orderHash
      });

      return NextResponse.json(
        {
          error: data?.error || 'Order cancellation failed',
          description: data?.description || response.statusText,
          statusCode: data?.statusCode || response.status
        },
        { status: data?.statusCode || response.status }
      );
    }

    console.log('Order cancelled successfully:', {
      chainId,
      orderHash: `${orderHash.slice(0, 10)}...${orderHash.slice(-6)}`,
      status: response.status
    });

    return NextResponse.json(data || { success: true });

  } catch (error) {
    console.error('Orderbook Cancel API Error:', error);
    
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