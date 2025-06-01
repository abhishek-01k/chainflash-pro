import { NextRequest, NextResponse } from 'next/server';
import { getOneInchLimitOrderSDK, type LimitOrderSDKConfig } from '@/lib/services/1inch-limit-order-sdk';
import type { SupportedChainId } from '@/lib/services/1inch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      orderHash,
      chainId,
    } = body;

    // Validate required fields
    if (!orderHash || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderHash and chainId are required' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY || process.env.NEXT_PUBLIC_ONEINCH_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '1inch API key not configured' },
        { status: 500 }
      );
    }

    // Initialize SDK
    const sdkConfig: LimitOrderSDKConfig = {
      authKey: apiKey,
      networkId: chainId as SupportedChainId
    };
    
    const sdk = getOneInchLimitOrderSDK(sdkConfig);

    console.log('Canceling order:', orderHash);

    // Cancel the order
    const result = await sdk.cancelOrder(orderHash);

    console.log('Order canceled successfully:', result);

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error: any) {
    console.error('Error canceling order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
} 