import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const src = searchParams.get('src');
        const dst = searchParams.get('dst');
        const amount = searchParams.get('amount');
        const from = searchParams.get('from');
        const slippage = searchParams.get('slippage');

        const response = await fetch(
            `https://api.1inch.dev/swap/v6.0/8453/swap?src=${src}&dst=${dst}&amount=${amount}&from=${from}&origin=${from}&slippage=${slippage}`,
            {
                headers: {
                    'Authorization': 'Bearer okz7YzxXA8DPc7eehhXbolnROttzvKYA',
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
            }
        );

        const data = await response.json();

        // Check if the response is an error response
        if (!response.ok) {
            return NextResponse.json(
                {
                    error: data.error || 'Swap request failed',
                    description: data.description,
                    statusCode: data.statusCode || response.status,
                    meta: data.meta,
                    requestId: data.requestId
                },
                { status: data.statusCode || response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in 1inch swap API:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch swap data',
                description: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}
