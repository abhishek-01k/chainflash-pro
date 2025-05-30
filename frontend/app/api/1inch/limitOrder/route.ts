import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const url = "https://api.1inch.dev/orderbook/v4.0/8453";

        const config = {
            headers: {
                "Authorization": `Bearer ${process.env.INCH_API_KEY}`,
            },
            params: {},
            paramsSerializer: {
                indexes: null
            }
        };

        const response = await axios.post(url, body, config);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to create limit order' },
            { status: error.response?.status || 500 }
        );
    }
}
