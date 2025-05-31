import { NextRequest, NextResponse } from 'next/server';
import { getOneInchLimitOrderSDK, type LimitOrderSDKConfig } from '@/lib/services/1inch-limit-order-sdk';
import { LimitOrder } from '@1inch/limit-order-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      order,
      signature,
      chainId,
    } = body;

    // Validate required fields
    if (!order || !signature || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: order, signature, and chainId are required' },
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
      networkId: chainId
    };
    
    const sdk = getOneInchLimitOrderSDK(sdkConfig);

    console.log('Submitting order to 1inch:', { orderHash: order.orderHash });

    // Reconstruct LimitOrder object with BigInt values
    const limitOrder = new LimitOrder({
      salt: BigInt(order.salt || 0),
      maker: order.maker,
      receiver: order.receiver,
      makerAsset: order.makerAsset,
      takerAsset: order.takerAsset,
      makerTraits: BigInt(order.makerTraits || 0),
      makingAmount: BigInt(order.makingAmount),
      takingAmount: BigInt(order.takingAmount),
    });

    // Submit the order
    const result = await sdk.submitOrder(limitOrder, signature);

    console.log('Order submitted successfully:', result);

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error: any) {
    console.error('Error submitting limit order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit limit order' },
      { status: 500 }
    );
  }
} 