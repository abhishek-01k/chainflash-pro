import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Fusion+ Quote API Proxy
 * GET /api/1inch/fusion-plus/quote
 * Proxies requests to 1inch Fusion+ API v1.0 for gasless cross-chain swap quotes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Required parameters
    const chainId = searchParams.get('chainId') || '1'; // Default to Ethereum
    const src = searchParams.get('src');
    const dst = searchParams.get('dst');
    const amount = searchParams.get('amount');
    const walletAddress = searchParams.get('walletAddress');

    // Validate required parameters
    if (!src || !dst || !amount || !walletAddress) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          description: 'src, dst, amount, and walletAddress are required',
          statusCode: 400
        },
        { status: 400 }
      );
    }

    // Validate chain ID (Fusion+ supports specific chains)
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

    // Build query parameters for 1inch Fusion+ API
    const queryParams = new URLSearchParams({
      src,
      dst,
      amount,
      walletAddress,
    });

    // Optional parameters
    const optionalParams = ['enableEstimate', 'permit'];
    
    optionalParams.forEach(param => {
      const value = searchParams.get(param);
      if (value !== null) {
        if (param === 'enableEstimate' && value === 'true') {
          queryParams.append(param, 'true');
        } else if (param === 'permit') {
          queryParams.append(param, value);
        }
      }
    });

    // Make request to 1inch Fusion+ API
    const apiUrl = `https://api.1inch.dev/fusion-plus/v1.0/${chainId}/quote/receive?${queryParams}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'accept': 'application/json',
        'User-Agent': 'ChainFlash-Pro/1.0',
      },
    });

    const data = await response.json();

    // Handle 1inch Fusion+ API errors
    if (!response.ok) {
      console.error('1inch Fusion+ Quote API Error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        requestUrl: apiUrl
      });

      return NextResponse.json(
        {
          error: data.error || 'Fusion+ quote request failed',
          description: data.description || response.statusText,
          statusCode: data.statusCode || response.status,
          meta: data.meta,
          requestId: data.requestId
        },
        { status: data.statusCode || response.status }
      );
    }

    // Log successful Fusion+ quote (for monitoring)
    console.log('Fusion+ quote generated successfully:', {
      chainId,
      from: data.fromToken?.symbol,
      to: data.toToken?.symbol,
      amount: data.fromTokenAmount,
      preset: data.preset,
      gasless: true
    });

    // Return successful response
    return NextResponse.json(data);

  } catch (error) {
    console.error('Fusion+ Quote API Error:', error);
    
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