import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Quote API Proxy
 * GET /api/1inch/quote
 * Proxies requests to 1inch Swap API v6.0 for getting swap quotes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if API key is available
    const apiKey = process.env.ONEINCH_API_KEY;
    if (!apiKey) {
      console.error('1inch API key not configured');
      return NextResponse.json(
        {
          error: 'Configuration error',
          description: 'API key not configured',
          statusCode: 500
        },
        { status: 500 }
      );
    }
    
    // Required parameters
    const chainId = searchParams.get('chainId') || '1'; // Default to Ethereum
    const src = searchParams.get('src');
    const dst = searchParams.get('dst');
    const amount = searchParams.get('amount');

    // Validate required parameters
    if (!src || !dst || !amount) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          description: 'src, dst, and amount are required',
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

    // Build query parameters for 1inch API
    const queryParams = new URLSearchParams({
      src,
      dst,
      amount,
    });

    // Optional parameters
    const optionalParams = [
      'includeTokensInfo',
      'includeProtocols', 
      'fee',
      'gasLimit',
      'connectorTokens'
    ];

    optionalParams.forEach(param => {
      const value = searchParams.get(param);
      if (value !== null) {
        queryParams.append(param, value);
      }
    });

    // Make request to 1inch API
    const apiUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/quote?${queryParams}`;
    
    console.log('Getting quote for:', { chainId, src: src.slice(0, 6) + '...', dst: dst.slice(0, 6) + '...', amount });
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'accept': 'application/json',
        'User-Agent': 'ChainFlash-Pro/1.0',
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data;
    if (isJson) {
      data = await response.json();
    } else {
      // Handle plain text responses (like "Invalid API key")
      const textResponse = await response.text();
      data = { 
        error: textResponse, 
        description: `API returned non-JSON response: ${textResponse}`,
        statusCode: response.status 
      };
    }

    // Handle 1inch API errors
    if (!response.ok) {
      console.error('1inch API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        contentType,
        apiKey: apiKey ? `${apiKey.slice(0, 8)}...` : 'not set'
      });

      // Special handling for API key errors
      if (response.status === 401 || (typeof data.error === 'string' && data.error.includes('Invalid API key'))) {
        return NextResponse.json(
          {
            error: 'Invalid API key',
            description: 'The 1inch API key is invalid or expired. Please check your ONEINCH_API_KEY environment variable.',
            statusCode: 401,
            help: 'Get a free API key from https://portal.1inch.dev'
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: data.error || 'Quote request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status,
          meta: data.meta,
          requestId: data.requestId
        },
        { status: data.statusCode || response.status }
      );
    }

    // Return successful response
    return NextResponse.json(data);

  } catch (error) {
    console.error('Quote API Error:', error);
    
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