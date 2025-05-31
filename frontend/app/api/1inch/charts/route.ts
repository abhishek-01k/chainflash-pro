import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Charts API Proxy
 * GET /api/1inch/charts
 * Proxies requests to 1inch Charts API v1.0 for getting price charts
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Required parameters
        const fromToken = searchParams.get('fromToken');
        const toToken = searchParams.get('toToken');
        const period = searchParams.get('period') || '24H'; // Default to 1 week
        const chainId = searchParams.get('chainId') || '1'; // Default to Ethereum

        console.log("From token", fromToken);

        // Validate required parameters
        if (!fromToken || !toToken) {
            return NextResponse.json(
                {
                    error: 'Missing parameters',
                    description: 'fromToken and toToken are required',
                    statusCode: 400
                },
                { status: 400 }
            );
        }

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

        // Make request to 1inch API
        const apiUrl = `https://api.1inch.dev/charts/v1.0/chart/line/${fromToken}/${toToken}/${period}/${chainId}`;

        console.log('Fetching chart data:', { fromToken, toToken, period, chainId });

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json',
                'content-type': 'application/json',
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
            // Handle plain text responses
            const textResponse = await response.text();
            data = {
                error: textResponse,
                description: `API returned non-JSON response: ${textResponse}`,
                statusCode: response.status
            };
        }

        // Handle 1inch API errors
        if (!response.ok) {
            console.error('1inch Charts API Error:', {
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
                    error: data.error || 'Charts request failed',
                    description: data.description || response.statusText,
                    statusCode: data.statusCode || response.status,
                    meta: data.meta,
                    requestId: data.requestId
                },
                { status: data.statusCode || response.status }
            );
        }

        // Add cache headers (charts data can be cached for a shorter time)
        const headers = new Headers({
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600', // 5 minutes cache, 1 hour stale
            'Content-Type': 'application/json',
        });

        // Return successful response with cache headers
        return new Response(JSON.stringify(data), {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Charts API Error:', error);

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