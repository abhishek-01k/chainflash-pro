import { NextResponse } from 'next/server';

const ONECHIN_API_KEY = 'okz7YzxXA8DPc7eehhXbolnROttzvKYA';
const ONECHIN_API_URL = 'https://api.1inch.dev/orderbook/v4.0/8453';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch(ONECHIN_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ONECHIN_API_KEY}`,
                'accept': 'application/json',
                'content-type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.message || 'Failed to submit order' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error submitting order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
