import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fromTokenAddress = searchParams.get('fromTokenAddress');
        const toTokenAddress = searchParams.get('toTokenAddress');
        const amount = searchParams.get('amount');
        const walletAddress = searchParams.get('walletAddress');

        if (!fromTokenAddress || !toTokenAddress || !amount || !walletAddress) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://api.1inch.dev/fusion/quoter/v2.0/8453/quote/receive?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&walletAddress=${walletAddress}`,
            {
                headers: {
                    'Authorization': `Bearer okz7YzxXA8DPc7eehhXbolnROttzvKYA`,
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
