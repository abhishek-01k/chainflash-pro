import { NextRequest, NextResponse } from 'next/server';
import { getOneInchLimitOrderSDK, type CreateOrderParams, type LimitOrderSDKConfig } from '@/lib/services/1inch-limit-order-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      makerAsset,
      takerAsset,
      makingAmount,
      takingAmount,
      maker,
      chainId,
      expiration = 3600,
      allowPartialFill = true,
      allowPriceImprovement = true,
    } = body;

    // Validate required fields
    if (!makerAsset || !takerAsset || !makingAmount || !takingAmount || !maker || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Create order parameters
    const orderParams: CreateOrderParams = {
      makerAsset,
      takerAsset,
      makingAmount: BigInt(makingAmount),
      takingAmount: BigInt(takingAmount),
      maker,
      expiration: parseInt(expiration.toString()),
      allowPartialFill,
      allowPriceImprovement,
    };

    console.log('Creating limit order with params:', orderParams);

    // Validate order parameters
    const validation = sdk.validateOrderParams(orderParams);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Order validation failed: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Create the order
    const order = await sdk.createLimitOrder(orderParams);
    
    // Get typed data for signing
    const typedData = sdk.getOrderTypedData(order);
    const orderHash = sdk.getOrderHash(order);

    console.log('Order created successfully:', { orderHash });

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        // Convert BigInt values to strings for JSON serialization
        makingAmount: order.makingAmount.toString(),
        takingAmount: order.takingAmount.toString(),
        salt: order.salt?.toString(),
        makerTraits: order.makerTraits?.toString(),
      },
      typedData,
      orderHash,
    });

  } catch (error: any) {
    console.error('Error creating limit order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create limit order' },
      { status: 500 }
    );
  }
} 