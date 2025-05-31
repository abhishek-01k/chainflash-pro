import { NextRequest, NextResponse } from 'next/server';

/**
 * 1inch Orderbook API v4.0 Proxy
 * POST /api/1inch/orderbook/v4.0/[chainId]
 * Proxies requests to 1inch Orderbook API v4.0 for creating limit orders
 * Based on official API documentation: https://portal.1inch.dev/documentation/apis/orderbook/swagger
 */

interface LimitOrderV4Data {
    makerAsset: string;
    takerAsset: string;
    maker: string;
    receiver: string;
    makingAmount: string;
    takingAmount: string;
    salt: string;
    extension: string;
    makerTraits: string;
}

interface LimitOrderV4Request {
    orderHash: string;
    signature: string;
    data: LimitOrderV4Data;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ chainId: string }> }
) {
    try {
        const { chainId } = await params;

        console.log("chainId", chainId);

        // Validate chain ID and orderbook support
        const supportedChains = ['1', '56', '137', '10', '42161', '100', '43114', '250', '8217', '1313161554'];
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

        // Parse request body
        const body: LimitOrderV4Request = await request.json();
        const { orderHash, signature, data } = body;

        // Validate required parameters
        if (!orderHash || !signature || !data) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters',
                    description: 'orderHash, signature, and data are required',
                    statusCode: 400
                },
                { status: 400 }
            );
        }

        // Validate order data structure
        const requiredDataFields: (keyof LimitOrderV4Data)[] = [
            'makerAsset', 'takerAsset', 'maker', 'receiver',
            'makingAmount', 'takingAmount', 'salt', 'extension', 'makerTraits'
        ];
        const missingFields = requiredDataFields.filter(field => data[field] === undefined);

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    error: 'Invalid order data structure',
                    description: `Missing data fields: ${missingFields.join(', ')}`,
                    statusCode: 400
                },
                { status: 400 }
            );
        }

        // Validate orderHash format
        if (!/^0x[a-fA-F0-9]{64}$/.test(orderHash)) {
            return NextResponse.json(
                {
                    error: 'Invalid order hash',
                    description: 'Order hash must be a valid 64-character hex string',
                    statusCode: 400
                },
                { status: 400 }
            );
        }

        // Validate Ethereum addresses
        const addressFields: (keyof LimitOrderV4Data)[] = ['maker', 'receiver', 'makerAsset', 'takerAsset'];
        for (const field of addressFields) {
            if (!/^0x[a-fA-F0-9]{40}$/.test(data[field])) {
                return NextResponse.json(
                    {
                        error: `Invalid ${field} address`,
                        description: `${field} must be a valid Ethereum address`,
                        statusCode: 400
                    },
                    { status: 400 }
                );
            }
        }

        // Make request to 1inch Orderbook API v4.0
        const apiUrl = `https://api.1inch.dev/orderbook/v4.0/${chainId}`;

        console.log('Creating limit order v4.0:', {
            chainId,
            apiUrl,
            orderHash: `${orderHash.slice(0, 10)}...${orderHash.slice(-6)}`,
            maker: `${data.maker.slice(0, 6)}...${data.maker.slice(-4)}`,
            makerAsset: `${data.makerAsset.slice(0, 6)}...${data.makerAsset.slice(-4)}`,
            takerAsset: `${data.takerAsset.slice(0, 6)}...${data.takerAsset.slice(-4)}`
        });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'ChainFlash-Pro/1.0',
            },
            body: JSON.stringify({
                orderHash,
                signature,
                data
            }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('1inch Orderbook v4.0 API Error:', {
                status: response.status,
                statusText: response.statusText,
                data: responseData,
                url: apiUrl,
                requestBody: { orderHash, signature, data }
            });

            return NextResponse.json(
                {
                    error: responseData.error || 'Order creation failed',
                    description: responseData.message || responseData.description || response.statusText,
                    statusCode: responseData.statusCode || response.status
                },
                { status: responseData.statusCode || response.status }
            );
        }

        console.log('Limit order v4.0 created successfully:', {
            chainId,
            orderHash: `${orderHash.slice(0, 10)}...${orderHash.slice(-6)}`,
            success: responseData.success,
            maker: `${data.maker.slice(0, 6)}...${data.maker.slice(-4)}`
        });

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Orderbook v4.0 API Error:', error);

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