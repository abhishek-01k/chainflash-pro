import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const src = searchParams.get('src');
        const dst = searchParams.get('dst');
        const amount = searchParams.get('amount');
        const walletAddress = searchParams.get('walletAddress');

        if (!src || !dst || !amount || !walletAddress) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://api.1inch.dev/swap/v6.0/8453/quote?src=${src}&dst=${dst}&amount=${amount}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ONEINCH_API_KEY}`,
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
        console.error('Error fetching quote:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quote' },
            { status: 500 }
        );
    }
}