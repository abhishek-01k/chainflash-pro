import { NextResponse } from 'next/server';
import axios from 'axios';

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderHash = searchParams.get('orderHash');

        if (!orderHash) {
            return NextResponse.json(
                { error: 'Order hash is required' },
                { status: 400 }
            );
        }

        const url = `https://api.1inch.dev/orderbook/v4.0/8453/orders/${orderHash}`;

        const config = {
            headers: {
                "Authorization": `Bearer ${process.env.INCH_API_KEY}`,
            }
        };

        const response = await axios.delete(url, config);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to delete limit order' },
            { status: error.response?.status || 500 }
        );
    }
} 