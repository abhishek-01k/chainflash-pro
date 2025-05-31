import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Swap API Proxy
 * GET /api/1inch/swap
 * Proxies requests to 1inch Swap API v6.0 for getting swap transaction data
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
    const from = searchParams.get('from');
    const slippage = searchParams.get('slippage');

    // Validate required parameters
    if (!src || !dst || !amount || !from || !slippage) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          description: 'src, dst, amount, from, and slippage are required',
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

    // Validate slippage (should be between 0.1 and 50)
    const slippageNum = parseFloat(slippage);
    if (isNaN(slippageNum) || slippageNum < 0.1 || slippageNum > 50) {
      return NextResponse.json(
        {
          error: 'Invalid slippage',
          description: 'Slippage must be between 0.1 and 50',
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
      from,
      slippage: slippage.toString(),
    });

    // Optional parameters with validation
    const optionalParams = [
      'protocols',
      'fee',
      'gasLimit',
      'gasPrice',
      'connectorTokens',
      'complexityLevel',
      'mainRouteParts',
      'parts',
      'includeTokensInfo',
      'includeProtocols',
      'compatibilityMode',
      'receiver',
      'referrer',
      'allowPartialFill',
      'disableEstimate',
      'usePatching'
    ];

    optionalParams.forEach(param => {
      const value = searchParams.get(param);
      if (value !== null) {
        // Special handling for boolean parameters
        if (['includeTokensInfo', 'includeProtocols', 'compatibilityMode', 'allowPartialFill', 'disableEstimate', 'usePatching'].includes(param)) {
          if (value === 'true') {
            queryParams.append(param, 'true');
          }
        } else {
          queryParams.append(param, value);
        }
      }
    });

    // Make request to 1inch API
    const apiUrl = `https://api.1inch.dev/swap/v6.0/${chainId}/swap?${queryParams}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'accept': 'application/json',
        'User-Agent': 'ChainFlash-Pro/1.0',
      },
    });

    const data = await response.json();

    // Handle 1inch API errors
    if (!response.ok) {
      console.error('1inch Swap API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        requestUrl: apiUrl
      });

      return NextResponse.json(
        {
          error: data.error || 'Swap request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status,
          meta: data.meta,
          requestId: data.requestId
        },
        { status: data.statusCode || response.status }
      );
    }

    // Log successful swap preparation (for monitoring)
    console.log('Swap prepared successfully:', {
      chainId,
      from: data.fromToken?.symbol,
      to: data.toToken?.symbol,
      amount: data.fromTokenAmount,
      estimatedGas: data.tx?.gas
    });

    // Return successful response
    return NextResponse.json(data);

  } catch (error) {
    console.error('Swap API Error:', error);
    
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
