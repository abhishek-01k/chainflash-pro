import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const ONEINCH_API_URL = 'https://api.1inch.dev';
const ONEINCH_API_KEY = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;

interface LimitOrder {
    salt: string;
    maker: string;
    receiver: string;
    makerAsset: string;
    takerAsset: string;
    makingAmount: string;
    takingAmount: string;
    predicate: string;
    permit: string;
    interaction: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            chainId,
            maker,
            makerAsset,
            takerAsset,
            makingAmount,
            takingAmount,
            receiver, // optional
            predicate // optional
        } = body;

        // Validate only required fields
        if (!chainId || !maker || !makerAsset || !takerAsset || !makingAmount || !takingAmount) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters',
                    required: ['chainId', 'maker', 'makerAsset', 'takerAsset', 'makingAmount', 'takingAmount']
                },
                { status: 400 }
            );
        }

        // Create order object with optional fields
        const order: LimitOrder = {
            salt: ethers.randomBytes(32).toString(),
            maker,
            receiver: receiver || maker, // Use maker as default if receiver not provided
            makerAsset,
            takerAsset,
            makingAmount,
            takingAmount,
            predicate: predicate || '0x', // Use '0x' as default if predicate not provided
            permit: '0x',
            interaction: '0x',
        };

        const response = await fetch(
            `${ONEINCH_API_URL}/orderbook/v4.0/${chainId}/order`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ONEINCH_API_KEY}`,
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify(order),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.message || 'Failed to create order' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
