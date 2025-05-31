import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Spot Prices API Proxy
 * GET /api/1inch/prices
 * Proxies requests to 1inch Price API v1.1 for getting token spot prices
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Required parameters
    const chainId = searchParams.get('chainId') || '1';
    const addresses = searchParams.get('addresses');

    // Validate required parameters
    if (!addresses) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          description: 'addresses parameter is required (comma-separated list)',
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

    // Validate addresses format
    const addressList = addresses.split(',');
    const validAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    const invalidAddresses = addressList.filter(addr => !validAddressRegex.test(addr.trim()));
    
    if (invalidAddresses.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid address format',
          description: `Invalid addresses: ${invalidAddresses.join(', ')}`,
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Optional currency parameter
    const currency = searchParams.get('currency') || 'USD';

    // Build query parameters
    const queryParams = new URLSearchParams({ currency });

    // Make request to 1inch Price API
    const apiUrl = `https://api.1inch.dev/price/v1.1/${chainId}/${addresses}?${queryParams}`;
    
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
      console.error('1inch Prices API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        addresses: addresses.split(',').length
      });

      return NextResponse.json(
        {
          error: data.error || 'Price request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status
        },
        { status: data.statusCode || response.status }
      );
    }

    console.log('Spot prices retrieved:', {
      chainId,
      currency,
      tokenCount: addressList.length,
      priceCount: Object.keys(data || {}).length
    });

    // Add cache headers for prices (moderate cache since prices change frequently)
    const headers = new Headers({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300', // 1 minute cache, 5 minute stale
      'Content-Type': 'application/json',
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Prices API Error:', error);
    
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