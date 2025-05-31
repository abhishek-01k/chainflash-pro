import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Fusion+ Submit API Proxy
 * POST /api/1inch/fusion-plus/submit
 * Proxies requests to 1inch Fusion+ API v1.0 for submitting gasless orders
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId') || '1';

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

    // Parse request body
    const body = await request.json();
    const { order, signature, quoteId } = body;

    // Validate required parameters
    if (!order || !signature || !quoteId) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          description: 'order, signature, and quoteId are required',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Make request to 1inch Fusion+ API
    const apiUrl = `https://api.1inch.dev/fusion-plus/v1.0/${chainId}/order/submit`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'ChainFlash-Pro/1.0',
      },
      body: JSON.stringify({
        order,
        signature,
        quoteId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('1inch Fusion+ Submit API Error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });

      return NextResponse.json(
        {
          error: data.error || 'Fusion+ order submission failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status
        },
        { status: data.statusCode || response.status }
      );
    }

    console.log('Fusion+ order submitted successfully:', {
      chainId,
      orderHash: data.orderHash,
      quoteId
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Fusion+ Submit API Error:', error);
    
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