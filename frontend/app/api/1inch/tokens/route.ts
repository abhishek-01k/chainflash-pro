import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Tokens API Proxy
 * GET /api/1inch/tokens
 * Proxies requests to 1inch Swap API v6.0 for getting supported tokens
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Required parameters
    const chainId = searchParams.get('chainId') || '1'; // Default to Ethereum

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

    // Make request to 1inch API
    const apiUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/tokens`;
    
    console.log('Fetching tokens for chain:', chainId);
    
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
      console.error('1inch Tokens API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        requestUrl: apiUrl,
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
          error: data.error || 'Tokens request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status,
          meta: data.meta,
          requestId: data.requestId
        },
        { status: data.statusCode || response.status }
      );
    }

    // Log successful tokens fetch (for monitoring)
    const tokenCount = Object.keys(data.tokens || data || {}).length;
    console.log('Tokens fetched successfully:', {
      chainId,
      tokenCount,
      cached: false
    });

    // Add cache headers for tokens (they don't change frequently)
    const headers = new Headers({
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // 1 hour cache, 1 day stale
      'Content-Type': 'application/json',
    });

    // Return successful response with cache headers
    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Tokens API Error:', error);
    
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