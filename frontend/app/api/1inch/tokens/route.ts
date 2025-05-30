import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {

        // Make the request to 1inch API with the bearer token
        const response = await fetch('https://api.1inch.dev/token/v1.3/8453', {
            headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ONEINCH_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`1inch API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Data >>", data);


        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in 1inch tokens API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 