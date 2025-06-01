import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const makerToken = searchParams.get('makerToken');
        const takerToken = searchParams.get('takerToken');
        const makingAmount = searchParams.get('makingAmount');
        const takingAmount = searchParams.get('takingAmount');
        const expiration = searchParams.get('expiration');
        const makerAddress = searchParams.get('address');
        const chainId = searchParams.get('chainId');

        // Validate required fields
        if (!makerToken || !takerToken || !makingAmount || !takingAmount || !makerAddress || !chainId) {
            console.error('Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY || process.env.NEXT_PUBLIC_ONEINCH_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: '1inch API key not configured' },
                { status: 500 }
            );
        }

        const response = await fetch(
            `https://api.1inch.dev/orderbook/v4.0/${chainId}/build?makerToken=${makerToken}&takerToken=${takerToken}&makingAmount=${makingAmount}&takingAmount=${takingAmount}&expiration=${expiration}&makerAddress=${makerAddress}`,
            {
                headers: {
                    'Authorization': 'Bearer okz7YzxXA8DPc7eehhXbolnROttzvKYA',
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
            }
        );

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching from 1inch API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch from 1inch API' },
            { status: 500 }
        );
    }
}
