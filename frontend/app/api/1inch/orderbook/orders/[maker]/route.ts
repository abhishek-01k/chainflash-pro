import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Orderbook API Proxy - Get Orders by Maker
 * GET /api/1inch/orderbook/orders/[maker]
 * Proxies requests to 1inch Orderbook API v4.0 for fetching maker's orders
 */

export async function GET(
    request: NextRequest,
    { params }: { params: { maker: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const chainId = searchParams.get('chainId') || '1';
        const page = searchParams.get('page') || '1';
        const limit = searchParams.get('limit') || '100';
        const { maker } = params;

        // Validate chain ID
        const supportedChains = ['1', '56', '137', '10', '42161', '100', '43114', '250', '8217', '1313161554', '8453'];
        if (!supportedChains.includes(chainId)) {
            return NextResponse.json(
                {
                    error: 'Unsupported chain',
                    description: `Chain ID ${chainId} is not supported for orderbook operations`,
                    statusCode: 400
                },
                { status: 400 }
            );
        }

        // Special validation for Base (8453) - check if orderbook is available
        // if (chainId === '8453') {
        //     console.log('Warning: Using Base (8453) for orderbook operations - may have limited support');
        //     return NextResponse.json(
        //         {
        //             error: 'Base chain orderbook may not be available',
        //             description: 'Base (8453) may not support orderbook operations. Please try using Ethereum mainnet (chainId: 1) for testing.',
        //             statusCode: 400,
        //             suggestion: 'Switch to Ethereum mainnet for orderbook operations'
        //         },
        //         { status: 400 }
        //     );
        // }

        // Validate maker address
        if (!maker || !maker.match(/^0x[a-fA-F0-9]{40}$/)) {
            return NextResponse.json(
                {
                    error: 'Invalid maker address',
                    description: 'Maker address must be a valid Ethereum address',
                    statusCode: 400
                },
                { status: 400 }
            );
        }

        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return NextResponse.json(
                {
                    error: 'Invalid page parameter',
                    description: 'Page must be a positive integer',
                    statusCode: 400
                },
                { status: 400 }
            );
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 500) {
            return NextResponse.json(
                {
                    error: 'Invalid limit parameter',
                    description: 'Limit must be between 1 and 500',
                    statusCode: 400
                },
                { status: 400 }
            );
        }

        // Make request to 1inch Orderbook API - CORRECTED URL STRUCTURE
        const apiUrl = `https://api.1inch.dev/orderbook/v4.0/${chainId}/address/${maker}`;
        const apiParams = new URLSearchParams({
            page: pageNum.toString(),
            limit: limitNum.toString(),
        });

        const fullUrl = `${apiUrl}?${apiParams}`;

        console.log('Fetching orders by maker:', {
            chainId,
            maker: `${maker.slice(0, 6)}...${maker.slice(-4)}`,
            page: pageNum,
            limit: limitNum,
            url: fullUrl
        });

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
                'accept': 'application/json',
                'User-Agent': 'ChainFlash-Pro/1.0',
            },
        });

        console.log("response", response);

        const data = await response.json();

        console.log("data", data);


        if (!response.ok) {
            console.error('1inch Orderbook Orders API Error:', {
                status: response.status,
                statusText: response.statusText,
                data,
                maker: maker,
                url: fullUrl
            });

            return NextResponse.json(
                {
                    error: data.error || 'Failed to fetch orders',
                    description: data.description || data.message || response.statusText,
                    statusCode: data.statusCode || response.status
                },
                { status: data.statusCode || response.status }
            );
        }

        console.log('Orders fetched successfully:', {
            chainId,
            maker: `${maker.slice(0, 6)}...${maker.slice(-4)}`,
            ordersCount: Array.isArray(data) ? data.length : 'unknown'
        });

        return NextResponse.json(data);

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