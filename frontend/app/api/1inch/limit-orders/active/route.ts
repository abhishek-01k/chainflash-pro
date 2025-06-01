import { NextResponse } from 'next/server';

const BASE_URL = 'https://api.1inch.dev/orderbook/v4.0';
const API_KEY = process.env.ONEINCH_API_KEY;



export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');
        const chainId = searchParams.get('chainId');
        const page = searchParams.get('page') || '1';
        const limit = searchParams.get('limit') || '100';

        if (!address || !chainId) {
            return NextResponse.json(
                { error: ' Missing parameter...' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${BASE_URL}/${chainId}/address/${address}?page=${page}&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`1inch API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching active orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch active orders' },
            { status: 500 }
        );
    }
}