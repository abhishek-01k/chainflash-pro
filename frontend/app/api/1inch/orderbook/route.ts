import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Orderbook API Proxy
 * This route is no longer used - moved to /api/1inch/orderbook/v4.0/[chainId]/route.ts
 * Keeping for backward compatibility but redirecting
 */

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const chainId = searchParams.get('chainId') || '1';

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

        // Parse request body
        const body = await request.json();
        const { order, signature } = body;

        // Validate required parameters
        if (!order || !signature) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters',
                    description: 'order and signature are required',
                    statusCode: 400
                },
                { status: 400 }
            );
        }

        // Validate order structure
        const requiredOrderFields = ['salt', 'maker', 'receiver', 'makerAsset', 'takerAsset', 'makingAmount', 'takingAmount', 'makerTraits'];
        const missingFields = requiredOrderFields.filter(field => !order[field]);

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    error: 'Invalid order structure',
                    description: `Missing order fields: ${missingFields.join(', ')}`,
                    statusCode: 400
                },
                { status: 400 }
            );
        }

        // Make request to 1inch Orderbook API
        const apiUrl = `https://api.1inch.dev/orderbook/v4.0/${chainId}/order`;

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
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('1inch Orderbook API Error:', {
                status: response.status,
                statusText: response.statusText,
                data
            });

            return NextResponse.json(
                {
                    error: data.error || 'Order creation failed',
                    description: data.description || response.statusText,
                    statusCode: data.statusCode || response.status
                },
                { status: data.statusCode || response.status }
            );
        }

        console.log('Limit order created successfully:', {
            chainId,
            orderHash: data.orderHash,
            maker: `${order.maker.slice(0, 6)}...${order.maker.slice(-4)}`,
            makerAsset: `${order.makerAsset.slice(0, 6)}...${order.makerAsset.slice(-4)}`,
            takerAsset: `${order.takerAsset.slice(0, 6)}...${order.takerAsset.slice(-4)}`
        });

        return NextResponse.json(data);

    } catch (error) {
        console.error('Orderbook API Error:', error);

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const makerToken = searchParams.get('makerToken');
        const takerToken = searchParams.get('takerToken');
        const makingAmount = searchParams.get('makingAmount');
        const takingAmount = searchParams.get('takingAmount');
        const expiration = searchParams.get('expiration');
        const makerAddress = searchParams.get('makerAddress');
        const chainId = searchParams.get('chainId') || '8453'; // Default to Base chain

        // Validate required parameters
        if (!makerToken || !takerToken || !makingAmount || !takingAmount || !makerAddress) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters',
                    required: ['makerToken', 'takerToken', 'makingAmount', 'takingAmount', 'makerAddress']
                },
                { status: 400 }
            );
        }

        const ONEINCH_API_URL = `https://api.1inch.dev`;

        const response = await fetch(
            `${ONEINCH_API_URL}/orderbook/v4.0/${chainId}/build?` + new URLSearchParams({
                makerToken,
                takerToken,
                makingAmount,
                takingAmount,
                expiration: expiration || '',
                makerAddress
            }),
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.message || 'Failed to fetch order' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
