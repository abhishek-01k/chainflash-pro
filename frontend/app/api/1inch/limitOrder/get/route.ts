import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const maker = searchParams.get('maker');
        const limit = searchParams.get('limit') || '20';
        const offset = searchParams.get('offset') || '0';

        const url = "https://api.1inch.dev/orderbook/v4.0/8453/orders";

        const config = {
            headers: {
                "Authorization": `Bearer ${process.env.INCH_API_KEY}`,
            },
            params: {
                maker,
                limit,
                offset
            }
        };

        const response = await axios.get(url, config);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch limit orders' },
            { status: error.response?.status || 500 }
        );
    }
} 